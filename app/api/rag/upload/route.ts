import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { ensureSeeded } from '@/lib/seed';
import { chunkByParagraph, chunkByFixedSize, chunkBySemantic, type Chunk, type RagDocument } from '@/lib/rag';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  await ensureSeeded();

  const teamCookie = req.cookies.get('mest_team')?.value;
  if (!teamCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let team: { id: string; name: string };
  try { team = JSON.parse(decodeURIComponent(teamCookie)); } catch { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

  const formData = await req.formData();
  const file = formData.get('file') as File;
  const strategy = (formData.get('strategy') as string) || 'paragraph';
  const chunkSize = parseInt(formData.get('chunkSize') as string || '500');
  const overlap = parseInt(formData.get('overlap') as string || '50');

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  let text = '';
  const fileName = file.name;
  const isPdf = fileName.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

  try {
    if (isPdf) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        text = data.text;
      } catch (err) {
        console.error('[rag-upload] PDF parsing failed:', err);
        return NextResponse.json({
          error: 'PDF text extraction failed. Please copy-paste the PDF content into a .txt file and upload that instead.'
        }, { status: 400 });
      }

      // Sanity check: if the extracted text still contains PDF metadata, extraction failed
      if (text.includes('%PDF-') || text.includes('endobj') || text.includes('/MediaBox')) {
        console.error('[rag-upload] PDF extraction produced raw PDF data instead of text');
        return NextResponse.json({
          error: 'PDF text extraction failed — the output contains PDF metadata instead of readable text. Please copy-paste the PDF content into a .txt file and upload that instead.'
        }, { status: 400 });
      }
    } else {
      // .txt, .md — read as plain text
      text = await file.text();
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `File read failed: ${msg}` }, { status: 400 });
  }

  text = text.trim();
  if (!text) return NextResponse.json({ error: 'File is empty or contains no extractable text' }, { status: 400 });

  // Chunk the text
  let chunkTexts: string[];
  switch (strategy) {
    case 'fixed':
      chunkTexts = chunkByFixedSize(text, chunkSize, overlap);
      break;
    case 'semantic':
      chunkTexts = await chunkBySemantic(text);
      break;
    default:
      chunkTexts = chunkByParagraph(text);
  }

  const docId = crypto.randomUUID();
  const chunks: Chunk[] = chunkTexts.map((t, i) => ({
    id: `${docId}-chunk-${i}`,
    text: t,
    documentName: fileName,
    documentId: docId,
    index: i,
  }));

  const doc: RagDocument = {
    id: docId,
    name: fileName,
    text,
    charCount: text.length,
    chunkCount: chunks.length,
    chunks,
    embedded: false,
  };

  // Get existing docs for this team
  const existing = (await storage.get<RagDocument[]>(`rag:docs:${team.id}`)) || [];
  existing.push(doc);
  await storage.set(`rag:docs:${team.id}`, existing);

  return NextResponse.json({ ok: true, document: { id: docId, name: fileName, charCount: text.length, chunkCount: chunks.length } });
}

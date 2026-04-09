import type { ChainBlock } from './types';
import { openai } from './openai';
import { anthropic } from './anthropic';

export async function* executeChain(blocks: ChainBlock[]): AsyncGenerator<unknown> {
  const outputs: Record<string, unknown> = {};

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    yield { blockId: block.id, status: 'running' };

    try {
      const start = Date.now();
      const output = await executeBlock(block, outputs);
      const durationMs = Date.now() - start;
      outputs[block.id] = output;
      outputs[`block_${i + 1}_output`] = output;
      outputs['previous'] = output;
      yield { blockId: block.id, status: 'done', output, durationMs };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      yield { blockId: block.id, status: 'error', error };
      yield { done: true, success: false };
      return;
    }
  }

  yield { done: true, success: true };
}

function resolveVariables(text: string, outputs: Record<string, unknown>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = outputs[key];
    return typeof value === 'string' ? value : JSON.stringify(value ?? '');
  });
}

async function executeBlock(
  block: ChainBlock,
  outputs: Record<string, unknown>,
): Promise<unknown> {
  switch (block.type) {
    case 'input-text':
      return block.config.value;

    case 'input-image':
    case 'input-audio':
      return block.config.dataUrl;

    case 'process-chat-gpt': {
      const prompt = resolveVariables(block.config.prompt as string, outputs);
      const systemPrompt = block.config.systemPrompt as string | undefined;
      const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
      messages.push({ role: 'user', content: prompt });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: (block.config.temperature as number) ?? 0.7,
      });
      return response.choices[0].message.content;
    }

    case 'process-chat-claude': {
      const prompt = resolveVariables(block.config.prompt as string, outputs);
      const systemPrompt = block.config.systemPrompt as string | undefined;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt || undefined,
        messages: [{ role: 'user', content: prompt }],
        temperature: (block.config.temperature as number) ?? 0.7,
      });
      return response.content[0].type === 'text' ? response.content[0].text : '';
    }

    case 'process-transcribe': {
      const audioDataUrl = outputs['previous'] as string;
      if (!audioDataUrl) throw new Error('No audio input');
      const res = await fetch(audioDataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'audio.webm', { type: 'audio/webm' });
      const result = await openai.audio.transcriptions.create({ file, model: 'whisper-1' });
      return result.text;
    }

    case 'process-tts': {
      const text = typeof outputs['previous'] === 'string' ? outputs['previous'] : '';
      const voice = (block.config.voice as string) || 'nova';
      const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
        input: (text as string).slice(0, 4096),
      });
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return `data:audio/mpeg;base64,${base64}`;
    }

    case 'process-vision-gpt': {
      const prompt = resolveVariables(block.config.prompt as string, outputs);
      const image = outputs['previous'] as string;
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: image } },
          ],
        }],
      });
      return response.choices[0].message.content;
    }

    case 'process-vision-claude': {
      const prompt = resolveVariables(block.config.prompt as string, outputs);
      const image = outputs['previous'] as string;
      const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) throw new Error('Invalid image format');

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: match[2] } },
            { type: 'text', text: prompt },
          ],
        }],
      });
      return response.content[0].type === 'text' ? response.content[0].text : '';
    }

    case 'process-translate': {
      const text = (outputs['previous'] as string) || '';
      const targetLanguage = (block.config.targetLanguage as string) || 'French';
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: `Translate the following text to ${targetLanguage}. Return only the translation, nothing else.\n\n${text}` }],
      });
      return response.choices[0].message.content;
    }

    case 'process-extract-json': {
      const text = (outputs['previous'] as string) || '';
      const schema = block.config.schema as string;
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: `Extract data from the text below according to this schema: ${schema}\n\nText:\n${text}\n\nReturn only valid JSON, nothing else.` }],
        response_format: { type: 'json_object' },
      });
      return response.choices[0].message.content;
    }

    case 'process-summarize': {
      const text = (outputs['previous'] as string) || '';
      const maxWords = (block.config.maxWords as number) || 50;
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: `Summarize the following in ${maxWords} words or fewer:\n\n${text}` }],
      });
      return response.choices[0].message.content;
    }

    case 'output-text':
    case 'output-audio':
    case 'output-image':
      return outputs['previous'];

    default:
      throw new Error(`Unknown block type: ${block.type}`);
  }
}

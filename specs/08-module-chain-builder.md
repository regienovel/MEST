# 08 — Module: Chain Builder

The most ambitious module. A visual, block-based editor where teams compose multi-step AI workflows. This is what lets them build something "impossible" in 90 minutes.

## Route

`/studio/chain`

## Core Concept

A chain is a **vertical list of blocks** that run in order. Each block's output becomes available to subsequent blocks. This is NOT a node graph — it's a linear flow for simplicity and speed of build.

Blocks connect implicitly: block N+1 can reference block N's output via a variable placeholder like `{{block_1_output}}`.

## Block Types

### Input Blocks (provide data to the chain)

| Type | Config | Output |
|---|---|---|
| `input-text` | `{ value: string }` | Static text |
| `input-image` | `{ dataUrl: string }` | Image (base64) |
| `input-audio` | `{ dataUrl: string }` | Audio blob |

### Process Blocks (transform data)

| Type | Config | Input | Output |
|---|---|---|---|
| `process-chat-gpt` | `{ prompt: string, systemPrompt?: string, temperature: number }` | Previous block output | Text |
| `process-chat-claude` | `{ prompt: string, systemPrompt?: string, temperature: number }` | Previous block output | Text |
| `process-transcribe` | `{}` | Audio blob | Text |
| `process-tts` | `{ voice: string }` | Text | Audio blob |
| `process-vision-gpt` | `{ prompt: string }` | Image | Text |
| `process-vision-claude` | `{ prompt: string }` | Image | Text |
| `process-translate` | `{ targetLanguage: string }` | Text | Text |
| `process-extract-json` | `{ schema: string }` | Text | JSON string |
| `process-summarize` | `{ maxWords: number }` | Text | Text |

### Output Blocks (display final results)

| Type | Config | Input |
|---|---|---|
| `output-text` | `{ label: string }` | Text |
| `output-audio` | `{ label: string }` | Audio blob |
| `output-image` | `{ label: string }` | Image |

## Prompt Variable References

Inside any text field in a process block config (e.g., `prompt` in `process-chat-gpt`), users can reference previous block outputs:

- `{{previous}}` — output of the immediately preceding block
- `{{block_1_output}}`, `{{block_2_output}}`, etc. — output of a specific block by position

The executor resolves these before passing to the model.

## UI Layout

```
┌────────────────────────────────────────────────────────┐
│ [← Studio]  Chain Builder                              │
│                                                         │
│ Chain name: [My Voice Translator            ] [Save]  │
│ [Templates ▼]  [Clear]  [Fork existing]              │
│                                                         │
│ ┌───── Blocks ─────┐  ┌────── Canvas ──────────┐    │
│ │                  │  │                          │    │
│ │ INPUTS           │  │  ┌──────────────────┐  │    │
│ │ [+ Text]         │  │  │ 1. Input Audio   │  │    │
│ │ [+ Image]        │  │  │    [🎤 Record]   │  │    │
│ │ [+ Audio]        │  │  └──────────────────┘  │    │
│ │                  │  │                          │    │
│ │ PROCESS          │  │  ┌──────────────────┐  │    │
│ │ [+ Chat GPT]     │  │  │ 2. Transcribe    │  │    │
│ │ [+ Chat Claude]  │  │  │    [⚙ Config]    │  │    │
│ │ [+ Transcribe]   │  │  └──────────────────┘  │    │
│ │ [+ TTS]          │  │                          │    │
│ │ [+ Vision GPT]   │  │  ┌──────────────────┐  │    │
│ │ [+ Vision Claude]│  │  │ 3. Translate     │  │    │
│ │ [+ Translate]    │  │  │    [⚙ Config]    │  │    │
│ │ [+ Extract JSON] │  │  └──────────────────┘  │    │
│ │ [+ Summarize]    │  │                          │    │
│ │                  │  │  ┌──────────────────┐  │    │
│ │ OUTPUTS          │  │  │ 4. TTS           │  │    │
│ │ [+ Text]         │  │  │    [⚙ Config]    │  │    │
│ │ [+ Audio]        │  │  └──────────────────┘  │    │
│ │ [+ Image]        │  │                          │    │
│ │                  │  │  ┌──────────────────┐  │    │
│ └──────────────────┘  │  │ 5. Output Audio  │  │    │
│                        │  └──────────────────┘  │    │
│                        │                          │    │
│                        │  [▶ Run Chain]          │    │
│                        └──────────────────────────┘    │
└────────────────────────────────────────────────────────┘
```

## Interactions

### Adding Blocks
- Click a block type in the left sidebar
- Block appears at the bottom of the canvas
- Click anywhere on a block to expand/edit its config

### Reordering Blocks
- Drag handle on left of each block
- Drop between other blocks to reorder
- Use `@dnd-kit/core` library for drag-drop (or native HTML5 if time is tight)

### Removing Blocks
- Small X button in the top-right of each block

### Block Config Panel
- When a block is selected, show its config fields inline (expand downward)
- Different fields per block type (see Block Types table)
- Changes save to local state immediately

### Running a Chain
- "Run Chain" button at the bottom
- Button turns into "Running..." with a progress indicator
- As each block executes, it lights up with a colored border (blue = running, green = done, red = failed)
- Block outputs appear inline below each block
- Final output block displays prominently
- Full execution log is available in an expandable panel

### Saving a Chain
- "Save" button prompts for name (required) and description (optional)
- Saves to `chain:{id}` in storage
- Adds to Gallery as `type: 'chain'`
- Awards +25 XP (chains are hard, reward accordingly)

### Templates
- "Templates" dropdown at top
- Lists the 6 seed templates from `/seed/templates.json`
- Selecting a template clones it into the canvas (editable, not readonly)

### Forking
- "Fork existing" opens a dialog with all saved chains from Gallery
- Selecting one clones it to the current canvas
- Original team gets notification / +5 XP when their chain is forked

## API Endpoints

### `POST /api/chain/save`

Request:
```json
{
  "name": "My Chain",
  "description": "...",
  "blocks": [...],
  "forkedFrom": "optional-chain-id"
}
```

Response: `{ ok: true, chainId: "..." }`

### `POST /api/chain/run`

Request:
```json
{
  "blocks": [...]
}
```

Response: Server-Sent Events stream with block-by-block updates

```
data: {"blockId": "1", "status": "running"}
data: {"blockId": "1", "status": "done", "output": "..."}
data: {"blockId": "2", "status": "running"}
data: {"blockId": "2", "status": "done", "output": "..."}
data: {"done": true, "success": true, "totalDurationMs": 5432}
```

Error case for a block:
```
data: {"blockId": "3", "status": "error", "error": "API rate limit exceeded"}
data: {"done": true, "success": false}
```

## Executor Implementation

Create `/lib/chain-executor.ts`:

```typescript
import type { ChainBlock } from './types';
import { openai } from './openai';
import { anthropic } from './anthropic';

export async function* executeChain(blocks: ChainBlock[]): AsyncGenerator<unknown> {
  const outputs: Record<string, unknown> = {};

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    yield { blockId: block.id, status: 'running' };

    try {
      const output = await executeBlock(block, outputs, i);
      outputs[block.id] = output;
      outputs[`block_${i + 1}_output`] = output;
      outputs.previous = output;
      yield { blockId: block.id, status: 'done', output };
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
  index: number
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
      const messages: Array<{role: string; content: string}> = [];
      if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
      messages.push({ role: 'user', content: prompt });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages as Array<{role: 'system' | 'user' | 'assistant'; content: string}>,
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
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        temperature: (block.config.temperature as number) ?? 0.7,
      });
      return response.content[0].type === 'text' ? response.content[0].text : '';
    }

    case 'process-transcribe': {
      const audioDataUrl = (outputs.previous as string);
      // Convert data URL to Blob then File
      const response = await fetch(audioDataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'audio.webm', { type: 'audio/webm' });
      const result = await openai.audio.transcriptions.create({
        file,
        model: 'whisper-1',
      });
      return result.text;
    }

    case 'process-tts': {
      const text = resolveVariables((outputs.previous as string) || '', outputs);
      const voice = (block.config.voice as string) || 'nova';
      const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
        input: text,
      });
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return `data:audio/mpeg;base64,${base64}`;
    }

    case 'process-vision-gpt': {
      const prompt = resolveVariables(block.config.prompt as string, outputs);
      const image = outputs.previous as string;
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
      const image = outputs.previous as string;
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const mediaType = image.match(/data:image\/(\w+);/)?.[1] || 'jpeg';

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: `image/${mediaType}` as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp', data: base64Data } },
            { type: 'text', text: prompt },
          ],
        }],
      });
      return response.content[0].type === 'text' ? response.content[0].text : '';
    }

    case 'process-translate': {
      const text = (outputs.previous as string) || '';
      const targetLanguage = (block.config.targetLanguage as string) || 'French';
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: `Translate the following text to ${targetLanguage}. Return only the translation, nothing else.\n\n${text}`,
        }],
      });
      return response.choices[0].message.content;
    }

    case 'process-extract-json': {
      const text = (outputs.previous as string) || '';
      const schema = block.config.schema as string;
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: `Extract data from the text below according to this schema: ${schema}\n\nText:\n${text}\n\nReturn only valid JSON, nothing else.`,
        }],
        response_format: { type: 'json_object' },
      });
      return response.choices[0].message.content;
    }

    case 'process-summarize': {
      const text = (outputs.previous as string) || '';
      const maxWords = (block.config.maxWords as number) || 50;
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: `Summarize the following in ${maxWords} words or fewer:\n\n${text}`,
        }],
      });
      return response.choices[0].message.content;
    }

    case 'output-text':
    case 'output-audio':
    case 'output-image':
      return outputs.previous;

    default:
      throw new Error(`Unknown block type: ${(block as ChainBlock).type}`);
  }
}
```

## Success Criteria

- [ ] User can add blocks from a palette
- [ ] Blocks can be reordered (drag-drop or up/down buttons)
- [ ] Blocks can be removed
- [ ] Block config is editable inline
- [ ] Variable references (`{{previous}}`) are resolved correctly
- [ ] User can run a chain and see each block execute with live status
- [ ] Block outputs appear inline after execution
- [ ] User can save a chain with a name
- [ ] User can load a template from the dropdown
- [ ] User can fork another team's chain from Gallery
- [ ] All 6 templates load and run successfully

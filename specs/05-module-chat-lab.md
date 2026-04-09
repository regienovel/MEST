# 05 — Module: Chat Lab

The flagship of Day 1. This is where "the AI is a black box" becomes visceral through **Compare Mode**.

## Route

`/studio/chat` — single-page interface

## Features

### 1. Single Model Mode (default)
- Chat interface with message history
- Text input at the bottom with auto-grow textarea
- Model toggle at top: `GPT-4o` | `Claude Sonnet 4` | `Compare Both`
- Send button (or Cmd/Ctrl+Enter)
- Streaming responses token-by-token
- "Stop generating" button during streaming

### 2. Compare Mode (the flagship feature)
- Split the chat area vertically into two columns
- Left column: GPT-4o label, responses from OpenAI
- Right column: Claude Sonnet 4 label, responses from Anthropic
- Both stream in parallel when a message is sent
- Shared input at the bottom feeds both
- Visual cue when models complete at different speeds (subtle timestamp)
- Clear visual indication when they disagree (not enforced programmatically — just make the layout allow side-by-side reading)

### 3. System Prompt
- Collapsible panel at the top with a textarea for custom system prompt
- Preset dropdown with bilingual options (see `specs/11-i18n-strings.md` for exact text):
  - West African market trader
  - Twi-speaking health worker
  - Francophone logistics coordinator
  - Honest critic
  - Blank (no system prompt)
- System prompt applies to both models in Compare Mode

### 4. Image Upload
- Paperclip icon next to the input
- Accepts jpg, png, webp, up to 4MB
- Image appears as a thumbnail above the input before sending
- Sent as part of the next user message
- Both GPT-4o and Claude support vision in their chat APIs

### 5. Save to Gallery
- "Save to Gallery" button above the chat area
- Prompts for a title (defaults to the first 60 chars of the first user message)
- Saves the full conversation as a GalleryItem with type `chat`
- Awards +10 XP to the team

### 6. Export
- "Export" button that downloads the conversation as markdown
- Format: `# Chat — {title}\n\n**Team:** {team}\n**Date:** {date}\n\n---\n\n## User\n...\n\n## GPT-4o\n...\n`

### 7. Advanced Panel (collapsible)
- Temperature slider (0 to 2, default 0.7)
- Max tokens (256 to 4096, default 1024)
- Applies to both models in Compare Mode

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│ [← Studio]  Chat Lab            [Save] [Export] [⚙] │
│                                                       │
│ [GPT-4o] [Claude] [Compare Both]          [System ▼] │
│                                                       │
│ ┌───────────────────────────────────────────────┐   │
│ │                                                │   │
│ │  User: What is the price of rice in Lagos?   │   │
│ │                                                │   │
│ │  GPT-4o: Rice prices in Lagos vary...         │   │
│ │                                                │   │
│ │  User: And in Abidjan?                        │   │
│ │                                                │   │
│ │  GPT-4o: In Abidjan, rice...                  │   │
│ │                                                │   │
│ └───────────────────────────────────────────────┘   │
│                                                       │
│ [📎] [Type your message...]                [Send →] │
└─────────────────────────────────────────────────────┘
```

Compare Mode layout:

```
┌─────────────────────────────────────────────────────┐
│ [← Studio]  Chat Lab — Compare Mode   [Save] [⚙]   │
│                                                       │
│ ┌──── GPT-4o ────┐┌──── Claude Sonnet ────┐        │
│ │                ││                         │        │
│ │ User question  ││ User question           │        │
│ │                ││                         │        │
│ │ GPT response   ││ Claude response         │        │
│ │ streaming...   ││ streaming...            │        │
│ │                ││                         │        │
│ └────────────────┘└─────────────────────────┘        │
│                                                       │
│ [📎] [Shared input for both models]       [Send →]  │
└─────────────────────────────────────────────────────┘
```

## API Endpoint

`POST /api/chat`

Request:
```typescript
{
  model: 'gpt-4o' | 'claude-sonnet' | 'both',
  messages: Array<{
    role: 'system' | 'user' | 'assistant',
    content: string,
    image?: string, // base64 data URL
  }>,
  temperature?: number,
  maxTokens?: number,
}
```

Response: Server-Sent Events stream

- For `gpt-4o` or `claude-sonnet`: streams text chunks with format `data: {"chunk": "text"}\n\n`
- For `both`: streams chunks with source tag: `data: {"source": "gpt", "chunk": "text"}\n\n` and `data: {"source": "claude", "chunk": "text"}\n\n`
- End of stream: `data: {"done": true}\n\n`
- Error: `data: {"error": "message"}\n\n`

## Implementation Notes

### Model IDs
- OpenAI: `gpt-4o`
- Anthropic: `claude-sonnet-4-20250514` (stable model ID)

### Compare Mode Parallelism
Run both API calls in parallel with `Promise.all` and interleave their chunks into a single stream using a ReadableStream:

```typescript
async function handleBoth(messages, temp, maxTokens) {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const gpt = streamOpenAI(messages, temp, maxTokens);
      const claude = streamAnthropic(messages, temp, maxTokens);

      const gptPromise = (async () => {
        for await (const chunk of gpt) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ source: 'gpt', chunk })}\n\n`
          ));
        }
      })();

      const claudePromise = (async () => {
        for await (const chunk of claude) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ source: 'claude', chunk })}\n\n`
          ));
        }
      })();

      await Promise.all([gptPromise, claudePromise]);
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      controller.close();
    },
  });
}
```

### Image Handling
Images come in as base64 data URLs in the message. Pass directly to OpenAI (`image_url` content type) and Anthropic (`image` content block with base64 source).

### Rate Limiting
Before every call, check `usage:{teamId}:{currentHour}`. If >= rate limit (default 200), return an error with friendly message in EN/FR.

### Error Handling
If one model fails in Compare Mode, the other should still complete. Surface the error in the failed column with a clear message: "GPT-4o is unavailable right now. Claude's response continues below." / "GPT-4o est indisponible. La réponse de Claude continue ci-dessous."

### System Prompt Defaults
If no system prompt provided, use: "You are a helpful assistant. Respond in the language the user is writing in."

## Client-Side Component Structure

```
app/studio/chat/page.tsx                → Server component, gets team, renders client
components/studio/chat-lab.tsx          → Main client component
components/studio/chat-message.tsx      → Single message bubble
components/studio/chat-input.tsx        → Textarea + image upload + send
components/studio/model-toggle.tsx      → 3-way toggle
components/studio/system-prompt-panel.tsx → Collapsible system prompt
components/studio/save-dialog.tsx       → Save to Gallery modal
```

Use React hooks for state. Keep streaming logic in a custom hook `useChatStream` in `/lib/hooks/use-chat-stream.ts`.

## Success Criteria

- [ ] User can send a message in single model mode and see streaming response
- [ ] User can toggle to Compare Mode and see both GPT and Claude responding in parallel
- [ ] User can upload an image and ask a question about it
- [ ] User can set a custom system prompt or use a preset
- [ ] User can save a conversation to Gallery
- [ ] User can export as markdown
- [ ] Rate limit returns friendly error when exceeded
- [ ] If one model fails in Compare Mode, the other still completes
- [ ] All UI strings are bilingual

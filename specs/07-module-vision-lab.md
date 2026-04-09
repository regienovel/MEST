# 07 — Module: Vision Lab

Shows learners that AI can *see*. Grounds AI in their physical West African context — market photos, farm crops, handwritten receipts, street signs. This module is where bias and accuracy gaps become visible fast.

## Route

`/studio/vision`

## Features

### 1. Image Upload
- Drag-and-drop zone (full-width, tall)
- "Click to upload" fallback
- "Use camera" button on mobile (uses `<input type="file" accept="image/*" capture="environment">`)
- Accepts jpg, png, webp, gif
- Max 8MB per image
- Multi-image support: up to 3 images in one query (Claude handles multi-image well)
- Preview thumbnails for uploaded images with remove button

### 2. Preset Prompt Library
Dropdown above the prompt textarea with bilingual presets:

**English presets:**
- "Identify every product visible and estimate prices in local currency"
- "Describe what you see in detail"
- "Translate every piece of text visible in this image"
- "Is this a receipt, invoice, or contract? Extract the key information."
- "What can you tell me about the health of this crop or plant?"
- "Identify any signs of informal credit, bargaining, or trade relationships"
- "Describe the people in this image — age, clothing, what they might be doing"
- "Extract all numerical data and format as a table"
- "Write a social media caption for this image"
- "(Custom prompt)"

**French presets:**
- "Identifiez tous les produits visibles et estimez les prix en monnaie locale"
- "Décrivez ce que vous voyez en détail"
- "Traduisez tout texte visible dans cette image"
- "S'agit-il d'un reçu, d'une facture ou d'un contrat ? Extrayez les informations clés."
- "Que pouvez-vous me dire sur la santé de cette culture ou plante ?"
- "Identifiez tout signe de crédit informel, marchandage ou relations commerciales"
- "Décrivez les personnes dans cette image — âge, vêtements, ce qu'elles font peut-être"
- "Extrayez toutes les données numériques et formatez-les sous forme de tableau"
- "Rédigez une légende pour réseaux sociaux pour cette image"
- "(Invite personnalisée)"

### 3. Custom Prompt
- Textarea below presets for user's own question
- Selecting a preset fills the textarea; user can edit further

### 4. Model Selection
- Toggle: GPT-4o Vision | Claude Vision | Compare Both
- Compare Mode shows side-by-side responses

### 5. Response Display
- Streaming text response below the images
- In Compare Mode, two columns
- "Ask follow-up" button to continue the conversation about the same image(s)

### 6. Save to Gallery
- Saves images (as base64 or blob reference) + prompt + response
- Awards +10 XP

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│ [← Studio]  Vision Lab              [Save]          │
│                                                       │
│ [GPT-4o] [Claude] [Compare Both]                    │
│                                                       │
│ ┌─────────────────────────────────────────────┐    │
│ │                                                │    │
│ │        📸  Drop image here or click           │    │
│ │            (or use camera on mobile)          │    │
│ │                                                │    │
│ └─────────────────────────────────────────────┘    │
│                                                       │
│ [Preset prompts ▼]                                  │
│ ┌─────────────────────────────────────────────┐    │
│ │ What do you want to know about this image?   │    │
│ │                                                │    │
│ └─────────────────────────────────────────────┘    │
│                                 [Analyze →]         │
│                                                       │
│ ─────────────────────────────────────────────────  │
│                                                       │
│ Response streams here...                            │
│                                                       │
└─────────────────────────────────────────────────────┘
```

## API Endpoint

`POST /api/vision`

Request:
```json
{
  "model": "gpt-4o" | "claude-sonnet" | "both",
  "images": ["data:image/jpeg;base64,..."],
  "prompt": "What is in this image?",
  "systemPrompt": "optional"
}
```

Response: Server-Sent Events stream (same format as chat endpoint)

Implementation:
- For OpenAI: Use chat completions with `image_url` content type
- For Anthropic: Use messages API with `image` content block (base64 source)
- Compare Mode runs both in parallel like Chat Lab

## Client-Side Image Handling

```typescript
async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function resizeIfLarge(dataUrl: string, maxDim = 2048): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await new Promise(r => img.onload = r);

  if (img.width <= maxDim && img.height <= maxDim) return dataUrl;

  const canvas = document.createElement('canvas');
  const scale = maxDim / Math.max(img.width, img.height);
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
}
```

Use `resizeIfLarge` before uploading to reduce API costs and speed up responses.

## Success Criteria

- [ ] User can upload images via drag-drop, click, or mobile camera
- [ ] Multi-image upload works (up to 3)
- [ ] Preset prompts appear in a dropdown and fill the textarea when selected
- [ ] Custom prompts work
- [ ] GPT-4o Vision responds correctly with streaming
- [ ] Claude Vision responds correctly with streaming
- [ ] Compare Mode shows both responses side-by-side
- [ ] User can save the analysis to Gallery
- [ ] Large images are resized client-side before upload
- [ ] All UI strings are bilingual

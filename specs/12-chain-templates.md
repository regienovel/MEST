# 12 — Chain Templates

Six seed templates that appear in the Chain Builder's Templates dropdown. These are designed to be audacious AND to naturally reveal AI trust failures when run.

Templates are seeded from `/seed/templates.json`. The file structure:

```json
{
  "templates": [
    {
      "id": "template-market-whisperer",
      "name": "Market Whisperer",
      "nameFr": "Le Murmure du Marché",
      "description": "Upload a market photo. Get products, prices, credit signals, and a Twi voice summary.",
      "descriptionFr": "Téléversez une photo de marché. Obtenez produits, prix, signaux de crédit, et un résumé vocal en twi.",
      "blocks": [ ... ]
    },
    ...
  ]
}
```

Each template has 4-6 blocks. All templates are editable — users can modify them after loading.

## The Six Templates

### 1. Market Whisperer
**Goal:** Upload a West African market photo, get an AI-powered market intelligence brief with a voice summary in a local language.

**Blocks:**
1. `input-image` (user uploads photo)
2. `process-vision-gpt` — prompt: "You are a West African market intelligence analyst. Identify every product visible in this image, estimate prices in local currency (Naira, Cedi, CFA), and flag any signs of informal credit or bargaining. Be specific. If you are unsure about a product's identity or price, say so."
3. `process-summarize` — maxWords: 80
4. `process-translate` — targetLanguage: "Twi"
5. `process-tts` — voice: "nova"
6. `output-audio`

### 2. The Duel
**Goal:** Ask both GPT-4o and Claude the same question, then have each critique the other's answer.

**Blocks:**
1. `input-text` (user enters a question — defaults to "What is the most important lesson for West African entrepreneurs building AI products today?")
2. `process-chat-gpt` — prompt: "{{previous}}\n\nAnswer clearly and specifically. Take a position. Do not hedge."
3. `process-chat-claude` — prompt: "Here is GPT-4o's answer to this question: \"{{block_1_output}}\"\n\nGPT-4o said:\n{{block_2_output}}\n\nAs Claude, what are the three biggest weaknesses in GPT-4o's answer? Be specific and cite passages."
4. `output-text`

### 3. Voice of the Street
**Goal:** Record yourself in any language, watch AI transcribe, translate to French, and speak the French version back.

**Blocks:**
1. `input-audio` (user records voice)
2. `process-transcribe`
3. `process-translate` — targetLanguage: "French"
4. `process-tts` — voice: "alloy"
5. `output-audio`

### 4. The Receipt Whisperer
**Goal:** Upload a photo of a handwritten receipt or informal ledger, extract structured data.

**Blocks:**
1. `input-image`
2. `process-vision-gpt` — prompt: "This is a receipt or informal ledger. Extract every line item, quantity, and price. Compute the total. Flag any anomalies or items you cannot read clearly."
3. `process-extract-json` — schema: "{ items: [{ name: string, quantity: number, unitPrice: number, total: number }], subtotal: number, total: number, currency: string, anomalies: string[] }"
4. `output-text`

### 5. Two Minds
**Goal:** GPT proposes a business idea, Claude critiques it, GPT rebuts. A 3-step intellectual duel.

**Blocks:**
1. `input-text` (default: "A young entrepreneur in Abidjan wants to start an AI-powered business serving informal market traders. What business should they build and why?")
2. `process-chat-gpt` — prompt: "{{previous}}\n\nBe specific. Name the product, the customer, and the first revenue stream. Avoid generic advice."
3. `process-chat-claude` — prompt: "A business strategist has proposed this idea:\n\n{{block_2_output}}\n\nWhat are the three biggest reasons this will fail in a West African context? Be specific and brutal. Focus on local market realities most Western analysts miss."
4. `process-chat-gpt` — prompt: "Someone critiqued your business idea. Your original idea:\n\n{{block_2_output}}\n\nTheir critique:\n\n{{block_3_output}}\n\nRebut their critique. Concede any valid points. Defend the rest."
5. `output-text`

### 6. Multilingual Broadcaster
**Goal:** Type one message in English. Get it translated to Twi, Yoruba, Wolof, Hausa, and French, with voice recordings of each.

**Blocks (simplified to stay within practical block count):**
1. `input-text` (user enters message in English)
2. `process-chat-gpt` — prompt: "Translate this message into Twi, Yoruba, Wolof, Hausa, and French. Format as JSON with keys: twi, yoruba, wolof, hausa, french. Message:\n\n{{previous}}"
3. `process-extract-json` — schema: "{ twi: string, yoruba: string, wolof: string, hausa: string, french: string }"
4. `output-text`

**Note:** Template 6 is simpler than the original spec because the Chain Builder is linear. Multi-output chains would require a different architecture. Users can save this chain and run it, then copy individual translations and use Voice Lab to hear each spoken aloud.

## Full JSON for /seed/templates.json

```json
{
  "templates": [
    {
      "id": "template-market-whisperer",
      "name": "Market Whisperer",
      "nameFr": "Le Murmure du Marché",
      "description": "Upload a market photo. Get products, prices, credit signals, and a Twi voice summary.",
      "descriptionFr": "Téléversez une photo de marché. Obtenez produits, prix, signaux de crédit, et un résumé vocal en twi.",
      "blocks": [
        { "id": "b1", "type": "input-image", "config": { "dataUrl": "" } },
        { "id": "b2", "type": "process-vision-gpt", "config": { "prompt": "You are a West African market intelligence analyst. Identify every product visible in this image, estimate prices in local currency (Naira, Cedi, CFA), and flag any signs of informal credit or bargaining. Be specific. If you are unsure about a product's identity or price, say so." } },
        { "id": "b3", "type": "process-summarize", "config": { "maxWords": 80 } },
        { "id": "b4", "type": "process-translate", "config": { "targetLanguage": "Twi" } },
        { "id": "b5", "type": "process-tts", "config": { "voice": "nova" } },
        { "id": "b6", "type": "output-audio", "config": { "label": "Market summary in Twi" } }
      ]
    },
    {
      "id": "template-the-duel",
      "name": "The Duel",
      "nameFr": "Le Duel",
      "description": "Ask GPT and Claude the same question. Watch Claude critique GPT's answer.",
      "descriptionFr": "Posez la même question à GPT et Claude. Regardez Claude critiquer la réponse de GPT.",
      "blocks": [
        { "id": "b1", "type": "input-text", "config": { "value": "What is the most important lesson for West African entrepreneurs building AI products today?" } },
        { "id": "b2", "type": "process-chat-gpt", "config": { "prompt": "{{previous}}\n\nAnswer clearly and specifically. Take a position. Do not hedge." } },
        { "id": "b3", "type": "process-chat-claude", "config": { "prompt": "Here is GPT-4o's answer to a question.\n\nThe question was: {{block_1_output}}\n\nGPT-4o said:\n{{block_2_output}}\n\nAs Claude, what are the three biggest weaknesses in GPT-4o's answer? Be specific and cite passages." } },
        { "id": "b4", "type": "output-text", "config": { "label": "Claude's critique" } }
      ]
    },
    {
      "id": "template-voice-of-street",
      "name": "Voice of the Street",
      "nameFr": "La Voix de la Rue",
      "description": "Record in any language. Hear it transcribed, translated to French, and spoken back.",
      "descriptionFr": "Enregistrez dans n'importe quelle langue. Entendez-la transcrite, traduite en français et lue à voix haute.",
      "blocks": [
        { "id": "b1", "type": "input-audio", "config": { "dataUrl": "" } },
        { "id": "b2", "type": "process-transcribe", "config": {} },
        { "id": "b3", "type": "process-translate", "config": { "targetLanguage": "French" } },
        { "id": "b4", "type": "process-tts", "config": { "voice": "alloy" } },
        { "id": "b5", "type": "output-audio", "config": { "label": "French translation spoken" } }
      ]
    },
    {
      "id": "template-receipt-whisperer",
      "name": "The Receipt Whisperer",
      "nameFr": "Le Lecteur de Reçus",
      "description": "Upload a handwritten receipt. Get structured data and flagged anomalies.",
      "descriptionFr": "Téléversez un reçu manuscrit. Obtenez des données structurées et les anomalies signalées.",
      "blocks": [
        { "id": "b1", "type": "input-image", "config": { "dataUrl": "" } },
        { "id": "b2", "type": "process-vision-gpt", "config": { "prompt": "This is a receipt or informal ledger. Extract every line item, quantity, and price. Compute the total. Flag any anomalies or items you cannot read clearly. Be thorough." } },
        { "id": "b3", "type": "process-extract-json", "config": { "schema": "{ items: [{ name: string, quantity: number, unitPrice: number, total: number }], subtotal: number, total: number, currency: string, anomalies: string[] }" } },
        { "id": "b4", "type": "output-text", "config": { "label": "Extracted data" } }
      ]
    },
    {
      "id": "template-two-minds",
      "name": "Two Minds",
      "nameFr": "Deux Esprits",
      "description": "GPT proposes a business idea. Claude critiques it. GPT rebuts. A three-step intellectual duel.",
      "descriptionFr": "GPT propose une idée. Claude la critique. GPT répond. Un duel intellectuel en trois étapes.",
      "blocks": [
        { "id": "b1", "type": "input-text", "config": { "value": "A young entrepreneur in Abidjan wants to start an AI-powered business serving informal market traders. What business should they build and why?" } },
        { "id": "b2", "type": "process-chat-gpt", "config": { "prompt": "{{previous}}\n\nBe specific. Name the product, the customer, and the first revenue stream. Avoid generic advice." } },
        { "id": "b3", "type": "process-chat-claude", "config": { "prompt": "A business strategist has proposed this idea:\n\n{{block_2_output}}\n\nWhat are the three biggest reasons this will fail in a West African context? Be specific and brutal. Focus on local market realities most Western analysts miss." } },
        { "id": "b4", "type": "process-chat-gpt", "config": { "prompt": "Someone critiqued your business idea.\n\nYour original idea:\n{{block_2_output}}\n\nTheir critique:\n{{block_3_output}}\n\nRebut their critique. Concede any valid points. Defend the rest." } },
        { "id": "b5", "type": "output-text", "config": { "label": "The rebuttal" } }
      ]
    },
    {
      "id": "template-multilingual-broadcaster",
      "name": "Multilingual Broadcaster",
      "nameFr": "Le Diffuseur Multilingue",
      "description": "Type one message. Get it translated to 5 West African languages plus French.",
      "descriptionFr": "Tapez un message. Obtenez-le traduit en 5 langues ouest-africaines et en français.",
      "blocks": [
        { "id": "b1", "type": "input-text", "config": { "value": "New solar charging station now open at Makola Market. Open 6am to 8pm daily. Pay only 2 cedis for a full phone charge." } },
        { "id": "b2", "type": "process-chat-gpt", "config": { "prompt": "Translate this message into Twi, Yoruba, Wolof, Hausa, and French. Format as JSON with keys: twi, yoruba, wolof, hausa, french.\n\nMessage:\n{{previous}}" } },
        { "id": "b3", "type": "process-extract-json", "config": { "schema": "{ twi: string, yoruba: string, wolof: string, hausa: string, french: string }" } },
        { "id": "b4", "type": "output-text", "config": { "label": "Translations" } }
      ]
    }
  ]
}
```

This file should be written to `/seed/templates.json` at the project root.

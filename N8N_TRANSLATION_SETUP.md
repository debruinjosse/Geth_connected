# n8n Translation Setup

The app now includes a global language switcher. It calls:

```text
POST /api/translate
```

That route forwards requests to n8n when `N8N_TRANSLATE_WEBHOOK_URL` is configured. If n8n is not configured or fails, the app falls back to a Google Translate translated-page URL.

## Environment Variable

Add this to `.env.local`:

```env
N8N_TRANSLATE_WEBHOOK_URL=https://your-n8n-domain.com/webhook/geth-translate
```

Restart the dev server after adding it.

## n8n Workflow

Create a workflow with:

1. Webhook node
   - Method: `POST`
   - Path: `geth-translate`
   - Response mode: respond with final node

2. Optional logic node
   - Read `targetLanguage`
   - Read `sourceUrl`
   - Read `fallbackUrl`

3. Respond to Webhook node
   - Return JSON:

```json
{
  "translatedUrl": "={{$json.fallbackUrl}}"
}
```

This uses Google Translate's hosted translated page. Later, you can replace this with a paid Google Cloud Translation workflow if you want server-side translated content.

## Request Shape

The app sends:

```json
{
  "targetLanguage": "nl",
  "sourceUrl": "http://localhost:3000/",
  "pathname": "/",
  "fallbackUrl": "https://translate.google.com/translate?sl=auto&tl=nl&u=http%3A%2F%2Flocalhost%3A3000%2F",
  "product": "GETH Connected Cards"
}
```

## Supported Languages

- English `en`
- Dutch `nl`
- French `fr`
- German `de`
- Spanish `es`
- Arabic `ar`
- Urdu `ur`

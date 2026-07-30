# GETH Mail Setup

## TransIP Mailbox

Use the TransIP mailbox `info@geth.pro` for app-generated emails.

Required SMTP settings:

```env
SMTP_HOST=smtp.transip.email
SMTP_PORT=465
SMTP_USER=info@geth.pro
SMTP_PASS=<mailbox password>
SMTP_FROM="GETH <info@geth.pro>"
SMTP_REPLY_TO=info@geth.pro
```

`SMTP_PASS` must be the mailbox password for `info@geth.pro`, not the TransIP control-panel password.

## Local Setup

Add the six SMTP variables above to `.env.local`. Do not commit `.env.local`.

To verify the connection without sending an email:

```powershell
npm run test:smtp
```

To send one test email to `info@geth.pro`:

```powershell
npm run test:smtp -- --send
```

## Vercel Setup

Add the same six SMTP variables in Vercel Environment Variables for Production and Preview, then redeploy.

Or sync from your local `.env.local` automatically:

```powershell
# Create a token at https://vercel.com/account/tokens
$env:VERCEL_TOKEN="your-token"
$env:VERCEL_PROJECT_NAME="geth-connected"   # optional if project id known
npm run env:push-production
```

The script updates SMTP + `NEXT_PUBLIC_APP_URL` and prints a Supabase Auth SMTP checklist.

After changing SMTP variables you must redeploy—runtime env vars are baked in at build time for server actions.

## Supabase Auth Emails (magic links, signup, password reset)

Invite emails sent by the app use Nodemailer + the SMTP variables above.

Auth emails (signup confirmation, magic links, password reset) use **Supabase Dashboard → Project Settings → Authentication → SMTP Settings**. Configure the same TransIP mailbox:

- Host: `smtp.transip.email`
- Port: `465`
- User: `info@geth.pro`
- Sender email: `info@geth.pro`
- Sender name: `GETH`

Until Supabase Auth SMTP is configured, auth emails may still come from the default Supabase sender or an old test mailbox.

## WhatsApp Support

The support form links to WhatsApp using:

```env
NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER=31613795467
```

The button opens a direct `wa.me` chat with the prepared support request text.

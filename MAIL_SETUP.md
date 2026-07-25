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

## WhatsApp Support

The support form links to WhatsApp using:

```env
NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER=31613795467
```

The button opens a direct `wa.me` chat with the prepared support request text.

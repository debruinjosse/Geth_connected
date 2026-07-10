# Supabase Auth Email Template

Use `magic-link.html` for the Supabase Auth email template.

In Supabase:

1. Open `Authentication`.
2. Open `Emails`.
3. Select the Magic Link / Confirm Signup template.
4. Paste the HTML from `magic-link.html`.
5. Make sure the template uses `{{ .ConfirmationURL }}` for the button link.

Redirect URLs must include the app callback URL, for example:

```text
http://localhost:3000/auth/callback
http://127.0.0.1:3400/auth/callback
https://your-production-domain.com/auth/callback
```

If Supabase redirects users back to `/login`, the callback URL is usually missing from the Supabase allowed redirect URLs or the email template is not using `{{ .ConfirmationURL }}`.

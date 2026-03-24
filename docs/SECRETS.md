# Secrets & environment

- **Never commit** API keys, webhook secrets, or database URLs. `.env`, `.env.local`, and `.env.*.local` are gitignored.
- **Resend:** create a key in the Resend dashboard. If a key was pasted into chat, Slack, or a ticket, **rotate it** and use the new value only in `.env.local`.
- **Local (Linux / macOS):**

  ```bash
  cp .env.example .env.local
  # edit .env.local and set RESEND_API_KEY=re_...
  ```

- **Local (Windows PowerShell)** — append or edit `.env.local` in your editor; do not echo keys into terminal history if others can read it.

After changing env vars, restart `npm run dev`.

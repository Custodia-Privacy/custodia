import { NextResponse } from "next/server";

const RESEND_API_KEY =
  process.env.RESEND_API_KEY ?? "re_YsNHNZwU_Q67JnmxZABAhiqPUgMEb3NDC";
const RESEND_AUDIENCE_ID = "8a5e6694-1334-4c5c-b851-e5cd358b5fd1";
const CRON_SECRET =
  process.env.CRON_SECRET ?? "custodia-cron-secret-2026";

// ─── Email bodies ────────────────────────────────────────────────────────────

const DAY3_HTML = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
  <p style="font-size: 15px;">If you haven't had a chance to run a scan on your site yet, here's what the tool typically finds — and why each one matters.</p>

  <p style="font-size: 15px; font-weight: 600; margin-top: 24px;">1. Third-party scripts loading before consent</p>
  <p style="font-size: 15px; margin-top: 4px;">Most websites load Google Analytics, Meta Pixel, or similar tools before the user has agreed to anything. Under GDPR, that's a violation — consent must come <em>before</em> data collection. We see this on roughly 70% of sites we scan.</p>

  <p style="font-size: 15px; font-weight: 600; margin-top: 24px;">2. A cookie banner that doesn't actually block cookies</p>
  <p style="font-size: 15px; margin-top: 4px;">A surprising number of consent banners are decorative. The user clicks "Decline," but the cookies are already set. Real consent management actually prevents scripts from firing.</p>

  <p style="font-size: 15px; font-weight: 600; margin-top: 24px;">3. A privacy policy that doesn't match your actual tech stack</p>
  <p style="font-size: 15px; margin-top: 4px;">If you installed a plugin six months ago and never updated your policy, you have undisclosed processors. That's a compliance gap.</p>

  <p style="font-size: 15px; margin-top: 24px;">The good news: all three are fixable in an afternoon.</p>

  <div style="margin-top: 32px; text-align: center;">
    <a href="https://app.custodia-privacy.com" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600;">Scan your website free →</a>
  </div>

  <p style="font-size: 13px; color: #94a3b8; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px;">Custodia — Privacy compliance for small businesses<br>hello@custodia-privacy.com</p>
</div>`;

const DAY7_HTML = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
  <p style="font-size: 15px;">If you've been putting off privacy compliance because it feels overwhelming, here's the shortest path through it.</p>

  <p style="font-size: 15px; font-weight: 700; margin-top: 24px;">The 5-step checklist:</p>

  <p style="font-size: 15px; margin-top: 16px;">☐ <strong>1. Know what's on your site.</strong><br>Run a scan. Most businesses find 3–8 trackers they forgot were there.</p>

  <p style="font-size: 15px; margin-top: 12px;">☐ <strong>2. Get a consent banner that actually works.</strong><br>One that blocks scripts before consent and logs timestamped records. If a regulator asks for proof, you need records.</p>

  <p style="font-size: 15px; margin-top: 12px;">☐ <strong>3. Update your privacy policy.</strong><br>It should reflect your actual tech stack. Generic templates fail here.</p>

  <p style="font-size: 15px; margin-top: 12px;">☐ <strong>4. Set up a way to handle data requests (DSARs).</strong><br>Under GDPR you have 30 days to respond. Under CCPA it's 45. You need an intake form, a process, and documentation.</p>

  <p style="font-size: 15px; margin-top: 12px;">☐ <strong>5. Schedule a re-audit.</strong><br>Your tech stack changes. Set a quarterly reminder.</p>

  <p style="font-size: 15px; margin-top: 24px;">Custodia automates steps 1–4. Plans start at $29/month. Most businesses are fully set up in under an hour.</p>

  <div style="margin-top: 32px; text-align: center;">
    <a href="https://app.custodia-privacy.com/signup" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600;">Start your free trial →</a>
  </div>

  <p style="font-size: 13px; color: #94a3b8; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px;">Custodia — Privacy compliance for small businesses<br>hello@custodia-privacy.com</p>
</div>`;

// ─── Resend types ─────────────────────────────────────────────────────────────

interface ResendContact {
  id: string;
  email: string;
  created_at: string;
  unsubscribed: boolean;
}

interface ResendContactsResponse {
  object: string;
  data: ResendContact[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Return the UTC date string (YYYY-MM-DD) for today minus `days` days. */
function utcDateDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

/** Fetch ALL contacts from the Resend audience, following `after` pagination. */
async function fetchAllContacts(): Promise<ResendContact[]> {
  const contacts: ResendContact[] = [];
  let after: string | undefined;

  while (true) {
    const url = new URL(
      `https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`,
    );
    if (after) url.searchParams.set("after", after);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend contacts fetch failed: ${res.status} ${body}`);
    }

    const json = (await res.json()) as ResendContactsResponse;
    const page = json.data ?? [];
    contacts.push(...page);

    // If fewer records returned than a full page, we've reached the end.
    // Resend returns up to 100 per page; use the last id as the cursor.
    if (page.length < 100) break;
    after = page[page.length - 1]?.id;
    if (!after) break;
  }

  return contacts;
}

/** Send a nurture email via Resend. Throws on non-2xx. */
async function sendNurtureEmail(
  email: string,
  subject: string,
  html: string,
): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Custodia <hello@custodia-privacy.com>",
      to: [email],
      reply_to: "hello@custodia-privacy.com",
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend send failed for ${email}: ${res.status} ${body}`);
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // Auth check
  const authHeader = req.headers.get("authorization") ?? "";
  const expectedToken = `Bearer ${CRON_SECRET}`;
  if (authHeader !== expectedToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const day3DateStr = utcDateDaysAgo(3);
  const day7DateStr = utcDateDaysAgo(7);

  console.log(
    `[nurture-emails] Running. day3=${day3DateStr} day7=${day7DateStr}`,
  );

  let contacts: ResendContact[];
  try {
    contacts = await fetchAllContacts();
  } catch (err) {
    console.error("[nurture-emails] Failed to fetch contacts:", err);
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }

  console.log(`[nurture-emails] Total contacts fetched: ${contacts.length}`);

  // Build send tasks
  const tasks: Promise<void>[] = [];

  for (const contact of contacts) {
    if (contact.unsubscribed) continue;

    // Resend created_at is an ISO 8601 string, slice to YYYY-MM-DD for comparison
    const contactDate = contact.created_at.slice(0, 10);

    if (contactDate === day3DateStr) {
      console.log(
        `[nurture-emails] Queuing Day 3 email for ${contact.email}`,
      );
      tasks.push(
        sendNurtureEmail(
          contact.email,
          "The 3 things most websites get wrong about privacy compliance",
          DAY3_HTML,
        ),
      );
    } else if (contactDate === day7DateStr) {
      console.log(
        `[nurture-emails] Queuing Day 7 email for ${contact.email}`,
      );
      tasks.push(
        sendNurtureEmail(
          contact.email,
          "Your 5-step compliance checklist (steal this)",
          DAY7_HTML,
        ),
      );
    }
  }

  // Send all concurrently; don't let one failure block others
  const results = await Promise.allSettled(tasks);

  let sent = 0;
  let errors = 0;
  for (const result of results) {
    if (result.status === "fulfilled") {
      sent++;
    } else {
      errors++;
      console.error("[nurture-emails] Send error:", result.reason);
    }
  }

  console.log(`[nurture-emails] Done. sent=${sent} errors=${errors}`);
  return NextResponse.json({ sent, errors }, { status: 200 });
}

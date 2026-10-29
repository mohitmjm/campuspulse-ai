# Final Submission Answers (copy into the Google Form)

> Fill in the `[ ]` placeholders yourself. Submit the form manually. Nothing has been submitted automatically.

**1. Growth Plan (≤5 slides):** upload `docs/Growth-Plan.pdf` (or `.pptx`).

**2. Working asset (public live link):** `[PASTE YOUR DEPLOYED URL — not deployed yet, see README › Deployment]`

**3. Three growth tests:** paste `docs/Three-Growth-Tests.md`.

**4. AI Worklog (3 decisions):**
1. *Copilot as a rules engine.* Prompt: build an AI decision-support system without faking LLM output. AI first leaned towards LLM-written advice. Judgment: pace maths must be exact and testable, and the app must work without paid APIs. Decision: 9 transparent rules that show their numbers; the LLM is an optional, labelled summariser.
2. *No invented denominators.* AI considered showing CTR against the assumed WhatsApp reach. Judgment: that reach isn't observable. Decision: rates come only from tracked sessions and show "—" when unknown; reach assumptions stay on the plan page, labelled as assumptions.
3. *Test-data isolation.* AI spotted test ambassadors leaking onto the leaderboard in its own screenshot. Judgment: a one-time delete wouldn't fix the cause. Decision: E2E runs on a separate, reset database, plus a test proving demo resets never touch real records.

**5. Three-minute video:** `[PASTE VIDEO LINK]` — script in `docs/Video-Script.md`.

**6. AI recommendation deliberately rejected:**
"Let an LLM generate the Copilot's recommendations." I rejected it because the key outputs are arithmetic (registrations remaining, required daily pace, channel gaps). They must be correct, repeatable and testable, and the product had to work without a paid API. Instead, a deterministic rules engine produces every recommendation with its rule ID and the numbers behind it. An LLM can optionally summarise that output, and it is labelled as such.

**Short pitch (if there's a free-text field):**
CampusPulse AI turns student communities into measurable registrations. Ambassadors get tracked links and WhatsApp-ready A/B messages. Students register in 30 seconds with duplicate-safe referral attribution. A Command Center compares each channel with a 500-registration plan, and a transparent Copilot tells the organiser what to do next, and why. Demo data is fully simulated and labelled.

# Reflection Answers

> Written from the build record. Edit them into your own voice before submitting.

**What changed between the first idea and the final solution?**
The first idea was a high-converting landing page with a dashboard. The final solution treats the landing page as one piece of a loop: ambassadors get tracked links → registrations are attributed → the Command Center compares each channel with the plan → the Copilot turns gaps into one specific next action. Two design changes came from the brief's honesty constraints. First, conversion rates use only tracked sessions, never assumed reach. Second, every simulated number lives in a separate, labelled demo dataset that can be reset without touching real records. The Copilot also changed: from "ask an LLM for advice" to deterministic rules that show their numbers, with the LLM as an optional summariser.

**What would improve with another 24 hours?**
1. Deploy to a free tier (Vercel + Neon Postgres) and verify the public link. This was not done, because it needs account sign-in.
2. Email confirmation with a calendar invite, plus a reminder sequence, since attendance matters more than registrations.
3. A statistical significance check (two-proportion z-test) on the experiment cards, so "ship if" decisions are not made on noise.
4. An ambassador magic-link login, so a dashboard can't be opened just by knowing a code.
5. A short usability test with 3–5 real final-year students on the form and the share message.

**What AI recommendation was deliberately rejected, and why?**
Rejected: *"Let an LLM generate the Copilot's recommendations from the campaign metrics."*
It would have been the quickest way to make the Copilot look intelligent. It was rejected for three reasons. (1) Correctness: the most important outputs, like required daily pace, registrations remaining and channel gaps, are arithmetic, and an LLM can get them subtly wrong while sounding confident. (2) Trust and testability: a rules engine gives the same answer for the same data, every recommendation names the rule that fired, and unit tests lock behaviour in (e.g. 160 registrations on Day 4 → 114/day needed). (3) Cost and reliability: the product had to work without paid APIs. The LLM was kept, but demoted. It can only rewrite the rules output as a short summary, it is off unless a key is configured, and it is labelled as an LLM narrative.

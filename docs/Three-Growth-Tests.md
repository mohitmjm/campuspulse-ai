# Three Growth Tests (ready to paste)

**Test 1 — Value proposition**
- **Hypothesis:** Final-year students will register more for a placement-framed invite ("build a project you can show in interviews") than for a generic "learn AI" invite.
- **Test:** Ambassadors alternate two WhatsApp messages. Each one carries a tracked link (`v=placement` / `v=generic`). Landing sessions and registrations are counted per variant.
- **Metric:** Registration conversion rate = registrations ÷ unique landing sessions, per variant. *Guardrails:* complaints in groups; share of registrants who are final-year. *Decision:* if placement shows ≥20% relative lift with ≥150 sessions per arm by Day 4, switch all messaging to placement.

**Test 2 — Referral recognition**
- **Hypothesis:** Personal referral tracking plus public leaderboard recognition increases registrations per active ambassador compared with ordinary sharing.
- **Test:** Ambassadors are alternately assigned at onboarding to *leaderboard* (personal dashboard + daily shout-out) or *control* (same tracked link, no recognition).
- **Metric:** Attributed registrations per active ambassador, per cohort. *Guardrails:* ambassador drop-out; spam reports. *Decision:* if the leaderboard cohort is ≥25% higher by Day 3, roll recognition out to everyone for Days 4–7.

**Test 3 — Registration friction**
- **Hypothesis:** A minimal form (name, email, college, branch, year) has a higher completion rate than an extended form (+ phone, experience, goals).
- **Test:** Each visitor is randomly given `form=short` or `form=long`, and keeps the same version for the session.
- **Metric:** Form completion rate = registrations ÷ sessions that started the form, per variant. *Guardrails:* reminder opt-ins; data needed for follow-up. *Decision:* if short is ≥10 percentage points higher with ≥80 starts per arm, ship it to 100% and collect the extra fields after confirmation.

*All three are instrumented in the live app. Results on the dashboard come from the simulated scenario and are labelled SIMULATED. No real test has been run.*

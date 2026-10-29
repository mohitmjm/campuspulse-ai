# Three-Minute Video Script

Target length: 2:50. Before recording, run `npm run db:seed -- base` and open four tabs: `/plan`, `/`, `/ambassador`, `/dashboard`.

| Time | On screen | Say (word for word) |
|---|---|---|
| 0:00–0:20 | Face cam or `/plan` header | "Hi, I'm [name]. The challenge: 500 final-year engineering students registering for a free 60-minute AI project workshop, in 7 days, with ₹2,000. My insight is that final-year students don't want *an AI workshop*. They want an answer to the interview question 'what have you built?' So everything here is placement-first and peer-led." |
| 0:20–0:50 | `/plan`, scroll the funnel table, then the budget | "I use three channels. Campus ambassadors in WhatsApp groups bring 264, tech clubs bring 144, and peer referrals plus organic sharing bring 92. That's exactly 500. Every rate is an assumption, and the dashboard checks it against reality each day. The budget is ₹2,000 with no paid ads: ambassador and referrer rewards, a club kit, posters, and a ₹300 contingency I only release if we're below 80% of plan on Day 4." |
| 0:50–1:25 | `/ambassador` → fill the form → personal dashboard | "This is CampusPulse AI, the working asset. An ambassador signs up and instantly gets a unique code, two WhatsApp-ready messages for my A/B test, a placement version and a generic one, and a live dashboard." *(click Copy)* |
| 1:25–1:55 | Open the referral link in a new tab → register → confirmation | "A student opens the ambassador's link. The page shows who invited them. I register with a 30-second form, get a confirmation ID, and the referral is credited. If I try the same email again, even with dots or a plus tag, it's blocked, so nobody gets double-counted." *(refresh the ambassador dashboard: count = 1)* |
| 1:55–2:35 | `/dashboard` → click **Underperforming** | "The Command Center. Everything here is clearly labelled simulated. I'll load the underperforming scenario: Day 4, 160 registrations. The Copilot is a transparent rules engine, not an LLM pretending. It says we need 114 a day for 3 days, clubs are at about a third of plan, and a few ambassadors are carrying the load. Each recommendation shows the rule and the numbers behind it." *(scroll to experiments)* "These are my three growth tests, each with a metric and a decision rule." |
| 2:35–2:50 | Face cam | "One AI suggestion I rejected: letting an LLM write the recommendations. Pace maths has to be right and testable, so the LLM is only an optional summariser. Thanks for watching." |

## Shot list
1. Intro (face cam or slide 1 of `docs/Growth-Plan.pdf`)
2. `/plan`: funnel table and budget card
3. `/ambassador`: onboarding → personal dashboard → copy message
4. Incognito tab: `/?ref=CODE&utm_source=whatsapp&v=placement` → register → confirmation
5. Duplicate attempt → "already registered"
6. Ambassador dashboard refresh (count increments)
7. `/dashboard`: Underperforming → Copilot → experiments → Strong referral (optional)
8. Outro

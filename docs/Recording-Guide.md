# Recording Guide

**Setup (5 min)**
1. `npm run build && npm start` (or open your deployed URL).
2. Run `npm run db:seed -- base` so the dashboard opens on the base scenario.
3. Use a fresh email you haven't used before (e.g. `yourname+demo1@gmail.com`). Note that the `+demo1` tag is normalized away, so a different inbox is needed for each new take, or delete `dev.db` and run `npm run setup` between takes.
4. Browser zoom 110%, hide bookmarks, close notifications. 1080p recording (OBS / Loom / Windows Game Bar `Win+G`).
5. Have the ambassador onboarding done once off-camera if you want a shorter take, then open `/ambassador/<CODE>`.

**Exact click path**
1. `/plan` → scroll to the table → scroll to the budget.
2. `/ambassador` → name, email, college, tick consent → **Get my referral link** → hover the share kit → **Copy**.
3. Copy the "Plain referral link" → paste it in an incognito window → fill the form → **Register for free** → show the confirmation ID.
4. Same window: go back to `/`, use the same email with different capitalisation → show "already registered".
5. Back to the ambassador tab → refresh → Registrations = 1.
6. `/dashboard` → **Underperforming** → point at the Required pace KPI (114) → Copilot cards → Acquisition channels (red Clubs) → Experiments.
7. Optional: toggle dark mode (moon icon) to show polish.

**Do not** show real student data, API keys or the `.env` file on screen.

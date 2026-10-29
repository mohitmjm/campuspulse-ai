// Single source of truth for the campaign plan. The dashboard, copilot, docs and slides all read from here.

export const TARGET = 500;
export const CAMPAIGN_DAYS = 7;
export const BUDGET_TOTAL = 2000;

export const WORKSHOP = {
  title: "Build Your First AI Project in 60 Minutes",
  format: "Live online workshop · 60 minutes · Free",
  audience: "Final-year engineering students",
};

// Stored channel values. Plan channels group them (see PLAN_CHANNELS).
export const CHANNELS = ["whatsapp", "club", "referral", "social", "direct"] as const;
export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_LABELS: Record<Channel, string> = {
  whatsapp: "Ambassador WhatsApp",
  club: "Tech clubs & communities",
  referral: "Peer referral",
  social: "Organic social",
  direct: "Direct / unattributed",
};

export type PlanChannelId = "ambassador" | "clubs" | "peer";

export interface PlanChannel {
  id: PlanChannelId;
  name: string;
  stored: Channel[];
  audience: string;
  method: string;
  reach: number;
  clickRate: number;
  conversionRate: number;
  risks: string;
  backup: string;
}

// Reach × click rate × registration conversion. Each row is exact, and the rows sum to TARGET.
export const PLAN_CHANNELS: PlanChannel[] = [
  {
    id: "ambassador",
    name: "Campus ambassadors + WhatsApp groups",
    stored: ["whatsapp"],
    audience: "Final-year students in class, hostel and department WhatsApp groups",
    method: "40 ambassadors across ~20 colleges each post a tracked link in ~3 groups (≈100 members) with a placement-angled message, then one reminder.",
    reach: 12000,
    clickRate: 0.1,
    conversionRate: 0.22,
    risks: "Group fatigue / admins removing promo posts; a few ambassadors do most of the work.",
    backup: "Swap to 1:1 DMs from ambassadors to friends; recruit replacement ambassadors from Day-1 registrants.",
  },
  {
    id: "clubs",
    name: "Tech clubs & student communities",
    stored: ["club"],
    audience: "Members of coding, AI/ML, IEEE/ACM chapters and placement cells",
    method: "Pitch 15 club leads with a ready-made announcement kit; clubs post once on Day 2 and remind on Day 5.",
    reach: 6000,
    clickRate: 0.08,
    conversionRate: 0.3,
    risks: "Club leads are slow to respond; announcements land after exam timetables.",
    backup: "Ask ambassadors who are club members to post directly; offer co-branded certificate line.",
  },
  {
    id: "peer",
    name: "Peer referrals + organic social",
    stored: ["referral", "social"],
    audience: "Friends of registrants; LinkedIn/Instagram networks of students",
    method: "Post-registration share card with a pre-written WhatsApp message and LinkedIn caption.",
    reach: 2300,
    clickRate: 0.1,
    conversionRate: 0.4,
    risks: "Low share rate if the confirmation screen feels transactional.",
    backup: "Add 'bring a friend' line to reminder messages; highlight that the project is portfolio-ready.",
  },
];

export function expectedRegistrations(c: PlanChannel) {
  return Math.round(c.reach * c.clickRate * c.conversionRate);
}

export const DAILY_TARGETS = [40, 60, 75, 80, 85, 90, 70];

export function cumulativeTarget(day: number) {
  return DAILY_TARGETS.slice(0, Math.max(0, Math.min(day, CAMPAIGN_DAYS))).reduce((a, b) => a + b, 0);
}

export const BUDGET_PLAN = [
  { category: "Ambassador rewards", amount: 500, note: "₹100 mobile recharge for top 5 ambassadors (Day 7)" },
  { category: "Top referrer prizes", amount: 600, note: "3 × ₹200 vouchers for highest peer referrers" },
  { category: "Club partner kit", amount: 400, note: "Snacks for 2 club announcement sessions" },
  { category: "Posters", amount: 200, note: "Print 20 A4 QR posters for 2 notice boards" },
  { category: "Contingency", amount: 300, note: "Released only by a Day-4/5 contingency decision" },
];

export const TIMELINE = [
  { day: 1, focus: "Launch", activities: "Onboard 40 ambassadors, share kits, ambassadors post in groups (placement vs generic A/B).", owner: "Growth intern", budget: 0, kpi: "≥30 active ambassadors; 40 registrations", contingency: "If <25 ambassadors active by 6pm, DM recruits personally and extend to Day 2." },
  { day: 2, focus: "Clubs", activities: "Club leads post the announcement kit (₹200 snacks for one club session); first leaderboard published.", owner: "Growth intern + club leads", budget: 200, kpi: "8 clubs posted; 100 cumulative", contingency: "If <5 clubs post, ambassadors who are club members post instead." },
  { day: 3, focus: "Referral loop", activities: "Turn on peer share card; WhatsApp reminder from ambassadors.", owner: "Growth intern", budget: 0, kpi: "≥10% of registrants share; 175 cumulative", contingency: "If share rate <5%, rewrite share message around portfolio outcome." },
  { day: 4, focus: "Mid-point review", activities: "Read Test 1 result, switch all copy to the winner; Copilot pace review. ₹300 contingency is earmarked here and released only if triggered.", owner: "Growth intern", budget: 300, kpi: "255 cumulative", contingency: "If <80% of plan, release ₹300 contingency to the strongest channel." },
  { day: 5, focus: "Club reminder", activities: "Second club session (₹200) + 20 QR posters (₹200); support bottom-10 ambassadors with new message.", owner: "Club leads + ambassadors", budget: 400, kpi: "340 cumulative", contingency: "If clubs lag, run a 15-min live Q&A teaser in one active community." },
  { day: 6, focus: "Urgency", activities: "'Seats closing' reminder; leaderboard push; peer referral nudge.", owner: "Ambassadors", budget: 0, kpi: "430 cumulative", contingency: "If required pace >1.5× actual, focus every ambassador on 1:1 DMs." },
  { day: 7, focus: "Close", activities: "Final reminder; ₹500 ambassador + ₹600 referrer rewards; retrospective.", owner: "Growth intern", budget: 1100, kpi: "500 registrations", contingency: "Keep contingency unspent if target is reached." },
];

export const EXPERIMENTS = [
  {
    id: "message",
    name: "Test 1 · Value proposition",
    hypothesis: "A placement-oriented WhatsApp message (\"build a project you can show in interviews\") will convert better than a generic \"learn AI\" message.",
    design: "Ambassadors alternate two invitation versions; each link carries v=placement or v=generic. Landing views and registrations are counted per variant.",
    metric: "Registration conversion rate = registrations ÷ unique landing sessions, per variant",
    guardrails: "Unsubscribe/complaint messages in groups; share of registrants who are final-year (audience quality)",
    threshold: "Placement variant ≥20% relative lift with ≥150 landing sessions per variant",
    decision: "If threshold met by Day 4, switch all remaining messages to placement copy; otherwise keep the generic default and the 50/50 split.",
    variants: ["placement", "generic"],
  },
  {
    id: "referral",
    name: "Test 2 · Referral recognition",
    hypothesis: "Personal referral tracking plus public leaderboard recognition increases registrations per active ambassador versus ordinary sharing.",
    design: "Ambassadors are split into two cohorts at onboarding: leaderboard (personal dashboard + daily leaderboard shout-out) and control (same link, no recognition).",
    metric: "Attributed registrations per active ambassador, per cohort",
    guardrails: "Ambassador drop-out rate; spammy behaviour reports",
    threshold: "Leaderboard cohort ≥25% more registrations per active ambassador",
    decision: "If met by Day 3, give every ambassador the leaderboard experience for Days 4–7.",
    variants: ["leaderboard", "control"],
  },
  {
    id: "form",
    name: "Test 3 · Registration friction",
    hypothesis: "A minimal form (name, email, college, branch, year) has a higher completion rate than an extended form with phone, experience and goals.",
    design: "Visitors are randomly assigned form=short or form=long on first visit (sticky per session).",
    metric: "Form completion rate = registrations ÷ sessions that started the form, per variant",
    guardrails: "Workshop attendance intent (reminder opt-ins); data needed for follow-up",
    threshold: "Short form ≥10 percentage points higher completion with ≥80 form starts per variant",
    decision: "If met, ship the short form to 100% and collect extra fields in the confirmation step.",
    variants: ["short", "long"],
  },
] as const;

export const BRANCHES = ["CSE", "IT", "AI & ML", "Data Science", "ECE", "EEE", "Mechanical", "Civil", "Other"];

export const SUGGESTED_COLLEGES = [
  "Deccan Institute of Technology",
  "Godavari Engineering College",
  "Krishna Valley Institute of Engineering",
  "Coromandel College of Engineering",
  "Western Ghats Institute of Technology",
  "Vindhya School of Engineering",
  "Narmada Institute of Technology",
  "Sahyadri College of Engineering & Management",
];

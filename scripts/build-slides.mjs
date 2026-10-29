// Builds docs/Growth-Plan.pptx (pptxgenjs) and docs/Growth-Plan.pdf (HTML → Chromium PDF) from one content model.
// Numbers mirror lib/campaign.ts; tests/unit/logic.test.ts asserts those totals (500 regs, ₹2,000).
import pptxgen from "pptxgenjs";
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const INK = "15202B", TEAL = "137A66", CORAL = "E8572E", MUTED = "5B6472", BG = "FBFAF7", LINE = "E4DFD6";

const slides = [
  {
    kicker: "1 · Student insight & objective",
    title: "Students don't want an AI workshop. They want an answer to “what have you built?”",
    bullets: [
      "Audience: final-year engineering students, 3–6 months from placements, any branch.",
      "Insight: they trust classmates over ads and live in class/hostel WhatsApp groups; the job they hire a workshop for is a portfolio project.",
      "Objective: 500 registrations in 7 days, ₹2,000 budget, no paid ads, fully measurable by channel.",
      "Positioning: “Leave with a working AI app + GitHub repo you can demo in interviews — in 60 minutes, free.”",
      "Success = 500 registrations, ≥40% from ambassadors, cost per registration ≤ ₹4.",
    ],
  },
  {
    kicker: "2 · Acquisition strategy & 500-registration funnel",
    title: "Three peer-led channels, one tracked funnel",
    table: [
      ["Channel", "Reach", "Click", "Clicks", "Convert", "Regs"],
      ["Ambassadors + WhatsApp (40 amb. × ~3 groups)", "12,000", "10%", "1,200", "22%", "264"],
      ["Tech clubs & communities (15 clubs)", "6,000", "8%", "480", "30%", "144"],
      ["Peer referral + organic social", "2,300", "10%", "230", "40%", "92"],
      ["Total", "20,300", "", "1,910", "", "500"],
    ],
    note: "Assumptions, not measurements. Risk: WhatsApp fatigue & ambassador skew → backup: 1:1 DMs, recruit Day-1 registrants. Clubs slow → ambassadors who are club members post directly.",
  },
  {
    kicker: "3 · Seven-day rollout & ₹2,000 budget",
    title: "Front-load distribution, decide at mid-point, close with urgency",
    table: [
      ["Day", "Focus", "Cum. target", "Spend"],
      ["1", "Onboard 40 ambassadors; A/B messages live", "40", "₹0"],
      ["2", "Club announcement kits; first leaderboard", "100", "₹200"],
      ["3", "Peer share card + reminders", "175", "₹0"],
      ["4", "Mid-point: read Test 1, Copilot pace review; contingency decision", "255", "₹300*"],
      ["5", "Second club post + QR posters; support low ambassadors", "340", "₹400"],
      ["6", "“Seats closing” push", "430", "₹0"],
      ["7", "Final reminder; rewards (₹500 ambassadors + ₹600 referrers)", "500", "₹1,100"],
    ],
    note: "Budget: rewards ₹500 · referrer prizes ₹600 · club kit ₹400 · posters ₹200 · contingency ₹300 (*released only if <80% of plan) = ₹2,000.",
  },
  {
    kicker: "4 · Three growth tests & measurement",
    title: "Hypothesis → test → metric, with a decision rule for each",
    table: [
      ["Test", "Hypothesis", "Metric", "Ship if"],
      ["1 · Value prop", "Placement message beats generic “learn AI”", "Regs ÷ landing sessions per variant (v=)", "≥20% lift, ≥150 sessions/arm"],
      ["2 · Referral recognition", "Leaderboard + personal tracking lifts ambassador output", "Regs per active ambassador per cohort", "≥25% more"],
      ["3 · Form friction", "Minimal form completes more than extended", "Regs ÷ form starts per variant", "≥10 pp, ≥80 starts/arm"],
    ],
    note: "Guardrails: group complaints, final-year share, ambassador drop-out. Measurement limit: views inside WhatsApp aren't observable, so rates start at the tracked landing session.",
  },
  {
    kicker: "5 · CampusPulse AI — product & learning loop",
    title: "A working engine, not a landing page",
    bullets: [
      "Registration: validation, normalized-email duplicate protection, referral attribution, confirmation ID, share card.",
      "Ambassador portal: unique codes, tracked links, WhatsApp-ready A/B messages, personal dashboard, leaderboards.",
      "Command Center: funnel, channel vs plan, colleges, ambassadors, budget, experiments — from stored data only.",
      "AI Growth Copilot: deterministic rules (pace, channel gap, college, ambassador skew, budget, late shortfall) with the numbers behind each call; optional LLM summary.",
      "Demo Simulation Mode: 3 seeded scenarios, all labelled SIMULATED and isolated from real records.",
      "Daily loop: read Copilot → pick 1 action → log decision → compare to plan next day.",
    ],
  },
];

// ---------- PPTX ----------
const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE"; // 13.33 × 7.5 in
pptx.title = "CampusPulse AI — Growth Plan";
slides.forEach((s, i) => {
  const sl = pptx.addSlide();
  sl.background = { color: BG };
  sl.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: TEAL } });
  sl.addText(s.kicker.toUpperCase(), { x: 0.6, y: 0.35, w: 12, h: 0.35, fontSize: 12, bold: true, color: CORAL, fontFace: "Segoe UI" });
  sl.addText(s.title, { x: 0.6, y: 0.75, w: 12.1, h: 1.0, fontSize: 26, bold: true, color: INK, fontFace: "Segoe UI", valign: "top" });
  if (s.bullets) {
    sl.addText(s.bullets.map((b) => ({ text: b, options: { bullet: { code: "25A0" }, paraSpaceAfter: 10 } })), { x: 0.6, y: 1.95, w: 12.1, h: 4.9, fontSize: 16, color: INK, fontFace: "Segoe UI", valign: "top" });
  }
  if (s.table) {
    const rows = s.table.map((r, ri) => r.map((c) => ({ text: c, options: { bold: ri === 0 || (s.kicker.startsWith("2") && ri === s.table.length - 1), color: ri === 0 ? "FFFFFF" : INK, fill: { color: ri === 0 ? TEAL : ri % 2 ? "FFFFFF" : "F3F0EA" } } })));
    sl.addTable(rows, { x: 0.6, y: 1.95, w: 12.1, fontSize: 13, fontFace: "Segoe UI", border: { type: "solid", color: LINE, pt: 0.75 }, margin: 0.08 });
  }
  if (s.note) sl.addText(s.note, { x: 0.6, y: 6.25, w: 12.1, h: 0.8, fontSize: 12, color: MUTED, italic: true, fontFace: "Segoe UI", valign: "top" });
  sl.addText(`CampusPulse AI · Growth Plan · ${i + 1}/5`, { x: 0.6, y: 7.05, w: 8, h: 0.3, fontSize: 10, color: MUTED, fontFace: "Segoe UI" });
});
await pptx.writeFile({ fileName: "docs/Growth-Plan.pptx" });
console.log("wrote docs/Growth-Plan.pptx");

// ---------- PDF ----------
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@page { size: 13.333in 7.5in; margin: 0 }
body { margin: 0; font-family: "Segoe UI", system-ui, sans-serif; color: #${INK} }
.s { width: 13.333in; height: 7.5in; box-sizing: border-box; padding: .45in .6in .4in .75in; background: #${BG}; position: relative; page-break-after: always; border-left: .18in solid #${TEAL} }
.k { color: #${CORAL}; font-weight: 700; font-size: 12pt; letter-spacing: .06em; text-transform: uppercase }
h1 { font-size: 26pt; margin: .12in 0 .3in; letter-spacing: -.02em; line-height: 1.15 }
ul { font-size: 16pt; line-height: 1.4; padding-left: .3in } li { margin-bottom: .1in } li::marker { color: #${TEAL} }
table { border-collapse: collapse; width: 100%; font-size: 13pt } td, th { border: 1px solid #${LINE}; padding: .08in .1in; text-align: left }
th { background: #${TEAL}; color: #fff } tr:nth-child(odd) td { background: #F3F0EA } tr:nth-child(even) td { background: #fff }
.n { position: absolute; left: .75in; right: .6in; bottom: .55in; color: #${MUTED}; font-style: italic; font-size: 12pt }
.f { position: absolute; left: .75in; bottom: .2in; color: #${MUTED}; font-size: 10pt }
</style></head><body>${slides
  .map((s, i) => `<section class="s"><div class="k">${esc(s.kicker)}</div><h1>${esc(s.title)}</h1>${
    s.bullets ? `<ul>${s.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""
  }${s.table ? `<table>${s.table.map((r, ri) => `<tr>${r.map((c) => (ri === 0 ? `<th>${esc(c)}</th>` : `<td>${esc(c)}</td>`)).join("")}</tr>`).join("")}</table>` : ""}${
    s.note ? `<div class="n">${esc(s.note)}</div>` : ""
  }<div class="f">CampusPulse AI · Growth Plan · ${i + 1}/5</div></section>`)
  .join("")}</body></html>`;
writeFileSync("docs/Growth-Plan.html", html);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html);
await page.pdf({ path: "docs/Growth-Plan.pdf", width: "13.333in", height: "7.5in", printBackground: true });
await browser.close();
console.log("wrote docs/Growth-Plan.pdf");

/* CCS UX/UI Delivery Plan — June to November 2026
   Data model: Epics, Tasks, Roles, Months
   ------------------------------------------------------------------ */

const MONTHS = ["June", "July", "August", "September", "October", "November"];

const ROLES = {
  ux:   { id: "ux",   name: "UX/UI",                 owner: "Damian + Experience Design Lead", short: "UX" },
  sme:  { id: "sme",  name: "Collection Access SME", owner: "Alli",                            short: "SME" },
  dev:  { id: "dev",  name: "Development Team",       owner: "Dev Team",                        short: "DEV" },
  gov:  { id: "gov",  name: "Shared Governance",      owner: "UX + SME + Dev",                  short: "GOV" }
};

/* Each Epic carries a colour used consistently across all views. */
const EPICS = [
  {
    id: "E0",
    title: "Design Operations & Governance",
    colour: "#5B6B7B",
    duration: "June to November 2026",
    owner: "Shared Governance",
    roles: ["gov", "ux", "sme", "dev"],
    purpose: "Coordinate UX, content and development activities across the full delivery period.",
    start: "June", end: "November"
  },
  {
    id: "E1",
    title: "Prototype Validation & Delivery Planning",
    colour: "#3B82C4",
    duration: "June 2026",
    owner: "UX/UI",
    roles: ["ux", "sme"],
    purpose: "Validate the clickable prototype with users and turn findings into a prioritised delivery backlog.",
    start: "June", end: "June"
  },
  {
    id: "E2",
    title: "Design Foundations & Component System",
    colour: "#2BA89A",
    duration: "July 2026",
    owner: "UX/UI",
    roles: ["ux", "sme"],
    purpose: "Create the design system, reusable components and content foundations required for Blacklight-informed implementation.",
    start: "July", end: "July"
  },
  {
    id: "E3",
    title: "Detailed UX Design & Developer Handover",
    colour: "#C9831F",
    duration: "August 2026",
    owner: "UX/UI",
    roles: ["ux", "sme", "dev"],
    purpose: "Turn the prototype and design system into a build-ready handover package.",
    start: "August", end: "August"
  },
  {
    id: "E4",
    title: "Development Sprint Support & Mid-Build Testing",
    colour: "#8B5CC7",
    duration: "September 2026",
    owner: "UX/UI",
    roles: ["ux", "sme", "dev"],
    purpose: "Support development implementation, review the build and validate the experience with users.",
    start: "September", end: "September"
  },
  {
    id: "E5",
    title: "Final Validation, UAT & Content Sign-off",
    colour: "#C2476A",
    duration: "October 2026",
    owner: "UX/UI",
    roles: ["ux", "sme", "dev"],
    purpose: "Complete accessibility, consistency and stakeholder validation before release readiness.",
    start: "October", end: "October"
  },
  {
    id: "E6",
    title: "Production Readiness & Release Support",
    colour: "#4A9E54",
    duration: "November 2026",
    owner: "UX/UI",
    roles: ["ux", "sme", "dev"],
    purpose: "Complete final checks and prepare the CCS experience for release.",
    start: "November", end: "November"
  }
];

/* Tasks.
   role     = primary swimlane(s) this task sits in
   critical = task carries a strong/critical dependency (risk flag)
*/
const TASKS = [
  /* ---------- EPIC 0 ---------- */
  {
    id: "0.1", epic: "E0", name: "Weekly UX + SME Sync",
    owner: "UX/UI + Alli", roles: ["ux", "sme", "gov"], start: "June", end: "November",
    deps: [], depText: "None", critical: false,
    deliverables: ["Weekly decision log", "Content and UX action register", "Issue escalation list"],
    acceptance: [
      "Weekly meeting is scheduled",
      "Actions and decisions are documented",
      "UX and content dependencies are tracked",
      "Blockers are escalated early"
    ]
  },
  {
    id: "0.2", epic: "E0", name: "Weekly UX + Dev Sync",
    owner: "UX/UI + Dev Team", roles: ["ux", "dev", "gov"], start: "June", end: "November",
    deps: [], depText: "None", critical: false,
    deliverables: ["Developer question log", "Interaction decision log", "Design handover notes"],
    acceptance: [
      "Developers have a regular forum for UX questions",
      "Design decisions are documented",
      "Build-impacting issues are reviewed weekly"
    ]
  },
  {
    id: "0.3", epic: "E0", name: "Fortnightly Stakeholder Design Review",
    owner: "UX/UI", roles: ["ux", "gov"], start: "June", end: "November",
    deps: [], depText: "Prototype and evolving designs", critical: false,
    deliverables: ["Review pack", "Feedback log", "Design decision register"],
    acceptance: [
      "Stakeholders can review progress at agreed intervals",
      "Feedback is captured and prioritised",
      "Decisions are visible to UX, SME and Dev"
    ]
  },
  {
    id: "0.4", epic: "E0", name: "Monthly Content Governance Review",
    owner: "Alli", roles: ["sme", "gov"], start: "June", end: "November",
    deps: [], depText: "Content inventory", critical: false,
    deliverables: ["Content governance register", "Content approval tracker"],
    acceptance: [
      "Content ownership is clear",
      "Content approval status is visible",
      "Content risks are escalated"
    ]
  },

  /* ---------- EPIC 1 ---------- */
  {
    id: "1.1", epic: "E1", name: "Conduct Usability Testing Round 1",
    owner: "UX/UI", roles: ["ux"], start: "June", end: "June",
    deps: [], depText: "Clickable prototype available; Participant pool confirmed", critical: true,
    deliverables: ["Test plan", "Test script", "Participant schedule", "Observation notes"],
    acceptance: [
      "15–20 participants are tested",
      "Participants include researchers, academics, students, collection staff and public users",
      "Key tasks are tested across search, browse, item detail, My Lists, rights/access and help content",
      "Findings are captured consistently"
    ]
  },
  {
    id: "1.2", epic: "E1", name: "Analyse Prototype Findings",
    owner: "UX/UI", roles: ["ux"], start: "June", end: "June",
    deps: ["1.1"], depText: "Task 1.1 complete", critical: true,
    deliverables: ["Usability findings report", "Severity-ranked issues", "Prioritised UX backlog"],
    acceptance: [
      "Findings are grouped by theme",
      "Issues are ranked Critical, High, Medium or Low",
      "Recommended design changes are documented",
      "Findings are ready to inform design system and detailed design"
    ]
  },
  {
    id: "1.3", epic: "E1", name: "Establish UX Delivery Governance",
    owner: "UX/UI", roles: ["ux"], start: "June", end: "June",
    deps: [], depText: "Dev cadence confirmed; SME availability confirmed", critical: false,
    deliverables: ["UX delivery cadence", "Design review schedule", "UX sign-off process", "Handover approach"],
    acceptance: [
      "UX, SME and Dev ceremonies are agreed",
      "Design approval points are clear",
      "Developer handover process is understood"
    ]
  },
  {
    id: "1.4", epic: "E1", name: "Content Inventory",
    owner: "Alli", roles: ["sme"], start: "June", end: "June",
    deps: [], depText: "Wireframes/prototype available", critical: false,
    deliverables: ["CCS content inventory spreadsheet"],
    acceptance: [
      "All required MVP content areas are identified",
      "Content gaps are documented",
      "Content needed for landing pages, collection pages, help pages, rights/access, Indigenous guidance, FAQs and contact pages is listed"
    ]
  },
  {
    id: "1.5", epic: "E1", name: "Content Ownership Matrix",
    owner: "Alli", roles: ["sme"], start: "June", end: "June",
    deps: ["1.4"], depText: "Task 1.4 complete", critical: false,
    deliverables: ["Content ownership matrix", "Approval pathway map"],
    acceptance: [
      "Each content area has an owner",
      "Approval pathway is identified",
      "Update frequency is documented where relevant"
    ]
  },
  {
    id: "1.6", epic: "E1", name: "SME Observation of User Testing",
    owner: "Alli", roles: ["sme"], start: "June", end: "June",
    deps: ["1.1"], depText: "Task 1.1 scheduled", critical: false,
    deliverables: ["Content improvement register"],
    acceptance: [
      "Alli observes selected usability sessions",
      "Content confusion, terminology issues and missing guidance are captured",
      "Content improvements are added to the backlog"
    ]
  },

  /* ---------- EPIC 2 ---------- */
  {
    id: "2.1", epic: "E2", name: "Create Design Foundations",
    owner: "UX/UI", roles: ["ux"], start: "July", end: "July",
    deps: ["1.2"], depText: "Task 1.2 complete", critical: true,
    deliverables: ["Figma design foundations", "Colour system", "Typography system", "Spacing system", "Icon approach"],
    acceptance: [
      "Foundations are documented in Figma",
      "Greyscale CCS prototype style is preserved",
      "Accessibility contrast requirements are considered",
      "Foundations can be reused across all screens"
    ]
  },
  {
    id: "2.2", epic: "E2", name: "Build CCS Component Library",
    owner: "UX/UI", roles: ["ux"], start: "July", end: "July",
    deps: ["2.1"], depText: "Task 2.1 complete", critical: false,
    deliverables: ["Component library in Figma (Navigation, Footer, Buttons, Search bar, Search suggestions, Dropdowns, Facets, Checkboxes, Badges, Cards, Metadata tables, Pagination, Tabs, Modals, Notifications, Banners, Forms, Accordions, Tooltips, Empty/Loading/Error states)"],
    acceptance: [
      "Core reusable interface components are documented",
      "Components match the CCS wireframe direction",
      "Components are ready for developer review",
      "Components include naming conventions"
    ]
  },
  {
    id: "2.3", epic: "E2", name: "Define Interaction States",
    owner: "UX/UI", roles: ["ux"], start: "July", end: "July",
    deps: ["2.2"], depText: "Task 2.2 complete", critical: false,
    deliverables: ["Interaction state specifications"],
    acceptance: [
      "Button states are defined: default, hover, focus, active, disabled, loading",
      "Search states are defined: empty, focus, typing, suggestion, error",
      "Card states are defined: default, hover, saved, restricted, view-only, downloadable",
      "Form states are defined: empty, filled, error, disabled",
      "Modal states are defined"
    ]
  },
  {
    id: "2.4", epic: "E2", name: "Create Responsive Layouts",
    owner: "UX/UI", roles: ["ux"], start: "July", end: "July",
    deps: ["2.1", "2.2"], depText: "Task 2.1 and Task 2.2 complete", critical: false,
    deliverables: ["Desktop layouts", "Tablet layouts", "Mobile layouts"],
    acceptance: [
      "Key pages have responsive layout guidance",
      "Navigation behaviour is defined across breakpoints",
      "Search, filters and cards are defined for mobile and desktop",
      "Developers have breakpoint guidance"
    ]
  },
  {
    id: "2.5", epic: "E2", name: "Accessibility Specifications",
    owner: "UX/UI", roles: ["ux"], start: "July", end: "July",
    deps: ["2.2", "2.3"], depText: "Task 2.2 and Task 2.3 complete", critical: false,
    deliverables: ["Accessibility specification guide"],
    acceptance: [
      "Keyboard interaction expectations are documented",
      "Focus states are documented",
      "Form labelling expectations are documented",
      "WCAG 2.1 AA considerations are captured",
      "Accessibility requirements are ready for Dev handover"
    ]
  },
  {
    id: "2.6", epic: "E2", name: "Create Collection Landing Page Content",
    owner: "Alli", roles: ["sme"], start: "July", end: "July",
    deps: ["1.4", "1.5"], depText: "Task 1.4 and Task 1.5 complete", critical: false,
    deliverables: ["Collection landing page content pack"],
    acceptance: [
      "Collection summaries are drafted",
      "About sections are drafted",
      "Material types are documented",
      "Research value is described",
      "Rights/access language is included"
    ]
  },
  {
    id: "2.7", epic: "E2", name: "Create User Information and Instructions",
    owner: "Alli", roles: ["sme"], start: "July", end: "July",
    deps: [], depText: "UX page structures available", critical: false,
    deliverables: ["Help and guidance content pack (Search tips, Metadata and fields guidance, Rights and licensing guidance, Citing collections, My Lists instructions, Request access guidance, FAQs)"],
    acceptance: [
      "User guidance is written in clear plain English",
      "Content aligns with page structure",
      "Instructions support search, browse, save, cite and request flows",
      "Draft content is ready for UX review"
    ]
  },
  {
    id: "2.8", epic: "E2", name: "Metadata Terminology Alignment",
    owner: "Alli", roles: ["sme"], start: "July", end: "July",
    deps: [], depText: "Content inventory; Prototype terminology", critical: false,
    deliverables: ["CCS content style guide", "Terminology standards"],
    acceptance: [
      "Preferred terms are documented",
      "Inconsistent labels are identified",
      "Metadata labels are aligned where possible",
      "Terms are suitable for users and collection stakeholders"
    ]
  },

  /* ---------- EPIC 3 ---------- */
  {
    id: "3.1", epic: "E3", name: "Create Annotated Figma Designs",
    owner: "UX/UI", roles: ["ux"], start: "August", end: "August",
    deps: ["E2"], depText: "Epic 2 complete", critical: true,
    deliverables: ["Annotated Figma screens"],
    acceptance: [
      "All MVP screens are annotated",
      "Behaviour, rules and exceptions are documented",
      "Components are linked to the design library",
      "Designs are clear enough for development estimation and build"
    ]
  },
  {
    id: "3.2", epic: "E3", name: "Create User Flows",
    owner: "UX/UI", roles: ["ux"], start: "August", end: "August",
    deps: ["3.1"], depText: "Task 3.1 in progress", critical: false,
    deliverables: ["User flow documentation (Search, Browse, Collection, Item detail, My Lists, Request access, Help and guidance)"],
    acceptance: [
      "Key end-to-end journeys are documented",
      "Entry and exit points are clear",
      "Decision points are visible",
      "Flows are available for Dev and stakeholder review"
    ]
  },
  {
    id: "3.3", epic: "E3", name: "Create Functional Specifications",
    owner: "UX/UI", roles: ["ux", "dev"], start: "August", end: "August",
    deps: ["3.1", "3.2"], depText: "Task 3.1 and Task 3.2", critical: false,
    deliverables: ["Functional specifications document"],
    acceptance: [
      "Inputs, outputs, triggers, behaviours and rules are documented",
      "Search, filters, sort, pagination and save-list behaviours are defined",
      "Blacklight/Solr constraints are considered",
      "Dev team can use the specs during implementation"
    ]
  },
  {
    id: "3.4", epic: "E3", name: "Design Edge Cases",
    owner: "UX/UI", roles: ["ux"], start: "August", end: "August",
    deps: ["3.1"], depText: "Task 3.1", critical: false,
    deliverables: ["Edge case screen library (No results, Loading, Error, No image, Restricted item, View-only item, No metadata, No digital asset, Broken asset, Empty list, Browser storage cleared)"],
    acceptance: [
      "Common edge cases are designed",
      "Error and empty state copy is included",
      "Accessibility is considered",
      "Dev has guidance for non-happy-path scenarios"
    ]
  },
  {
    id: "3.5", epic: "E3", name: "Developer Handover Workshop",
    owner: "UX/UI", roles: ["ux", "dev", "sme"], start: "August", end: "August",
    deps: ["3.1", "3.2", "3.3", "3.4", "3.6"], depText: "Tasks 3.1 to 3.4 complete; Alli content available", critical: true,
    deliverables: ["Handover workshop", "Handover recording", "Q&A register"],
    acceptance: [
      "Dev team understands design intent",
      "Open questions are documented",
      "Build dependencies are captured",
      "Follow-up actions are assigned"
    ]
  },
  {
    id: "3.6", epic: "E3", name: "Populate Approved MVP Content",
    owner: "Alli", roles: ["sme"], start: "August", end: "August",
    deps: ["2.6", "2.7", "3.1"], depText: "Task 2.6 and Task 2.7 complete; Task 3.1 in progress", critical: false,
    deliverables: ["Approved MVP content library"],
    acceptance: [
      "Home, Browse, Collection, Item Detail, Help, Contact and Indigenous Cultural Data content is prepared",
      "Content is structured for handover to Dev",
      "Content gaps are documented",
      "Content is aligned with UX screens"
    ]
  },
  {
    id: "3.7", epic: "E3", name: "Content QA Round 1",
    owner: "Alli", roles: ["sme"], start: "August", end: "August",
    deps: ["3.6"], depText: "Task 3.6 complete", critical: false,
    deliverables: ["Content QA checklist", "Content issue log"],
    acceptance: [
      "Content is reviewed for clarity, accuracy and consistency",
      "Terminology is checked against the style guide",
      "Content risks are flagged",
      "Required approvals are identified"
    ]
  },

  /* ---------- EPIC 4 ---------- */
  {
    id: "4.1", epic: "E4", name: "Weekly Design QA",
    owner: "UX/UI", roles: ["ux", "dev"], start: "September", end: "September",
    deps: ["3.5"], depText: "Development environment available; Task 3.5 complete", critical: true,
    deliverables: ["Sprint design QA reports"],
    acceptance: [
      "Built screens are reviewed against Figma",
      "Component implementation is checked",
      "Layout, spacing, typography and interactions are reviewed",
      "Accessibility issues are logged"
    ]
  },
  {
    id: "4.2", epic: "E4", name: "Resolve Developer Queries",
    owner: "UX/UI", roles: ["ux", "dev"], start: "September", end: "September",
    deps: [], depText: "Development work underway", critical: false,
    deliverables: ["UX decision log", "Dev Q&A register"],
    acceptance: [
      "Dev questions are answered promptly",
      "Decisions are documented",
      "Any changes to design intent are captured"
    ]
  },
  {
    id: "4.3", epic: "E4", name: "Update Figma as Living Source of Truth",
    owner: "UX/UI", roles: ["ux"], start: "September", end: "September",
    deps: [], depText: "Build decisions and changes", critical: false,
    deliverables: ["Updated Figma file", "Change log"],
    acceptance: [
      "Figma reflects approved design changes",
      "Components are kept up to date",
      "Dev and stakeholders can rely on the file as source of truth"
    ]
  },
  {
    id: "4.4", epic: "E4", name: "Mid-Build Usability Testing",
    owner: "UX/UI", roles: ["ux"], start: "September", end: "September",
    deps: [], depText: "Working build available", critical: true,
    deliverables: ["Mid-build usability report", "Prioritised fix recommendations"],
    acceptance: [
      "10–15 participants test the working build",
      "Tasks cover real search, real filters, real collections, rights/access and My Lists",
      "Findings are prioritised",
      "Fixes are translated into Jira-ready backlog items"
    ]
  },
  {
    id: "4.5", epic: "E4", name: "Content Quality Assessment",
    owner: "Alli", roles: ["sme"], start: "September", end: "September",
    deps: [], depText: "Working build available; Content implemented", critical: true,
    deliverables: ["Content QA findings report"],
    acceptance: [
      "Page content is reviewed in the working build",
      "Collection descriptions are reviewed",
      "Rights statements are reviewed",
      "Help content is reviewed",
      "Metadata labels and warnings are checked"
    ]
  },
  {
    id: "4.6", epic: "E4", name: "SME Participation in User Testing",
    owner: "Alli", roles: ["sme"], start: "September", end: "September",
    deps: ["4.4"], depText: "Task 4.4 scheduled", critical: false,
    deliverables: ["Content findings report", "Terminology improvement recommendations"],
    acceptance: [
      "Alli observes user testing",
      "Content-related user issues are captured",
      "Terminology and instruction issues are identified",
      "Content improvements are prioritised"
    ]
  },

  /* ---------- EPIC 5 ---------- */
  {
    id: "5.1", epic: "E5", name: "Accessibility Audit",
    owner: "UX/UI", roles: ["ux"], start: "October", end: "October",
    deps: [], depText: "Stable build available", critical: true,
    deliverables: ["Accessibility audit report"],
    acceptance: [
      "WCAG 2.1 AA expectations are reviewed",
      "Keyboard navigation is tested",
      "Focus states are checked",
      "Contrast is checked",
      "Issues are logged and prioritised"
    ]
  },
  {
    id: "5.2", epic: "E5", name: "Design Consistency Audit",
    owner: "UX/UI", roles: ["ux"], start: "October", end: "October",
    deps: [], depText: "Stable build available", critical: false,
    deliverables: ["Design consistency report"],
    acceptance: [
      "Components are reviewed for consistency",
      "Spacing, typography and layout are checked",
      "Cross-page interaction patterns are reviewed",
      "Defects are added to backlog"
    ]
  },
  {
    id: "5.3", epic: "E5", name: "Stakeholder UAT",
    owner: "UX/UI", roles: ["ux", "sme", "dev"], start: "October", end: "October",
    deps: ["4.5"], depText: "Stable build available; Content QA completed", critical: true,
    deliverables: ["UAT plan", "UAT findings report"],
    acceptance: [
      "Researchers, academics, students and collection stakeholders are included",
      "Key MVP workflows are tested",
      "Issues are prioritised for go-live",
      "UAT findings are shared with Dev and SME"
    ]
  },
  {
    id: "5.4", epic: "E5", name: "Prioritise Go-Live Fixes",
    owner: "UX/UI", roles: ["ux", "dev"], start: "October", end: "October",
    deps: ["5.1", "5.2", "5.3"], depText: "Tasks 5.1, 5.2 and 5.3 complete", critical: true,
    deliverables: ["Go-live backlog", "Release risk register"],
    acceptance: [
      "Critical issues are identified",
      "Must-fix and post-launch items are separated",
      "Dev team has a clear prioritised fix list"
    ]
  },
  {
    id: "5.5", epic: "E5", name: "Final Content Review",
    owner: "Alli", roles: ["sme"], start: "October", end: "October",
    deps: ["4.5"], depText: "Stable build available; Task 4.5 complete", critical: false,
    deliverables: ["Content sign-off document"],
    acceptance: [
      "Collection pages are reviewed",
      "Help pages are reviewed",
      "Rights and access content is reviewed",
      "FAQs are reviewed",
      "Indigenous Cultural Data content is reviewed",
      "Content is approved or issues are logged"
    ]
  },
  {
    id: "5.6", epic: "E5", name: "Create CCS Case Study",
    owner: "Alli", roles: ["sme"], start: "October", end: "October",
    deps: [], depText: "Prototype validation insights; Build progress; User testing findings", critical: false,
    deliverables: ["CCS case study document"],
    acceptance: [
      "Case study explains the challenge, discovery research, user insights, solution, outcomes and future state",
      "Case study is suitable for internal communications or stakeholder reporting",
      "Case study includes evidence from testing and design work"
    ]
  },

  /* ---------- EPIC 6 ---------- */
  {
    id: "6.1", epic: "E6", name: "Final Design QA",
    owner: "UX/UI", roles: ["ux"], start: "November", end: "November",
    deps: ["5.4"], depText: "Go-live fixes implemented", critical: true,
    deliverables: ["Final design QA checklist", "Production UX sign-off"],
    acceptance: [
      "Final build is reviewed against approved designs",
      "Known issues are documented",
      "Production UX sign-off is provided or risks are recorded"
    ]
  },
  {
    id: "6.2", epic: "E6", name: "Final Developer Walkthrough",
    owner: "UX/UI + Dev Team", roles: ["ux", "dev"], start: "November", end: "November",
    deps: ["6.1"], depText: "Task 6.1 in progress", critical: false,
    deliverables: ["Release readiness checklist", "Open issue log"],
    acceptance: [
      "UX and Dev review remaining issues together",
      "Any outstanding defects are categorised",
      "Release confidence is documented"
    ]
  },
  {
    id: "6.3", epic: "E6", name: "Release Recommendations",
    owner: "UX/UI", roles: ["ux"], start: "November", end: "November",
    deps: ["6.1", "6.2"], depText: "Tasks 6.1 and 6.2 complete", critical: false,
    deliverables: ["Release recommendation summary", "Post-launch UX backlog"],
    acceptance: [
      "Go-live recommendation is documented",
      "Known limitations are captured",
      "Post-launch improvement opportunities are documented"
    ]
  },
  {
    id: "6.4", epic: "E6", name: "Final Content Approval",
    owner: "Alli", roles: ["sme"], start: "November", end: "November",
    deps: ["5.5"], depText: "Task 5.5 complete; Go-live fixes implemented", critical: false,
    deliverables: ["Final content approval document"],
    acceptance: [
      "All MVP content is reviewed after final changes",
      "Any remaining content issues are documented",
      "Content approval is provided or risks are recorded"
    ]
  }
];

/* Helpers shared by views */
const MONTH_INDEX = m => MONTHS.indexOf(m);
const epicById = id => EPICS.find(e => e.id === id);
const taskById = id => TASKS.find(t => t.id === id);

/* ==================================================================
   CCS Delivery Planner V2 — data model
   2026 Internal MVP (Jun–Dec 2026)  →  2027 Public Launch (Jan–Jun 2027)

   Two distinct delivery phases connected by a successful internal MVP.
   Each phase has its OWN month axis (separate timelines).

   Fields marked  (inferred)  were not given explicitly in the brief and
   were derived from the epic's stated duration / CCS conventions. They
   are editable in the app's Edit mode.
   ================================================================== */

/* Month axes — one per phase */
const MONTHS_2026 = ["June", "July", "August", "September", "October", "November", "December"];
const MONTHS_2027 = ["January", "February", "March", "April", "May", "June"];
const MONTHS_BY_PHASE = { "2026": MONTHS_2026, "2027": MONTHS_2027 };

const PHASES = {
  "2026": {
    id: "2026", label: "2026 Internal MVP", short: "MVP",
    window: "June – December 2026",
    audience: "Internal University users only (Collection Managers, Researchers, Academics, Students, Project Stakeholders)",
    publicAccess: "No",
    goal: "Validate search, metadata, data quality and workflows.",
    accent: "#2563B5"
  },
  "2027": {
    id: "2027", label: "2027 Public Launch", short: "Public",
    window: "January – June 2027",
    audience: "Public users",
    goal: "Transform the MVP into a public product.",
    accent: "#9A4DBC"
  }
};

const ROLES = {
  ux:  { id: "ux",  name: "UX/UI",                 owner: "Damian + Experience Design Lead", short: "UX" },
  sme: { id: "sme", name: "Collection Access SME", owner: "Alli",                            short: "SME" },
  dev: { id: "dev", name: "Development Team",       owner: "Dev Team",                        short: "DEV" },
  gov: { id: "gov", name: "Governance",             owner: "Shared",                          short: "GOV" }
};

/* Strategic principles per phase */
const PRINCIPLES = {
  "2026": [
    "Build less but validate more.",
    "Prioritise data over polish.",
    "Use Blacklight wherever possible.",
    "Minimise custom UI.",
    "Focus on integration challenges.",
    "Test with internal users.",
    "Do not optimise for public launch."
  ],
  "2027": [
    "Optimise for public users.",
    "Elevate accessibility.",
    "Build confidence and trust.",
    "Increase discoverability.",
    "Enhance visual polish.",
    "Improve storytelling and engagement."
  ]
};

/* Explicitly out of scope for 2026 */
const NOT_REQUIRED_2026 = [
  "Full Design System",
  "Pixel Perfect UI",
  "Rich storytelling experiences",
  "Extensive interaction specifications",
  "Heavy UAT",
  "Public marketing pages",
  "Advanced browse experiences",
  "Enhanced discoverability features",
  "Extensive responsive optimisation",
  "Public accessibility hardening"
];

/* Executive summary cards */
const EXEC_CARDS = [
  { label: "2026 Goal",          value: "Deliver an Internal MVP",  tone: "phase2026" },
  { label: "2027 Goal",          value: "Deliver a Public Product", tone: "phase2027" },
  { label: "Primary Risk",       value: "Backend Integrations",     tone: "risk" },
  { label: "Primary Dependency", value: "Data Availability",        tone: "dep" }
];

/* The single strategic message the app must communicate */
const STRATEGIC_MESSAGE = {
  "2026": "2026 is an Internal MVP focused on proving data integration and validating workflows.",
  "2027": "2027 is the Public Product focused on usability, accessibility, discoverability and experience refinement."
};

/* Blacklight Capability Matrix (Epic 2 artefact, surfaced in the app) */
const BLACKLIGHT_MATRIX = [
  { feature: "Search",            bucket: "Out of Box" },
  { feature: "Facets",            bucket: "Out of Box" },
  { feature: "Pagination",        bucket: "Out of Box" },
  { feature: "Metadata tables",   bucket: "Out of Box" },
  { feature: "Browse",            bucket: "Configure" },
  { feature: "Collection pages",  bucket: "Configure" },
  { feature: "My Lists",          bucket: "Custom Build" },
  { feature: "Request workflows", bucket: "Custom Build" },
  { feature: "Related Collections", bucket: "Future" },
  { feature: "Rich discovery",    bucket: "Future" }
];
const CAPABILITY_BUCKETS = ["Out of Box", "Configure", "Custom Build", "Future"];

/* Artefacts grouped by phase and role */
const ARTEFACTS = {
  "2026": {
    ux:  ["Usability findings", "Capability matrix", "Lightweight UI kit", "Sprint findings"],
    sme: ["Content inventory", "Content library", "FAQs", "Style guide"],
    dev: ["Integration maps", "Data ingestion", "Stable environments"]
  },
  "2027": {
    ux:  ["Design system", "Component library", "Accessibility reports", "UAT findings"],
    sme: ["Public content", "Case studies", "Narratives"],
    dev: ["Public environments", "Performance optimisation"]
  }
};

/* ---------------------------------------------------------------- EPICS
   Each epic: id, phase, title, colour, duration, owner, roles, purpose,
   start/end (month names within that phase's axis), depText.            */
const BASE_EPICS = [
  /* ===================== 2026 INTERNAL MVP ===================== */
  {
    id: "E0", phase: "2026", title: "Design Operations & Governance", colour: "#5B6B7B",
    duration: "June – December", owner: "Shared", roles: ["gov", "ux", "sme", "dev"],
    purpose: "Coordinate UX, content and development activities and manage risk and dependencies across the MVP.",
    description: "The MVP succeeds or fails on coordination, not just craft. UX, content and development run in parallel against a fixed timeline with hard backend dependencies, so without a standing operating rhythm decisions stall, rework creeps in and integration risk surfaces too late to absorb. This epic exists to keep the three workstreams aligned, surface blockers early, and give stakeholders a predictable forum for decisions — so the team can move fast on the MVP without losing control of risk.",
    start: "June", end: "December", depText: "None"
  },
  {
    id: "E1", phase: "2026", title: "Prototype Validation", colour: "#3B82C4",
    duration: "June – July", owner: "UX/UI", roles: ["ux"],
    purpose: "Validate the clickable prototype with internal users and turn findings into a prioritised backlog.",
    description: "Before any build effort is committed, we need evidence that the proposed experience works for real CCS users. Validating the prototype now is the cheapest point at which to find and fix problems — assumptions corrected on a clickable prototype cost hours, the same problems found after build cost weeks. This epic exists to replace opinion with evidence, de-risk the build scope, and produce a prioritised backlog that tells the team what actually matters to deliver in the MVP.",
    start: "June", end: "July", depText: "Prototype available"
  },
  {
    id: "E2", phase: "2026", title: "Blacklight Capability Alignment", colour: "#2BA89A",
    duration: "July", owner: "UX + Dev", roles: ["ux", "dev"],
    purpose: "Identify what Blacklight delivers out of the box and classify every feature: Out of Box, Configure, Custom Build or Future.",
    description: "The single biggest lever on MVP cost and timeline is using Blacklight for what it already does and only building what it genuinely cannot. Without a shared, agreed view of what is out of the box versus custom, UX risks designing experiences the platform can't support cheaply, and Dev risks rebuilding capability that already exists. This epic exists to create one honest capability map that grounds every downstream design and estimate, directly serving the 2026 principle of using Blacklight wherever possible and minimising custom UI.",
    start: "July", end: "July", depText: "Blacklight environment available"
  },
  {
    id: "E3", phase: "2026", title: "MVP Skinning", colour: "#C9831F",
    duration: "July – August", owner: "UX/UI", roles: ["ux"],
    purpose: "Create a lightweight University of Melbourne visual layer — not a full design system.",
    description: "The internal MVP needs to look credibly like a University of Melbourne product so internal users trust it and engage honestly in testing, but investing in a full design system now would be premature — the public design system is deliberately deferred to 2027. This epic exists to deliver just enough visual identity to make the MVP usable and recognisable, while consciously holding the line against polish that the internal audience does not need. It is the practical embodiment of 'build less, validate more'.",
    start: "July", end: "August", depText: "Blacklight capability matrix"
  },
  {
    id: "E4", phase: "2026", title: "Content Foundations", colour: "#8B5CC7",
    duration: "July – September", owner: "Alli", roles: ["sme"],
    purpose: "Create the core internal-MVP content: collection landing pages, help, FAQs, rights and metadata terminology.",
    description: "A search and discovery product is only as good as the content and terminology that surround it — empty collection pages, unclear rights statements or inconsistent metadata labels make even a well-built interface untestable. This epic exists so that when the MVP reaches users, they encounter real, plain-English content rather than placeholders, which is what makes validation findings trustworthy. It also establishes the terminology and style decisions that everything downstream, including the 2027 public content, will build on.",
    start: "July", end: "September", depText: "UX structures available"
  },
  {
    id: "E5", phase: "2026", title: "Development Sprint Validation", colour: "#C2476A",
    duration: "September – November", owner: "UX + Dev", roles: ["ux", "dev"],
    purpose: "Validate search, browse, metadata, collections and request workflows in working environments.",
    description: "This is where the MVP's core hypothesis is tested: that the real data, real search and real workflows hold up outside a prototype. Backend integrations are the programme's primary risk, and the only way to retire that risk is to exercise the working build against actual collections and request flows. This epic exists to find data-quality and integration problems while there is still time to act on them, turning the abstract risk of 'will the integrations work?' into concrete, prioritised findings.",
    start: "September", end: "November", depText: "Working environments available"
  },
  {
    id: "E6", phase: "2026", title: "Internal Pilot Readiness", colour: "#4A9E54",
    duration: "November – December", owner: "Shared", roles: ["gov", "ux", "sme", "dev"],
    purpose: "Prepare the MVP for an internal pilot: accessibility baseline, onboarding, known limitations and launch readiness.",
    description: "The internal pilot is the gate the whole 2027 public phase depends on, so the MVP must be packaged honestly: usable enough to learn from, with limitations documented rather than hidden. This epic exists to turn a working build into a credible pilot — onboarding internal users, establishing an accessibility baseline to carry into 2027, and producing a clear-eyed go/no-go recommendation. It is what lets leadership decide whether the MVP has earned the move to a public product.",
    start: "November", end: "December", depText: "Stable build available"
  },

  /* ===================== 2027 PUBLIC LAUNCH ===================== */
  {
    id: "E7", phase: "2027", title: "Public Product Strategy", colour: "#3E7CB1",
    duration: "January", owner: "UX/UI", roles: ["ux"],
    purpose: "Turn MVP findings, internal feedback and research into a public product strategy.",
    description: "The public product is a different proposition from the internal MVP — a broader audience, higher expectations and goals around discoverability, trust and engagement that the MVP deliberately did not pursue. Jumping straight into building public features would risk scaling up the wrong things. This epic exists to convert everything learned in 2026 into a deliberate strategy: what the public product is for, who it serves and how we will measure success, so the rest of the year builds toward an agreed target rather than reacting.",
    start: "January", end: "January", depText: "2026 pilot completed"
  },
  {
    id: "E8", phase: "2027", title: "Full UX/UI Design System", colour: "#9A6BC2",
    duration: "January – February", owner: "UX/UI", roles: ["ux"],
    purpose: "Build the complete CCS design system: colours, typography, components, interaction states and responsive behaviours.",
    description: "The lightweight MVP skin was right for internal validation but cannot carry a public product that needs consistency, accessibility and visual quality at scale. Building enhanced experiences on an ad-hoc visual layer would create rework and inconsistency. This epic exists to establish the reusable design foundation — components, states and responsive behaviour — that makes every later public feature faster to build, consistent by default, and accessible from the start. It is the investment in polish that 2026 deliberately postponed.",
    start: "January", end: "February", depText: "Public strategy complete"
  },
  {
    id: "E9", phase: "2027", title: "Enhanced User Experiences", colour: "#C56A2D",
    duration: "February – April", owner: "UX/UI", roles: ["ux"],
    purpose: "Build richer browse, related collections, discovery, storytelling and engagement patterns.",
    description: "An internal audience tolerates a functional, minimal experience because they are motivated to use it; a public audience has to be drawn in and helped to discover what the collections offer. The MVP proved the core works, but discoverability and engagement were explicitly out of scope. This epic exists to add the experiences that turn a working catalogue into something the public will explore and return to — richer browse, related collections and storytelling — directly serving the 2027 goals of discoverability and engagement.",
    start: "February", end: "April", depText: "Design system complete"
  },
  {
    id: "E10", phase: "2027", title: "Public Accessibility Hardening", colour: "#0E7C86",
    duration: "April – May", owner: "UX/UI", roles: ["ux"],
    purpose: "Full WCAG 2.1 AA implementation for public release.",
    description: "A public university product carries a legal and ethical obligation to be accessible to everyone, including users of assistive technology — an obligation an internal pilot could meet at baseline but a public launch cannot. Retrofitting accessibility after launch is far more costly and risky than building it in now. This epic exists to take the experience to full WCAG 2.1 AA before go-live, protecting the institution's compliance position and ensuring the collections are genuinely open to all users.",
    start: "April", end: "May", depText: "Stable public build available"
  },
  {
    id: "E11", phase: "2027", title: "Public Content Enhancement", colour: "#B23A6F",
    duration: "March – May", owner: "Alli", roles: ["sme"],
    purpose: "Enhance collection narratives, user guidance, FAQs, case studies and storytelling content.",
    description: "The functional content built for internal users gets the job done but does not tell the story of the collections or build the trust a public audience needs. The enhanced experiences in 2027 create new space for narrative, and that space has to be filled with quality content or the polish rings hollow. This epic exists to raise the content to public standard — richer narratives, clearer guidance and case studies — so the public product earns confidence and communicates the value of the collections, not just their contents.",
    start: "March", end: "May", depText: "Enhanced UX available"
  },
  {
    id: "E12", phase: "2027", title: "Public Launch Readiness", colour: "#4A9E54",
    duration: "May – June", owner: "Shared", roles: ["gov", "ux", "sme", "dev"],
    purpose: "UAT, performance checks, release recommendations and launch readiness for go-live.",
    description: "A public launch is a one-way door: the first impression is made once, under real load, in front of an external audience. Everything built across 2027 has to be proven to work together before that door opens. This epic exists to provide the final assurance — user acceptance testing, performance validation and a documented go-live recommendation — so the decision to launch is made on evidence, with known limitations captured and a post-launch plan in place rather than discovered in production.",
    start: "May", end: "June", depText: "All previous epics complete"
  }
];

/* ---------------------------------------------------------------- TASKS
   start/end are month names within the epic's phase axis.
   (inferred) months/criteria derived from the epic duration + CCS style. */
const BASE_TASKS = [
  /* ---------- E0 Design Operations & Governance ---------- */
  mkTask("0.1", "E0", "Weekly UX + SME sync", ["ux","sme","gov"], "June", "December", "None", false,
    ["Decision log", "Action register"],
    ["Weekly meeting scheduled", "Actions and decisions documented", "UX/content dependencies tracked"],
    "UX and content decisions constantly affect each other — a page structure changes what content is needed, and a content constraint changes the design. A weekly sync keeps the two in step so dependencies are caught in days rather than discovered at handover, and so Alli and the design team share one source of truth on what has been decided and what is outstanding."),
  mkTask("0.2", "E0", "Weekly UX + Dev sync", ["ux","dev","gov"], "June", "December", "None", false,
    ["Developer question log", "Interaction decision log"],
    ["Developers have a regular forum for UX questions", "Build-impacting issues reviewed weekly"],
    "Build decisions made without UX input, or design decisions made without understanding platform constraints, are the most common source of expensive rework. A standing UX–Dev forum gives developers a fast, low-friction route to resolve interaction questions and lets UX see build-impacting issues early, keeping design intent and what is actually buildable aligned week to week."),
  mkTask("0.3", "E0", "Fortnightly stakeholder reviews", ["ux","gov"], "June", "December", "Evolving designs", false,
    ["Review pack", "Feedback log"],
    ["Stakeholders review progress at agreed intervals", "Feedback captured and prioritised"],
    "Stakeholders who only see the work at the end tend to ask for changes at the most expensive moment. A regular, predictable review cadence keeps them informed, surfaces concerns while they are still cheap to act on, and builds the shared confidence the programme needs to keep moving — without letting feedback arrive ad hoc and derail delivery."),
  mkTask("0.4", "E0", "Monthly governance reviews", ["gov","sme"], "June", "December", "None", false,
    ["Governance register"],
    ["Ownership is clear", "Approval status is visible"],
    "Content and decisions need clear ownership and an approval trail, especially around rights and sensitive collection material. A monthly governance review makes sure nothing important is sitting unowned or unapproved, and gives the programme an auditable record of who agreed what — which matters more as the work moves toward a public audience."),
  mkTask("0.5", "E0", "Risk management", ["gov"], "June", "December", "None", true,
    ["Risk register"],
    ["Risks logged with owner and mitigation", "Backend integration risks tracked explicitly", "Risks escalated early"],
    "Backend integration is the programme's primary risk, and risks that are not actively tracked tend to be acknowledged only once they have already cost time. Running risk management as a deliberate, continuous activity — with named owners and mitigations — is what lets the team see integration and data problems coming and act before they threaten the MVP timeline."),
  mkTask("0.6", "E0", "Dependency management", ["gov"], "June", "December", "None", true,
    ["Action register", "Dependency map"],
    ["Cross-stream dependencies are visible", "Data availability tracked as primary dependency"],
    "Three workstreams running in parallel against hard data dependencies will quietly block each other unless someone is explicitly maintaining the dependency map. Data availability is the primary dependency for the whole MVP, so making cross-stream dependencies visible and owned is what prevents a late piece of data or a missing environment from stalling work that was otherwise ready to go."),

  /* ---------- E1 Prototype Validation ---------- */
  mkTask("1.1", "E1", "Conduct usability testing", ["ux"], "June", "June", "Prototype available", true,
    ["Test plan", "Observation notes"],
    ["Internal participants tested across search, browse, metadata and workflows", "Findings captured consistently"],
    "This is the moment we replace assumptions with evidence. Watching real CCS users attempt real tasks on the prototype reveals where the experience confuses, blocks or misleads them — problems that are nearly invisible to the people who designed it. Doing this before build is the cheapest possible point to learn, and it is what gives every later prioritisation decision a factual basis rather than an opinion."),
  mkTask("1.2", "E1", "Analyse findings", ["ux"], "June", "July", "Task 1.1 complete", false,
    ["Findings report"],
    ["Findings grouped by theme", "Issues ranked by severity"],
    "Raw observations are not decisions. Analysis turns a pile of session notes into themed, severity-ranked findings the team can actually act on, separating the genuinely blocking problems from the cosmetic. Without this step the testing effort produces anecdotes rather than direction, and the build risks fixing the loudest issue instead of the most important one."),
  mkTask("1.3", "E1", "Prioritise issues", ["ux"], "July", "July", "Task 1.2 complete", false,
    ["Prioritised backlog"],
    ["Issues prioritised for the MVP", "Backlog ready to inform build"],
    "An MVP is defined as much by what it leaves out as what it includes. Prioritising the findings forces the explicit trade-offs about what is worth fixing now versus deferring, keeping the build focused on what proves the product rather than gold-plating it. The output is the backlog that tells developers exactly what the MVP needs to address."),
  mkTask("1.4", "E1", "Refine prototype", ["ux"], "July", "July", "Task 1.3 complete", false,
    ["Updated prototype"],
    ["Prototype updated against prioritised findings"],
    "Updating the prototype to reflect the prioritised findings means the build starts from a design that has already absorbed user feedback, not the original untested guess. It gives developers and stakeholders a single, corrected reference for what is being built, reducing ambiguity and the questions that would otherwise surface mid-build."),

  /* ---------- E2 Blacklight Capability Alignment ---------- */
  mkTask("2.1", "E2", "Map features to capability buckets", ["ux","dev"], "July", "July", "Blacklight environment available", true,
    ["Blacklight Capability Matrix"],
    ["Every MVP feature classified as Out of Box, Configure, Custom Build or Future",
     "Search, facets, pagination and metadata tables confirmed Out of Box",
     "My Lists identified as Custom; Related Collections deferred to Future"],
    "This single artefact governs how much the MVP costs. Classifying each feature against what Blacklight already provides stops UX from designing experiences that quietly require expensive custom work, and stops Dev from rebuilding what the platform offers for free. It is the decision point that turns the principle 'use Blacklight wherever possible' from an aspiration into a concrete, shared plan."),
  mkTask("2.2", "E2", "Confirm custom build effort", ["dev"], "July", "July", "Task 2.1 complete", true,
    ["Custom build estimate"],
    ["Custom items sized for the MVP", "Integration risks flagged"],
    "Knowing something is custom is not the same as knowing what it will cost. Sizing the custom items and flagging their integration risks turns the capability map into a realistic plan, exposing early whether the MVP scope is achievable in the timeline or whether something has to give. This is where the primary risk — backend integration — first gets a concrete estimate attached to it."),

  /* ---------- E3 MVP Skinning ---------- */
  mkTask("3.1", "E3", "Create lightweight UI kit", ["ux"], "July", "August", "Blacklight capability matrix", false,
    ["Lightweight UI Kit"],
    ["Header, footer, typography, buttons, cards and logo placement created",
     "No full design system or heavy interaction states produced",
     "Kit applies a University of Melbourne visual layer"],
    "Internal users need to recognise this as a University of Melbourne product to trust it and engage seriously in testing, but a full design system would be wasted effort this year. A deliberately lightweight kit gives the MVP credible identity at the lowest cost, and the explicit scope limits protect the team from drifting into polish that the public design system will properly address in 2027."),

  /* ---------- E4 Content Foundations ---------- */
  mkTask("4.1", "E4", "Create collection landing page content", ["sme"], "July", "August", "UX structures available", false,
    ["Collection content pack"],
    ["Collection summaries and rights language drafted"],
    "Collection pages are where users decide whether a collection is relevant to them, and empty or placeholder pages make that judgement impossible — and make any test of the browse experience meaningless. Drafting real summaries and rights language gives the MVP credible, testable content and gets the often-sensitive rights wording reviewed early rather than at launch."),
  mkTask("4.2", "E4", "Create help content and FAQs", ["sme"], "August", "September", "UX structures available", false,
    ["Help content pack", "FAQs"],
    ["Plain-English help and FAQs drafted for internal users"],
    "When users get stuck, the help content is what determines whether they recover or abandon the task — and whether a usability problem is in the interface or simply in unclear guidance. Providing plain-English help and FAQs lets the MVP support real journeys and helps the team distinguish design issues from content gaps during validation."),
  mkTask("4.3", "E4", "Define metadata terminology", ["sme"], "August", "September", "Content inventory", false,
    ["Content style guide"],
    ["Preferred terms documented", "Metadata labels aligned where possible"],
    "Inconsistent or jargon-heavy metadata labels quietly undermine search and browse — users can't find or trust what they don't understand. Agreeing preferred terms and a style guide now creates consistency across the whole product and establishes the terminology foundation that the 2027 public content will inherit, avoiding a costly relabelling exercise later."),

  /* ---------- E5 Development Sprint Validation ---------- */
  mkTask("5.1", "E5", "Validate search and browse", ["ux","dev"], "September", "October", "Working environments available", true,
    ["Sprint findings report"],
    ["Real search and browse validated against expectations", "Issues logged and prioritised"],
    "Search and browse are the front door to the collections — if they fail against real data, nothing else matters. Prototype testing can't reveal how the actual index behaves with real records, so validating the working build is the first point we learn whether the core discovery experience genuinely holds up. This is a critical, integration-dependent check at the heart of the MVP's hypothesis."),
  mkTask("5.2", "E5", "Validate metadata and collections", ["ux","dev"], "October", "November", "Working environments available", false,
    ["Sprint findings report"],
    ["Metadata display and collection pages validated", "Data quality issues captured"],
    "Metadata is where data-quality problems become visible to users — wrong, missing or inconsistent fields erode trust immediately. Validating real metadata display and collection pages in the build surfaces these issues while there is still time to fix data or display rules, and feeds concrete data-quality findings back to the teams who own the source records."),
  mkTask("5.3", "E5", "Validate request workflows", ["ux","dev"], "October", "November", "Working environments available", true,
    ["Sprint findings report"],
    ["Request workflows validated end to end", "Integration gaps documented"],
    "Request workflows are the most integration-heavy part of the experience and therefore the most likely to break in ways a prototype never could. Validating them end to end is how we confront the programme's primary risk directly, documenting integration gaps early enough to address them rather than discovering them at pilot or, worse, at public launch."),

  /* ---------- E6 Internal Pilot Readiness ---------- */
  mkTask("6.1", "E6", "Accessibility baseline checks", ["ux"], "November", "December", "Stable build available", false,
    ["Accessibility baseline note"],
    ["Baseline accessibility checks complete", "Known gaps recorded for 2027 hardening"],
    "Full accessibility hardening is a 2027 activity, but the internal pilot still needs a known baseline so we understand where we stand and don't exclude pilot users unnecessarily. Capturing that baseline now also gives the 2027 hardening epic a documented starting point and gap list, so the public accessibility work begins from evidence rather than a blank sheet."),
  mkTask("6.2", "E6", "Internal onboarding", ["gov","sme"], "November", "December", "Stable build available", false,
    ["Onboarding pack"],
    ["Internal pilot users can be onboarded"],
    "A pilot only generates useful learning if real users can actually get into the product and know what to do. An onboarding pack removes the friction of getting internal users started, so the pilot produces genuine usage and feedback rather than a stream of access and how-do-I questions."),
  mkTask("6.3", "E6", "Known limitations register", ["gov"], "December", "December", "Sprint findings", false,
    ["Known limitations register"],
    ["Limitations documented and shared", "Items routed to 2027 where appropriate"],
    "Being honest about what the MVP does not do is what keeps stakeholder expectations realistic and protects the team's credibility. A shared limitations register sets the right expectations for pilot users, prevents known gaps from being mistaken for defects, and becomes the seed of the 2027 backlog by routing deferred items to the public phase."),
  mkTask("6.4", "E6", "Internal launch readiness", ["gov","ux","dev"], "December", "December", "Tasks 6.1–6.3 complete", true,
    ["Internal pilot recommendation"],
    ["Go/no-go recommendation for the internal pilot is documented"],
    "This is the decision gate the entire two-phase strategy hinges on: the 2027 public phase is explicitly conditional on a successful internal MVP. A documented go/no-go recommendation forces an evidence-based judgement on whether the MVP has proven the data and workflows, giving leadership a defensible basis to commit to — or pause before — the public investment."),

  /* ===================== 2027 ===================== */
  /* ---------- E7 Public Product Strategy ---------- */
  mkTask("7.1", "E7", "Analyse MVP findings", ["ux"], "January", "January", "2026 pilot completed", true,
    ["Public product strategy"],
    ["MVP findings and internal feedback synthesised", "Research revisited"],
    "The MVP was run specifically to generate learning, and that learning is only valuable if it actively shapes the public product. Synthesising the pilot findings and revisiting research is what carries the hard-won evidence from 2026 into 2027, ensuring the public build responds to what was actually discovered rather than quietly reverting to the original assumptions."),
  mkTask("7.2", "E7", "Define public product strategy", ["ux"], "January", "January", "Task 7.1 complete", false,
    ["Public product strategy"],
    ["Strategy defines public scope, audience and success measures"],
    "The public product pursues goals — discoverability, trust, engagement — that the MVP deliberately set aside, so it needs its own explicit definition of scope, audience and success. Setting that strategy up front gives every later 2027 epic a shared target to build toward and a yardstick to measure against, preventing the year from becoming a series of disconnected enhancements."),

  /* ---------- E8 Full UX/UI Design System ---------- */
  mkTask("8.1", "E8", "Define foundations (colour, type)", ["ux"], "January", "February", "Public strategy complete", false,
    ["CCS Design System v1"],
    ["Colour and typography systems documented"],
    "Colour and typography are the foundation every component and screen inherits, and getting them right once — with accessibility built in — prevents inconsistency and contrast problems propagating across the whole public product. Defining these foundations first is what lets the rest of the design system be built coherently rather than assembled piecemeal."),
  mkTask("8.2", "E8", "Build component library", ["ux"], "February", "February", "Task 8.1 complete", false,
    ["Component library"],
    ["Reusable components documented with naming conventions"],
    "A documented, reusable component library is what makes the public build fast, consistent and maintainable — every team draws from the same parts instead of reinventing buttons, cards and forms. Without it the enhanced experiences would each solve the same problems differently, producing exactly the inconsistency a public product can't afford."),
  mkTask("8.3", "E8", "Define interaction & responsive states", ["ux"], "February", "February", "Task 8.2 complete", false,
    ["Interaction state specs"],
    ["Interaction states and responsive behaviours defined"],
    "Public users arrive on every device and in every state — loading, error, empty, mobile, keyboard-only — and a product that only handles the happy path feels broken to them. Specifying interaction and responsive states is what makes the experience feel robust and trustworthy in the real conditions a public audience will actually use it under."),

  /* ---------- E9 Enhanced User Experiences ---------- */
  mkTask("9.1", "E9", "Design enhanced browse & discovery", ["ux"], "February", "March", "Design system complete", false,
    ["Enhanced UX backlog"],
    ["Better browse and richer discovery designed"],
    "The MVP proved users can find what they already know to look for; a public product also has to help people discover what they didn't know existed. Designing richer browse and discovery directly serves the 2027 discoverability goal, turning a functional search tool into something the public will explore rather than just query."),
  mkTask("9.2", "E9", "Design related collections", ["ux"], "March", "April", "Design system complete", false,
    ["Enhanced UX backlog"],
    ["Related collections experience designed"],
    "Related collections is exactly the kind of feature deferred from the MVP as 'Future' in the capability matrix, because it adds discovery value but isn't needed to prove the basics. Designing it now lets public users move laterally between connected material, deepening engagement and surfacing the breadth of the collections in a way a flat search never could."),
  mkTask("9.3", "E9", "Design storytelling & engagement", ["ux"], "March", "April", "Design system complete", false,
    ["Enhanced UX backlog"],
    ["Storytelling and engagement patterns designed"],
    "A public audience needs a reason to care, not just a way to search. Storytelling and engagement patterns give the collections context and meaning, helping the product communicate why the material matters and encouraging return visits — directly serving the 2027 goals of engagement and building confidence in the collections."),

  /* ---------- E10 Public Accessibility Hardening ---------- */
  mkTask("10.1", "E10", "Implement WCAG 2.1 AA", ["ux"], "April", "May", "Stable public build available", true,
    ["Accessibility certification report"],
    ["Full WCAG 2.1 AA implementation completed", "Keyboard, focus and contrast verified", "Issues remediated and re-tested"],
    "A public university service must be usable by everyone, including people relying on assistive technology, and WCAG 2.1 AA is the standard that obligation is measured against. Implementing and verifying it before launch protects the institution legally and reputationally, and ensures the collections are genuinely open to all — something that is far cheaper and more credible to build in now than to retrofit after go-live."),

  /* ---------- E11 Public Content Enhancement ---------- */
  mkTask("11.1", "E11", "Enhance collection narratives", ["sme"], "March", "April", "Enhanced UX available", false,
    ["Public content library"],
    ["Collection narratives enriched for public audience"],
    "The enhanced storytelling experiences create space for narrative, and that space is wasted — or worse, looks hollow — if it is filled with the terse functional copy written for internal users. Enriching collection narratives for a public audience is what makes the polished experiences actually land, communicating the significance of the collections rather than just listing their contents."),
  mkTask("11.2", "E11", "Enhance guidance, FAQs, case studies", ["sme"], "April", "May", "Enhanced UX available", false,
    ["Public content library", "Case studies"],
    ["Public guidance, FAQs and case studies produced"],
    "Public users arrive with less context and more varied needs than internal staff, so guidance has to work harder to build confidence and self-sufficiency. Producing public-standard guidance, FAQs and case studies reduces support burden, helps users succeed unaided, and demonstrates real-world value — all of which build the trust the public product depends on."),

  /* ---------- E12 Public Launch Readiness ---------- */
  mkTask("12.1", "E12", "UAT", ["ux","sme","dev","gov"], "May", "June", "All previous epics complete", true,
    ["UAT findings"],
    ["Public workflows tested with representative users", "Issues prioritised for go-live"],
    "Everything built across 2027 has to work as a whole, with representative public users, before launch — the first public impression is made only once. UAT is the final, integrated check that the public workflows hold together end to end, surfacing the issues that only appear when real users meet the finished product, while there is still time to fix or consciously defer them."),
  mkTask("12.2", "E12", "Performance checks", ["dev"], "May", "June", "Stable public build", true,
    ["Performance report"],
    ["Performance validated under expected public load"],
    "Internal pilot load is nothing like public traffic, and a product that is slow or unstable under real demand fails at exactly the moment it matters most. Validating performance against expected public load before go-live is what prevents a launch-day collapse and confirms the infrastructure can carry the audience the product is about to invite in."),
  mkTask("12.3", "E12", "Release recommendations & launch readiness", ["gov","ux"], "June", "June", "Tasks 12.1–12.2 complete", true,
    ["Go Live recommendation"],
    ["Go-live recommendation documented", "Known limitations and post-launch backlog captured"],
    "Launch is a one-way, high-visibility decision, so it should be made on consolidated evidence rather than optimism. Pulling the UAT and performance results into a clear go-live recommendation — with known limitations and a post-launch backlog captured — gives decision-makers a defensible basis to launch, and ensures anything deferred is recorded and owned rather than forgotten the moment the product goes public.")
];

/* Task factory keeps the data block readable.
   `description` (the "why" of the task) is the optional final argument. */
function mkTask(id, epic, name, roles, start, end, depText, critical, deliverables, acceptance, description) {
  const owner = roles.includes("sme") && roles.length === 1 ? "Alli"
    : roles.includes("dev") && roles.includes("ux") ? "UX + Dev"
    : roles.includes("ux") && roles.length === 1 ? "UX/UI"
    : "Shared";
  return {
    id, epic, name, owner, roles, start, end,
    deps: depText && /Task ([\d.]+)/.test(depText) ? (depText.match(/Task ([\d.,–\- ]+)/) ? extractDeps(depText) : []) : [],
    depText: depText || "None", critical: !!critical,
    deliverables: deliverables || [], acceptance: acceptance || [],
    description: description || ""
  };
}
function extractDeps(text) {
  const ids = [];
  const m = text.match(/\d+\.\d+/g);
  if (m) m.forEach(x => ids.push(x));
  return ids;
}

/* Mutable working copies (populated by buildModel in script.js) */
let EPICS = [];
let TASKS = [];

/* Helpers */
const phaseOf = epicId => (epicById(epicId) || BASE_EPICS.find(e => e.id === epicId) || {}).phase;
const monthsForPhase = phase => MONTHS_BY_PHASE[phase] || MONTHS_2026;
const MONTH_INDEX = (m, phase) => monthsForPhase(phase).indexOf(m);
const epicById = id => EPICS.find(e => e.id === id) || BASE_EPICS.find(e => e.id === id);
const taskById = id => TASKS.find(t => t.id === id) || BASE_TASKS.find(t => t.id === id);
const cloneDeep = obj => JSON.parse(JSON.stringify(obj));

// Domain vocabulary shared by forms, validation, and dashboards.

export const OPPORTUNITY_STAGES = [
  "Target Account",
  "Planned Visit",
  "Visit Done",
  "Technical Discussion",
  "Enquiry Received",
  "RFQ Issued",
  "Proposal Development",
  "Quotation Submitted",
  "Technical Clarification",
  "Commercial Negotiation",
  "Final Offer",
  "On Hold",
  "Awarded",
  "Lost",
] as const;
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

// Stages at or past "RFQ Issued" count as late-funnel for scoring.
export const LATE_FUNNEL_STAGES: OpportunityStage[] = [
  "RFQ Issued",
  "Proposal Development",
  "Quotation Submitted",
  "Technical Clarification",
  "Commercial Negotiation",
  "Final Offer",
  "Awarded",
];

export const INDUSTRIES = ["Oil & Gas", "Chemical", "Power", "Pharma", "Water"];

export const PRODUCT_LINES = [
  "Pumps",
  "Seals",
  "Heat Exchangers",
  "Valves",
  "Service",
  "Spares",
];

export const ACCOUNT_TYPES = ["End User", "EPC", "Consultant"];

export const EQUIPMENT_OPTIONS = [
  "Pump",
  "Mechanical Seal",
  "Heat Exchanger",
  "Valve",
  "Coupling",
  "Gasket",
  "Compressor",
  "Agitator",
];

export const VISIT_PURPOSES = [
  "First visit / introduction",
  "Follow-up",
  "Technical presentation",
  "Installed base audit",
  "Spec-in discussion",
  "Problem investigation",
  "Commercial negotiation",
];

export const VISIT_STATUSES = ["planned", "done"] as const;

export const ENQUIRY_STATUSES = ["open", "quoted", "closed", "cancelled"];

export const RFQ_STATUSES = ["received", "clarification", "quoted", "closed"];

export const QUOTATION_STATUSES = ["draft", "submitted", "won", "lost"] as const;

export const INFLUENCE_LEVELS = ["High", "Medium", "Low"];

export const ROLES_IN_PURCHASE = [
  "Technical Approver",
  "Commercial Decision Maker",
  "Technical Influencer",
  "End User",
  "Gatekeeper",
];

export const OPPORTUNITY_POTENTIALS = ["Firm", "Budgetary", "Long-shot"];

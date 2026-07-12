export interface Account {
  id: string;
  created_at: string;
  name: string;
  industry: string;
  segment: string | null;
  country: string | null;
  city: string | null;
  account_type: string | null;
  key_plants: string[] | null;
  epc_consultants: string[] | null;
  installed_base_notes: string | null;
  target_pumps: number;
  target_seals: number;
  target_hex: number;
  target_service: number;
  target_spares: number;
  owner_name: string | null;
  last_visit_date: string | null;
}

export interface Contact {
  id: string;
  created_at: string;
  account_id: string | null;
  full_name: string;
  title: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  role_in_purchase: string | null;
  influence_level: string | null;
  accounts?: Pick<Account, "id" | "name"> | null;
}

export interface VisitReport {
  id: string;
  created_at: string;
  account_id: string | null;
  visit_date: string;
  visit_purpose: string;
  process_unit: string | null;
  equipment_discussed: string[] | null;
  contacts_met: string[] | null;
  operating_problem: string | null;
  competitor_at_site: string | null;
  customer_pain_point: string | null;
  opportunity_potential: string | null;
  next_action: string | null;
  next_action_owner: string | null;
  next_action_deadline: string | null;
  visit_status: string;
  attachments: string[] | null;
  converted_to_enquiry: boolean;
  accounts?: Pick<Account, "id" | "name" | "industry"> | null;
}

export interface Enquiry {
  id: string;
  created_at: string;
  enquiry_number: string;
  account_id: string | null;
  visit_report_id: string | null;
  project_name: string | null;
  equipment_type: string;
  process_data: string | null;
  required_delivery_weeks: number | null;
  bid_due_date: string | null;
  competitor: string | null;
  probability: number;
  status: string;
  accounts?: Pick<Account, "id" | "name" | "industry"> | null;
  visit_reports?: Pick<VisitReport, "id" | "visit_date" | "visit_purpose"> | null;
}

export interface Rfq {
  id: string;
  created_at: string;
  rfq_number: string;
  enquiry_id: string | null;
  account_id: string | null;
  technical_requirement: string | null;
  scope: string | null;
  bid_due_date: string | null;
  clarification_log: string | null;
  commercial_terms: string | null;
  bid_bond_required: boolean;
  compliance_matrix_notes: string | null;
  status: string;
  accounts?: Pick<Account, "id" | "name"> | null;
  enquiries?: Pick<Enquiry, "id" | "enquiry_number" | "project_name"> | null;
}

export interface Quotation {
  id: string;
  created_at: string;
  quotation_number: string;
  rfq_id: string | null;
  account_id: string | null;
  equipment_selection: string | null;
  bom_summary: string | null;
  cost_usd: number | null;
  selling_price_usd: number | null;
  margin_pct: number | null;
  delivery_weeks: number | null;
  warranty_months: number | null;
  payment_terms: string | null;
  commercial_deviation: string | null;
  status: string;
  submitted_date: string | null;
  result: string | null;
  accounts?: Pick<Account, "id" | "name"> | null;
  rfqs?: Pick<Rfq, "id" | "rfq_number"> | null;
}

export interface Opportunity {
  id: string;
  created_at: string;
  enquiry_id: string | null;
  account_id: string | null;
  title: string;
  stage: string;
  product_line: string | null;
  industry: string | null;
  value_usd: number | null;
  probability: number;
  expected_close_date: string | null;
  competitor: string | null;
  notes: string | null;
  ai_score: number | null;
  ai_score_source: string | null;
  ai_score_confidence: number | null;
  ai_score_review_status: string;
  accounts?: Pick<Account, "id" | "name"> | null;
  enquiries?: Pick<Enquiry, "id" | "enquiry_number" | "project_name"> | null;
}

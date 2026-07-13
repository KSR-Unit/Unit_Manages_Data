// ============================================================
// Central TypeScript type definitions for the entire project
// ============================================================

// --- Auth & Profile ---
export type UserRole = 'user' | 'subadmin' | 'admin';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  status: 'เปิด' | 'ปิด';
  name: string | null;
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  phone: string | null;
  unit_code: string | null;
  created_at?: string;
  updated_at?: string;
}

// --- Dashboard Stats ---
export interface DashboardStats {
  counts: {
    meetings: number;
    plans: number;
    activities: number;
    trainings: number;
    budgets: number;
    emsReports: number;
    otherLaws: number;
  };
  totalBudget: number;
  totalDisputeValue: number;
  mediationResults: { name: string; value: number }[];
  recentItems: RecentItem[];
  trackingStatus: 'green' | 'yellow' | 'red';
  trackingDetails: any | null;
}

export interface RecentItem {
  id: string;
  type: string;
  title: string;
  date: string;
  timestamp: number;
  icon: any;
  color: string;
}

// --- AI Voice Autofill ---
// The shape stored in sessionStorage('ai_pending_autofill')
export interface AiPendingAutofill {
  category: string;   // e.g. 'meetings', 'plans', 'justice_fund'
  data: Record<string, any>;
}

// Shape returned by /api/ai/classify-and-parse
export interface ClassifyAndParseResult {
  category: string;
  categoryTitle: string;
  categoryPath: string;
  data: Record<string, any>;
}

// --- Form Field Schema (used in [category]/page.tsx + VoiceAssistantCard) ---
export interface SelectOption {
  value: string;
  label: string;
}

export interface ConditionalRule {
  field: string;
  showIf: string;
}

export interface FieldSchema {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'number' | 'select' | 'radio' | 'file';
  required?: boolean;
  placeholder?: string;
  pattern?: string;
  title?: string;
  options?: SelectOption[];
  conditional?: ConditionalRule;
  hideLabel?: boolean;
}

export interface ColumnSchema {
  key: string;
  label: string;
  format?: (val: any) => string;
}

export interface CategoryConfig {
  title: string;
  table: string;
  idField: string;
  fields: FieldSchema[];
  columns: ColumnSchema[];
}

// --- Meeting Attendee ---
export interface MeetingAttendee {
  id: string;
  attendee_name: string;
  check_in_time: string;
}

// --- Justice Fund ---
export interface JusticeFundScheduleRow {
  time: string;
  topic: string;
  lecturer: string;
}

export interface JusticeFundExpenseRow {
  item: string;
  qty: number;
  multiplier: number;
  price: number;
  total: number;
}

export interface JusticeFundReferenceRow {
  name: string;
  position: string;
  office: string;
  contact: string;
}

// --- Plans ---
export interface PlanActivity {
  id?: string;
  name: string;
  start_date: string;
  end_date: string;
  budget: string | number;
  owner: string;
}

// --- Assessment ---
export interface AssessmentCriteriaItem {
  key: string;
  label: string;
}

export interface AssessmentCriteriaGroup {
  title: string;
  items: AssessmentCriteriaItem[];
}

export interface AssessmentSettings {
  targetYear: string;
  startDate: string;
  endDate: string;
  welcomeMessage: string;
  regulationLink: string;
}

export interface CriteriaEntry {
  score: number;
  desc: string;
  file_url: string;
}

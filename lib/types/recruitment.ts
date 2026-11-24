export type LanguageCode = "en" | "hi" | "mr";

export const SUPPORTED_LANGUAGES: readonly LanguageCode[] = ["en", "hi", "mr"] as const;

export type VerificationStatus =
  | "pending"
  | "verified"
  | "review_required"
  | "rejected"
  | "superseded";

export type EditorialState =
  | "draft"
  | "queued"
  | "approved"
  | "published"
  | "unpublished"
  | "archived";

export type RecruitmentLifecycleStatus =
  | "upcoming"
  | "application_open"
  | "closing_soon"
  | "application_closed"
  | "admit_card_released"
  | "exam_scheduled"
  | "answer_key_released"
  | "result_declared"
  | "completed"
  | "correction_required"
  | "archived";

export type EmploymentType =
  | "permanent"
  | "contractual"
  | "apprenticeship"
  | "fellowship";

export type LinkType =
  | "official_notification"
  | "official_apply"
  | "official_website"
  | "admit_card"
  | "result"
  | "answer_key"
  | "syllabus"
  | "corrigendum";

export type LinkStatus =
  | "unchecked"
  | "valid"
  | "redirected"
  | "unavailable"
  | "suspicious"
  | "requires_review";

export type RecruitmentDateType =
  | "notification"
  | "application_start"
  | "application_end"
  | "fee_payment_deadline"
  | "correction_window_start"
  | "correction_window_end"
  | "admit_card"
  | "exam_date"
  | "answer_key"
  | "objection_deadline"
  | "result_date"
  | "document_verification";

export interface LocalizedText {
  en: string;
  hi?: string;
  mr?: string;
}

export interface RecruitmentPostItem {
  postName: LocalizedText;
  postCode?: string;
  vacancyCount: number | null;
  payLevel: string | null;
  qualificationSummary: LocalizedText;
  ageRange: string | null;
}

export interface RecruitmentDateItem {
  dateType: RecruitmentDateType;
  label: LocalizedText;
  /** Date-only YYYY-MM-DD when source does not specify a time; null if unannounced */
  eventDate: string | null;
  /** Only populated when the official notice explicitly specifies a time */
  eventTimeLabel?: string | null;
  isTentative?: boolean;
  isExtended?: boolean;
}

export interface FeeScheduleItem {
  category: LocalizedText;
  amountInr: number | null;
  notes?: LocalizedText;
}

export interface RecruitmentLinkItem {
  linkType: LinkType;
  label: LocalizedText;
  url: string;
  isVerifiedOfficial: boolean;
  linkStatus: LinkStatus;
  isExpired?: boolean;
}

export interface RecruitmentFaqItem {
  question: LocalizedText;
  answer: LocalizedText;
}

export interface UpdateHistoryItem {
  updatedAt: string;
  summary: LocalizedText;
  sourceReference: string;
}

export interface RecruitmentRecord {
  id: string;
  slug: string;
  isSamplePreview: boolean;
  title: LocalizedText;
  summary: LocalizedText;
  organisation: LocalizedText;
  officialEnglishOrganisation: string;
  department: LocalizedText;
  stateCode: string;
  stateSlug: string;
  categorySlug: string;
  qualificationSlugs: string[];
  cycleLabel: string;
  notificationReference: string | null;
  vacancyTotal: number | null;
  employmentType: EmploymentType;
  lifecycleStatus: RecruitmentLifecycleStatus;
  verificationStatus: VerificationStatus;
  editorialState: EditorialState;
  availableLanguages: LanguageCode[];
  firstPublishedAt: string;
  lastVerifiedAt: string;
  applicationStart: string | null;
  applicationEnd: string | null;
  minAge: number | null;
  maxAge: number | null;
  ageCutOffDate: string | null;
  ageRelaxationNote: LocalizedText;
  experienceRequirement: LocalizedText;
  paySummary: {
    displayLabel: string | null;
    period: "monthly" | "annual" | "basic_pay" | "pay_level" | "unspecified";
    isApproximate: boolean;
    sourceBasis: LocalizedText;
  };
  posts: RecruitmentPostItem[];
  dates: RecruitmentDateItem[];
  feeSchedule: FeeScheduleItem[];
  selectionStages: LocalizedText[];
  examPatternSummary: LocalizedText;
  requiredDocuments: LocalizedText[];
  applicationSteps: LocalizedText[];
  links: RecruitmentLinkItem[];
  faqs: RecruitmentFaqItem[];
  sourceCitations: {
    sourceName: string;
    officialDomain: string;
    documentReference: string | null;
    retrievedAt: string;
  }[];
  updateHistory: UpdateHistoryItem[];
}

export interface FilterQuery {
  q?: string;
  state?: string;
  category?: string;
  qualification?: string;
  status?: string;
  employmentType?: string;
}

export interface CategoryInfo {
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  group: "scope" | "sector";
}

export interface StateInfo {
  code: string;
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  isPriority?: boolean;
}

export interface QualificationInfo {
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
}

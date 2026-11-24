import { z } from "zod";
import { SUPPORTED_LANGUAGES } from "@/lib/types/recruitment";

export const LanguageParamSchema = z.enum(SUPPORTED_LANGUAGES).default("en");

export const PublicRecruitmentsQuerySchema = z.object({
  lang: LanguageParamSchema,
  q: z.string().trim().max(120).optional(),
  state: z.string().trim().max(64).optional(),
  category: z.string().trim().max(64).optional(),
  qualification: z.string().trim().max(64).optional(),
  status: z
    .enum([
      "all",
      "upcoming",
      "application_open",
      "closing_soon",
      "application_closed",
      "admit_card_released",
      "exam_scheduled",
      "answer_key_released",
      "result_declared",
      "completed",
    ])
    .optional(),
  employmentType: z
    .enum(["all", "permanent", "contractual", "apprenticeship", "fellowship"])
    .optional(),
  cursor: z.string().trim().max(64).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const PublicSearchQuerySchema = z.object({
  q: z.string().trim().min(1, "Search query is required").max(120),
  lang: LanguageParamSchema,
  limit: z.coerce.number().int().min(1).max(30).default(15),
});

export const CorrectionReportInputSchema = z.object({
  page_url: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .refine(
      (val) =>
        val.startsWith("/") ||
        val.startsWith("https://") ||
        val.startsWith("http://"),
      "Must be a valid relative path or http(s) URL"
    ),
  recruitment_id: z.string().uuid().optional(),
  issue_type: z.enum([
    "wrong_date",
    "wrong_vacancy",
    "wrong_eligibility",
    "broken_link",
    "translation_error",
    "other",
  ]),
  explanation: z
    .string()
    .trim()
    .min(10, "Please provide at least 10 characters explaining the issue")
    .max(2000),
  reporter_contact: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .max(180)
    .optional()
    .or(z.literal("")),
});

export const CreateBookmarkInputSchema = z
  .object({
    recruitment_id: z.string().uuid().optional(),
    saved_search_query: z.record(z.string(), z.string().max(120)).optional(),
    notify_on_update: z.boolean().default(false),
  })
  .refine(
    (data) => Boolean(data.recruitment_id || data.saved_search_query),
    "Either recruitment_id or saved_search_query is required"
  );

export type ApiErrorCode =
  | "INVALID_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export interface ApiErrorEnvelope {
  error: {
    code: ApiErrorCode;
    message: string;
    correlation_id: string;
    details?: Record<string, string[]>;
  };
}

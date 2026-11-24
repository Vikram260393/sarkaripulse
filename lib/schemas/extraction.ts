import { z } from "zod";

export const EXTRACTION_SCHEMA_VERSION = "extraction-schema-v1.0.0";

export const EvidenceLocatorSchema = z
  .object({
    document_page: z.number().int().positive().nullable().optional(),
    row_context: z.string().trim().max(200).nullable().optional(),
    evidence_excerpt: z.string().trim().min(1).max(600),
  })
  .strict();

export const EvidenceFieldSchema = z
  .object({
    field: z.string().trim().min(1).max(80),
    value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
    status_kind: z
      .enum(["present", "missing", "not_applicable", "not_announced"])
      .default("present"),
    source_url: z.string().url(),
    locator: EvidenceLocatorSchema.nullable(),
    verification_status: z.enum([
      "pending",
      "verified",
      "review_required",
      "rejected",
    ]),
  })
  .strict();

export const ExtractedPostSchema = z
  .object({
    post_name: z.string().trim().min(1).max(200),
    post_code: z.string().trim().max(60).nullable().optional(),
    vacancy_count: z.number().int().nonnegative().nullable(),
    pay_level: z.string().trim().max(120).nullable().optional(),
    qualification_summary: z.string().trim().max(400).nullable().optional(),
  })
  .strict();

export const ExtractedFeeSchema = z
  .object({
    category: z.string().trim().min(1).max(120),
    amount_inr: z.number().nonnegative().nullable(),
  })
  .strict();

export const IsoCalendarDateOrNullSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
  .nullable();

/**
 * Strict extraction payload contract (Blueprint Ch. 10 & Appendix B).
 * Uses `.strict()` so malformed or injected extra keys are immediately rejected.
 */
export const ExtractionOutputSchema = z
  .object({
    schema_version: z.literal(EXTRACTION_SCHEMA_VERSION),
    source_id: z.string().trim().min(1),
    source_url: z.string().url(),
    retrieved_at: z.string().datetime(),
    content_hash: z.string().regex(/^[a-f0-9]{64}$/i, "SHA-256 hex digest required"),
    document_reference: z.string().trim().max(120).nullable(),
    parser_version: z.string().trim().min(1).max(60),
    model_version: z.string().trim().min(1).max(80),
    ai_confidence_priority: z.number().min(0).max(1).nullable().optional(),
    is_corrigendum: z.boolean().default(false),
    supersedes_reference: z.string().trim().max(120).nullable().optional(),
    facts: z
      .object({
        title: z.string().trim().min(3).max(240),
        organisation: z.string().trim().min(2).max(200),
        department: z.string().trim().max(200).nullable(),
        state_code: z.string().trim().min(2).max(6),
        cycle_label: z.string().trim().min(2).max(30),
        vacancy_total: z.number().int().nonnegative().nullable(),
        posts: z.array(ExtractedPostSchema).default([]),
        qualifications: z.array(z.string().trim().min(1).max(120)).default([]),
        min_age: z.number().int().nonnegative().nullable(),
        max_age: z.number().int().nonnegative().nullable(),
        age_cut_off_date: IsoCalendarDateOrNullSchema,
        category_relaxation: z.string().trim().max(600).nullable(),
        fees: z.array(ExtractedFeeSchema).default([]),
        pay_summary: z.string().trim().max(240).nullable(),
        application_start: IsoCalendarDateOrNullSchema,
        application_end: IsoCalendarDateOrNullSchema,
        selection_stages: z.array(z.string().trim().min(1).max(200)).default([]),
        official_notification_url: z.string().url().nullable(),
        official_apply_url: z.string().url().nullable(),
      })
      .strict(),
    evidence: z.array(EvidenceFieldSchema).min(1),
  })
  .strict();

export type ExtractionOutput = z.infer<typeof ExtractionOutputSchema>;
export type EvidenceField = z.infer<typeof EvidenceFieldSchema>;

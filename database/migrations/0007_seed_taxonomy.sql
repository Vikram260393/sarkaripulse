-- =============================================================================
-- Migration 0007: Idempotent Taxonomy Seed & Safe System Controls Default
-- SarkariPulse (Blueprint Ch. 02, 06, Appendix E)
-- Note: Sources are NOT seeded as active/verified here (Phase 4 onboarding gate).
-- =============================================================================

INSERT INTO public.states (code, slug, name_en, name_hi, name_mr, is_priority, is_active)
VALUES
  ('MH', 'maharashtra', 'Maharashtra', 'महाराष्ट्र', 'महाराष्ट्र', true, true),
  ('IN', 'all-india', 'All India (Central)', 'अखिल भारतीय (केंद्र)', 'अखिल भारतीय (केंद्र)', false, true),
  ('DL', 'delhi', 'Delhi', 'दिल्ली', 'दिल्ली', false, true),
  ('UP', 'uttar-pradesh', 'Uttar Pradesh', 'उत्तर प्रदेश', 'उत्तर प्रदेश', false, true),
  ('GJ', 'gujarat', 'Gujarat', 'गुजरात', 'गुजरात', false, true),
  ('KA', 'karnataka', 'Karnataka', 'कर्नाटक', 'कर्नाटक', false, true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.categories (slug, group_kind, name_en, name_hi, name_mr, display_order, is_active)
VALUES
  ('central-government', 'scope', 'Central Government', 'केंद्र सरकार', 'केंद्र सरकार', 1, true),
  ('state-jobs', 'scope', 'State Jobs', 'राज्य नौकरियां', 'राज्य नोकऱ्या', 2, true),
  ('railway', 'sector', 'Railway', 'रेलवे', 'रेल्वे', 3, true),
  ('banking', 'sector', 'Banking', 'बैंकिंग', 'बँकिंग', 4, true),
  ('defence', 'sector', 'Defence', 'रक्षा', 'संरक्षण', 5, true),
  ('police', 'sector', 'Police', 'पुलिस', 'पोलीस', 6, true),
  ('psu', 'sector', 'PSU', 'पीएसयू', 'पीएसयू', 7, true),
  ('teaching', 'sector', 'Teaching', 'शिक्षण', 'शिक्षण', 8, true),
  ('engineering', 'sector', 'Engineering', 'इंजीनियरिंग', 'अभियांत्रिकी', 9, true)
ON CONFLICT (slug) DO NOTHING;

-- Safe production default: unattended publishing PAUSED until Release Gates pass
INSERT INTO public.system_controls (
  id,
  pause_source_fetching,
  pause_ai_generation,
  pause_translation,
  pause_pdf_creation,
  pause_publishing,
  updated_reason
)
VALUES (
  1,
  false,
  false,
  false,
  false,
  true,
  'Initial safe default: unattended publishing disabled until Appendix E Release Gates and pilot audit pass.'
)
ON CONFLICT (id) DO NOTHING;

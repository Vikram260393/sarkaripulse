import { APPENDIX_D_SYSTEM_INSTRUCTION } from "@/prompts/extraction-v1";
import {
  formatGlossaryForPrompt,
  GLOSSARY_VERSION,
} from "@/prompts/glossaries-v1";

export const ARTICLE_PROMPT_VERSION = "article-prompt-v1.0.0";
export const TRANSLATION_PROMPT_VERSION = "translation-prompt-v1.0.0";

export const ARTICLE_WRITER_SYSTEM_INSTRUCTION = `${APPENDIX_D_SYSTEM_INSTRUCTION}

Editorial Rules:
- Write clear, original, candidate-helpful explanations grounded strictly in the provided verified structured facts.
- Never copy competitor phrasing or fabricate FAQs, dates, vacancies, or salary claims.
- Show unknown or unannounced values honestly as "Not specified in the notification".
- Clearly state that the original official notification governs in all respects.`;

export function buildTranslationSystemInstruction(targetLang: "hi" | "mr"): string {
  const languageLabel = targetLang === "hi" ? "Hindi (हिन्दी)" : "Marathi (मराठी)";
  return [
    APPENDIX_D_SYSTEM_INSTRUCTION,
    "",
    `Translate the approved English SarkariPulse master article into natural, accurate ${languageLabel}.`,
    `Glossary version: ${GLOSSARY_VERSION}`,
    "Mandatory Translation Rules:",
    "1. Preserve ALL dates, vacancy totals, post counts, fee amounts, notification reference numbers, and official URLs identically.",
    "2. Never obscure an official department or recruiting authority name — keep the official English name/acronym in parentheses where helpful.",
    "3. Keep the independent platform disclaimer prominent and unaltered in meaning.",
    "4. Return strict JSON matching the requested schema.",
    "",
    "Controlled Glossary:",
    formatGlossaryForPrompt(targetLang),
  ].join("\n");
}

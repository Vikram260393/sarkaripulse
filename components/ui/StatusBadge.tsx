import {
  AlertTriangle,
  Archive,
  Award,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileCheck2,
  KeyRound,
  Lock,
  Sparkles,
} from "lucide-react";
import {
  LanguageCode,
  RecruitmentLifecycleStatus,
} from "@/lib/types/recruitment";
import { getDictionary } from "@/lib/i18n/dictionaries";

interface StatusBadgeProps {
  status: RecruitmentLifecycleStatus;
  lang: LanguageCode;
}

/**
 * Accessible status badge that NEVER conveys status through colour alone
 * (Blueprint Ch. 26: pairs semantic icon + explicit localized text label).
 */
export function StatusBadge({ status, lang }: StatusBadgeProps) {
  const dict = getDictionary(lang);
  const label = dict.statusLabels[status];

  const styleMap: Record<
    RecruitmentLifecycleStatus,
    { classes: string; icon: React.ReactNode }
  > = {
    application_open: {
      classes: "bg-emerald-50 text-emerald-900 border-emerald-300",
      icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
    closing_soon: {
      classes: "bg-amber-100 text-amber-950 border-amber-400",
      icon: <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
    application_closed: {
      classes: "bg-slate-200 text-slate-800 border-slate-300",
      icon: <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
    upcoming: {
      classes: "bg-sky-50 text-sky-900 border-sky-300",
      icon: <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
    admit_card_released: {
      classes: "bg-blue-50 text-blue-900 border-blue-300",
      icon: <FileCheck2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
    exam_scheduled: {
      classes: "bg-indigo-50 text-indigo-900 border-indigo-300",
      icon: <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
    answer_key_released: {
      classes: "bg-violet-50 text-violet-900 border-violet-300",
      icon: <KeyRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
    result_declared: {
      classes: "bg-teal-50 text-teal-900 border-teal-300",
      icon: <Award className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
    completed: {
      classes: "bg-slate-100 text-slate-800 border-slate-300",
      icon: <Archive className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
    correction_required: {
      classes: "bg-rose-50 text-rose-900 border-rose-300",
      icon: <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
    archived: {
      classes: "bg-slate-100 text-slate-700 border-slate-300",
      icon: <Archive className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />,
    },
  };

  const style = styleMap[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style.classes}`}
    >
      {style.icon}
      <span>{label}</span>
    </span>
  );
}

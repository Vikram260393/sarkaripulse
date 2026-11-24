import { extractDestinationDomain } from "@/lib/utils/formatters";

export type SourceTier =
  | "tier_1_official"
  | "tier_2_official_publication"
  | "tier_3_discovery_only"
  | "competitor_untrusted";

export interface SourceRegistryEntry {
  id: string;
  name: string;
  organisation: string;
  stateCode: string;
  officialDomain: string;
  /** Additional official subdomains or authorised exam/application portals referenced by the authority */
  authorisedApplyDomains: readonly string[];
  recruitmentUrl: string;
  sourceTier: SourceTier;
  sourceType: "api" | "rss" | "sitemap" | "html" | "pdf";
  trustPolicy: "manual_only" | "auto_eligible";
  onboardingStatus: "pending_live_verification" | "approved";
  pdfRedistributionPermitted: boolean;
  scanIntervalMinutes: number;
  parserType: string;
  parserVersion: string;
}

/**
 * Pilot Official Source Registry Backlog (Blueprint Ch. 08 & docs/SOURCE_REGISTRY.md).
 * All entries start conservative (`manual_only`, `pending_live_verification`) until
 * domain ownership, robots.txt/terms review, and live test notice verification complete.
 */
export const PILOT_SOURCE_REGISTRY: readonly SourceRegistryEntry[] = [
  {
    id: "src-mh-mpsc",
    name: "Maharashtra Public Service Commission",
    organisation: "Maharashtra Public Service Commission (MPSC)",
    stateCode: "MH",
    officialDomain: "mpsc.gov.in",
    authorisedApplyDomains: ["mpsc.gov.in", "mpsconline.gov.in"],
    recruitmentUrl: "https://mpsc.gov.in/adv_notification/8",
    sourceTier: "tier_1_official",
    sourceType: "html",
    trustPolicy: "manual_only",
    onboardingStatus: "pending_live_verification",
    pdfRedistributionPermitted: false,
    scanIntervalMinutes: 240,
    parserType: "html_pdf_list",
    parserVersion: "v1.0.0",
  },
  {
    id: "src-mh-police",
    name: "Maharashtra State Police Recruitment",
    organisation: "Maharashtra State Police",
    stateCode: "MH",
    officialDomain: "mahapolice.gov.in",
    authorisedApplyDomains: ["mahapolice.gov.in", "policerecruitment2026.mahait.org"],
    recruitmentUrl: "https://www.mahapolice.gov.in/police-recruitment",
    sourceTier: "tier_1_official",
    sourceType: "html",
    trustPolicy: "manual_only",
    onboardingStatus: "pending_live_verification",
    pdfRedistributionPermitted: false,
    scanIntervalMinutes: 240,
    parserType: "html_pdf_list",
    parserVersion: "v1.0.0",
  },
  {
    id: "src-in-upsc",
    name: "Union Public Service Commission",
    organisation: "Union Public Service Commission (UPSC)",
    stateCode: "IN",
    officialDomain: "upsc.gov.in",
    authorisedApplyDomains: ["upsc.gov.in", "upsconline.nic.in", "upsconline.gov.in"],
    recruitmentUrl: "https://upsc.gov.in/examinations/active-exams",
    sourceTier: "tier_1_official",
    sourceType: "html",
    trustPolicy: "manual_only",
    onboardingStatus: "pending_live_verification",
    pdfRedistributionPermitted: false,
    scanIntervalMinutes: 240,
    parserType: "html_pdf_list",
    parserVersion: "v1.0.0",
  },
  {
    id: "src-in-ssc",
    name: "Staff Selection Commission",
    organisation: "Staff Selection Commission (SSC)",
    stateCode: "IN",
    officialDomain: "ssc.gov.in",
    authorisedApplyDomains: ["ssc.gov.in"],
    recruitmentUrl: "https://ssc.gov.in/home/notice-board",
    sourceTier: "tier_1_official",
    sourceType: "html",
    trustPolicy: "manual_only",
    onboardingStatus: "pending_live_verification",
    pdfRedistributionPermitted: false,
    scanIntervalMinutes: 240,
    parserType: "html_pdf_list",
    parserVersion: "v1.0.0",
  },
  {
    id: "src-in-rrb-mumbai",
    name: "Railway Recruitment Board Mumbai",
    organisation: "Railway Recruitment Boards (RRBs)",
    stateCode: "IN",
    officialDomain: "rrbmumbai.gov.in",
    authorisedApplyDomains: ["rrbmumbai.gov.in", "rrbapply.gov.in"],
    recruitmentUrl: "https://www.rrbmumbai.gov.in/",
    sourceTier: "tier_1_official",
    sourceType: "html",
    trustPolicy: "manual_only",
    onboardingStatus: "pending_live_verification",
    pdfRedistributionPermitted: false,
    scanIntervalMinutes: 360,
    parserType: "html_pdf_list",
    parserVersion: "v1.0.0",
  },
  {
    id: "src-in-ibps",
    name: "Institute of Banking Personnel Selection",
    organisation: "Institute of Banking Personnel Selection (IBPS)",
    stateCode: "IN",
    officialDomain: "ibps.in",
    authorisedApplyDomains: ["ibps.in", "ibpsonline.ibps.in"],
    recruitmentUrl: "https://www.ibps.in/",
    sourceTier: "tier_1_official",
    sourceType: "html",
    trustPolicy: "manual_only",
    onboardingStatus: "pending_live_verification",
    pdfRedistributionPermitted: false,
    scanIntervalMinutes: 360,
    parserType: "html_pdf_list",
    parserVersion: "v1.0.0",
  },
  {
    id: "src-mh-msedcl",
    name: "MSEDCL Mahavitaran Careers",
    organisation: "Maharashtra State Electricity Distribution Co. Ltd. (MSEDCL)",
    stateCode: "MH",
    officialDomain: "mahadiscom.in",
    authorisedApplyDomains: ["mahadiscom.in", "ibpsonline.ibps.in"],
    recruitmentUrl: "https://www.mahadiscom.in/careers/",
    sourceTier: "tier_1_official",
    sourceType: "html",
    trustPolicy: "manual_only",
    onboardingStatus: "pending_live_verification",
    pdfRedistributionPermitted: false,
    scanIntervalMinutes: 360,
    parserType: "html_pdf_list",
    parserVersion: "v1.0.0",
  },
] as const;

export function domainMatchesAllowlist(
  hostname: string,
  allowedDomains: readonly string[]
): boolean {
  const cleanHost = hostname.toLowerCase().replace(/\.$/, "");
  return allowedDomains.some((allowed) => {
    const cleanAllowed = allowed.toLowerCase().replace(/\.$/, "");
    return cleanHost === cleanAllowed || cleanHost.endsWith(`.${cleanAllowed}`);
  });
}

export function isUrlOnOfficialSourceDomain(
  rawUrl: string,
  source: Pick<SourceRegistryEntry, "officialDomain">
): boolean {
  const host = extractDestinationDomain(rawUrl);
  if (!host) return false;
  return domainMatchesAllowlist(host, [source.officialDomain]);
}

export function isUrlOnAuthorisedApplyDomain(
  rawUrl: string,
  source: Pick<SourceRegistryEntry, "officialDomain" | "authorisedApplyDomains">
): boolean {
  const host = extractDestinationDomain(rawUrl);
  if (!host) return false;
  return domainMatchesAllowlist(host, [
    source.officialDomain,
    ...source.authorisedApplyDomains,
  ]);
}

export function getPilotSourceById(id: string): SourceRegistryEntry | undefined {
  return PILOT_SOURCE_REGISTRY.find((s) => s.id === id);
}

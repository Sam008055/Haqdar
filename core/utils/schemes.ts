export const WELFARE_SCHEMES_CONFIG: Record<string, { maxIncomeThreshold: number }> = {
  "PM Awas Yojana": { maxIncomeThreshold: 300000 },
  "PMAY": { maxIncomeThreshold: 300000 },
  "Post-Matric Scholarship": { maxIncomeThreshold: 250000 },
  "PM-KISAN": { maxIncomeThreshold: 1000000 }, // Generous limit for demonstration
};

export function getSchemeIncomeLimit(schemeName: string): number {
  const normalized = schemeName.trim();
  return WELFARE_SCHEMES_CONFIG[normalized]?.maxIncomeThreshold || 300000; // default to 3L
}

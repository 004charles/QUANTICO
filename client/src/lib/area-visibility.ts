export const analyticsAreaIds = ["executive", "sales", "customers", "operations"] as const;
export type AnalyticsAreaId = (typeof analyticsAreaIds)[number];

export function visibleAnalyticsAreas(preferredAreas?: readonly string[]) {
  const selected = preferredAreas?.filter((area): area is AnalyticsAreaId => analyticsAreaIds.includes(area as AnalyticsAreaId)) ?? analyticsAreaIds;
  return selected.length ? Array.from(new Set(selected)) : ["executive"];
}

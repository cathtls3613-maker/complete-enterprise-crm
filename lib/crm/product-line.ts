/** Map an equipment type string onto one of the product lines. */
export function guessProductLine(equipmentType: string | null): string | null {
  if (!equipmentType) return null;
  const t = equipmentType.toLowerCase();
  if (t.includes("seal")) return "Seals";
  if (t.includes("pump")) return "Pumps";
  if (t.includes("heat") || t.includes("hex")) return "Heat Exchangers";
  if (t.includes("valve")) return "Valves";
  if (t.includes("service") || t.includes("overhaul")) return "Service";
  if (t.includes("spare")) return "Spares";
  return null;
}

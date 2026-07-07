/** Norwegian kroner, e.g. 590 → "590 kr". Whole-krone display. */
export function fmtKr(n: number): string {
  return `${Math.round(n).toLocaleString("nb-NO")} kr`;
}

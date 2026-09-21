/** Concaténation de classes, sans dépendance ajoutée (aucune REQ ne la justifie). */
export function cx(...parties: ReadonlyArray<string | false | null | undefined>): string {
  return parties.filter((p): p is string => typeof p === "string" && p.length > 0).join(" ");
}

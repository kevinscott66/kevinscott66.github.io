/** Legacy pages sometimes contain a literal missing-value marker as their title. */
export function wikiTitle(title: unknown, slug: string): string {
  const value = typeof title === "string" ? title.trim() : "";
  return !value || /^(undefined|null)$/i.test(value) ? slug : value;
}

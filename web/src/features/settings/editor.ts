export function hasDraftChanges(draft: unknown, saved: unknown) {
  return draft != null && saved != null && JSON.stringify(draft) !== JSON.stringify(saved);
}

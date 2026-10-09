export function pageWithinTotal(page: number, size: number, total: number, provisional: boolean) {
  return provisional ? page : Math.min(page, Math.max(1, Math.ceil(total / size)));
}

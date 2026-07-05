export function toSlug(name: string | null | undefined): string {
  if (!name) return ''
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function isNumericKey(s: string): boolean {
  return /^\d+$/.test(s)
}

export function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function generateSlug(): string {
  return Math.random().toString(36).slice(2, 10)
}

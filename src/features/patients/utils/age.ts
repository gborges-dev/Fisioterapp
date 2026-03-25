/** `birthDate` no formato YYYY-MM-DD (input date HTML). */
export function calculateAge(
  birthDate: string,
  reference: Date = new Date(),
): number | null {
  const trimmed = birthDate.trim()
  if (!trimmed) return null
  const born = new Date(`${trimmed}T12:00:00`)
  if (Number.isNaN(born.getTime())) return null
  let age = reference.getFullYear() - born.getFullYear()
  const md = reference.getMonth() - born.getMonth()
  if (md < 0 || (md === 0 && reference.getDate() < born.getDate())) {
    age -= 1
  }
  return age
}

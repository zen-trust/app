export function toKebabCase(string: string): string {
  return string
    .split('')
    .map((letter) => (/[A-Z]/.test(letter) ? ` ${letter.toLowerCase()}` : letter))
    .join('')
    .trim()
    .replace(/[_\s]+/g, '-')
}

export function toTitleCase(value: string): string {
  return toKebabCase(value)
    .split('-')
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
    .join(' ')
}

export function toSentenceCase(value: string): string {
  const interim = toKebabCase(value).replace(/-/g, ' ')

  return interim.slice(0, 1).toUpperCase() + interim.slice(1)
}

export function toCamelCase(value: string): string {
  return toKebabCase(value)
    .split('-')
    .map((word, index) =>
      index !== 0 ? word.slice(0, 1).toUpperCase() + word.slice(1).toLowerCase() : word,
    )
    .join('')
}

export function urnToId(urn: string): string {
  return urn.split(':').pop() ?? ''
}

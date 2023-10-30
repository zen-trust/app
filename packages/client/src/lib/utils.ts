export function inferNameFromEmail(email: string): string {
  const mailbox = email.split('@').shift() ?? email

  return (
    mailbox
      .split('+')
      .shift()
      ?.toLowerCase()
      .split(/[._-]/)
      .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
      .join(' ')
      .replace(/\s+/g, ' ') ?? mailbox
  )
}

export function truncate(str: string, maxWords = 20, maxChars = 150) {
  const words = str.trim().split(' ')

  if (words.length <= maxWords && str.length <= maxChars) {
    return str.replace(/(?<w> )(?!.*\1)/, ' ')
  }

  let excerpt = ''

  for (const word of words.slice(0, maxWords)) {
    if (excerpt.length >= maxChars) {
      break
    }

    if (excerpt.length + word.length >= maxChars) {
      break
    }

    excerpt = `${excerpt} ${word}`
  }

  return `${excerpt}…`.replace(/(?<w> )(?!.*\1)/, ' ')
}

export function urnToId(urn: string): string {
  return urn.split(':').pop() ?? ''
}

export function urnToType(urn: string): string {
  return urn.split(':').slice(0, -1).pop() ?? ''
}

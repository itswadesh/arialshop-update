export const toJson = (str: string) => {
  try {
    return JSON.parse(str)
  } catch (err) {
    return str
  }
}

export const sliceByWord = (
  phrase: string,
  length: number,
  skipEllipses?: boolean
): string => {
  if (phrase.length < length) return phrase
  else {
    let trimmed = phrase.slice(0, length)
    trimmed = trimmed.slice(
      0,
      Math.min(trimmed.length, trimmed.lastIndexOf(' '))
    )
    return trimmed.replace('&', '').replace('to', '')
    // return skipEllipses ? trimmed : trimmed + '…'
  }
}

export const titleCase = (str: string) => {
  return (
    str
      // .toLowerCase()
      .split(' ')
      .map(function (word) {
        return word[0] ? word.replace(word[0], word[0].toUpperCase()) : word
      })
      .join(' ')
  )
}

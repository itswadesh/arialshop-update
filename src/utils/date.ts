export const sysdate = (date = new Date()) => {
  let { day, month, year, hour, minute } = new Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  })
    .formatToParts(date)
    .reduce((acc, part) => {
      if (part.type != 'literal') {
        acc[part.type] = part.value
      }
      return acc
    }, Object.create(null))
  return `${day}-${month}-${year} ${hour}:${minute}`
}

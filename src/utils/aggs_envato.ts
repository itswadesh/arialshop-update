export const mustBuilder = ({
  s,
  classification,
  author,
  predicate,
  sales,
  updated_at,
  price_ranges,
  rating,
}: any) => {
  // console.log('zzzzzzzzzzzzzzzzzzzzzzzzzzz', price_ranges, "==", rating, "==", predicate);

  let must: any = [],
    should: any = []
  // if (s) {
  //     // here
  //     must.push({
  //         "match": { "name": s }
  //     })
  // }
  if (classification.length > 0 && predicate != 'classification')
    must.push({
      terms: {
        'classification.keyword': classification.split(','),
      },
    })
  if (author.length > 0 && predicate != 'author')
    must.push({
      terms: {
        'author_username.keyword': author.split(','),
      },
    })
  // if (updated_at.length > 0 && predicate != 'updated_at')
  //     must.push({
  //         "terms": {
  //             "updated_at": updated_at.split(',')
  //         }
  //     })
  sales = parseSalesRange(sales)
  if (sales.length > 0 && predicate != 'sales') {
    let sh = []
    for (let s of sales) {
      sh.push({
        range: {
          number_of_sales: { gte: s.k, lt: s.v },
        },
      })
    }
    must.push({ bool: { should: sh } })
  }
  price_ranges = parsePriceRange(price_ranges)
  if (price_ranges.length > 0 && predicate != 'price_ranges') {
    let sh = []
    for (let s of price_ranges) {
      sh.push({
        range: {
          price_cents: { gte: s.k, lt: s.v },
        },
      })
    }
    must.push({ bool: { should: sh } })
  }
  if (updated_at.length > 0 && predicate != 'updated_at') {
    let sh = []
    for (let s of updated_at.split(',')) {
      sh.push({
        range: {
          updated_at: {
            gte: s + '||/M',
            lte: s + '||/M',
            format: 'MMM-yyyy||yyyy',
          },
        },
      })
    }
    must.push({ bool: { should: sh } })
  }
  rating = parseRatingsRange(rating)
  if (rating.length > 0 && predicate != 'rating') {
    let sh = []
    for (let s of rating) {
      sh.push({
        range: {
          rating: { gte: s.k, lt: s.v },
        },
      })
    }
    must.push({ bool: { should: sh } })
  }
  // console.log('zzzzzzzzzzzzzzzzzzzzzzzzzzz', JSON.stringify(must), "==>", predicate);
  return must
}
export const shouldBuilder = ({
  s,
  rating,
  price_ranges,
  updated_at,
  sales,
  predicate,
}: any) => {
  let arrayOfWords = [],
    searchWords = [],
    should: any = []
  if (s) {
    should = [
      {
        query_string: { query: s },
      },
      {
        multi_match: { query: s, fields: ['name', 'sku', 'brandName'] },
      },
      {
        match_phrase_prefix: { name: s },
      },
    ]
  }
  // if (sales.length > 0 && predicate != 'sales') {
  //     sales = parseSalesRange(sales)
  //     for (let s of sales) {
  //         should.push({
  //             "range": {
  //                 "number_of_sales": { "gte": s.k, "lt": s.v }
  //             }
  //         })
  //     }
  // }
  // if (price_ranges.length > 0 && predicate != 'price_ranges') {
  //     price_ranges = parsePriceRange(price_ranges)
  //     for (let s of price_ranges) {
  //         should.push({
  //             "range": {
  //                 "price_cents": { "gte": s.k, "lt": s.v }
  //             }
  //         })
  //     }
  // }
  // if (updated_at.length > 0 && predicate != 'updated_at')
  //     should.push({
  //         "range": {
  //             "updated_at": {
  //                 "gte": updated_at.split(',') && updated_at.split(',')[0],
  //                 "lt": updated_at.split(',') && updated_at.split(',')[1]
  //             }
  //         }
  //     })
  // if (rating.length > 0 && predicate != 'rating') {
  //     rating = parseRatingsRange(rating)
  //     for (let s of rating) {
  //         should.push({
  //             "range": {
  //                 "rating": { "gte": s.k, "lt": s.v }
  //             }
  //         })
  //     }
  // }

  return should
}
const parsePriceRange = (range: string) => {
  let r = []
  if (range.includes('Upto $20')) {
    r.push({ k: 0, v: 2000 })
  }
  if (range.includes('$20 to $100')) {
    r.push({ k: 2000, v: 10000 })
  }
  if (range.includes('More than $100')) {
    r.push({ k: 10000, v: 100000000 })
  }
  return r
}
const parseSalesRange = (range: string) => {
  let r = []
  if (range.includes('No sales')) {
    r.push({ k: 0, v: 1 })
  }
  if (range.includes('Low')) {
    r.push({ k: 1, v: 100 })
  }
  if (range.includes('Medium')) {
    r.push({ k: 100, v: 500 })
  }
  if (range.includes('High')) {
    r.push({ k: 500, v: 1000 })
  }
  if (range.includes('Top Sellers')) {
    r.push({ k: 1000, v: 1000000 })
  }
  return r
}
const parseRatingsRange = (range: string) => {
  let r = []
  if (range.includes('Upto 1 star')) {
    r.push({ k: 0, v: 1 })
  }
  if (range.includes('1 star and higher')) {
    r.push({ k: 1, v: 2 })
  }
  if (range.includes('2 star and higher')) {
    r.push({ k: 2, v: 3 })
  }
  if (range.includes('3 star and higher')) {
    r.push({ k: 3, v: 4 })
  }
  if (range.includes('4 star and higher')) {
    r.push({ k: 4, v: 6 })
  }
  // r = r.split(',')[1] + "," + r.split(',')[r.split(',').length - 1]
  return r
}

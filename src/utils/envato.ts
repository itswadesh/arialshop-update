import { shouldBuilder, mustBuilder } from './aggs_envato'

export const esQuery = async (q: any = {}) => {
  const settings = { pageSize: 40 }
  console.log('cachec settings', settings)
  q = toJson(q)
  let s: string = q.q,
    page = parseInt(q.page) || 1,
    classification: any = q.classification || [],
    author: any = q.author || [],
    price_ranges: any = q.price_ranges || [],
    updated_at: any = q.updated_at || [],
    sales: any = q.sales || [],
    rating: any = q.rating || [],
    trending: any = q.trending || [],
    colors: any = q.color || [],
    qsort: string = q.sort || '',
    sort: any = {}
  if (qsort) {
    if (qsort == 'name') sort = { 'name.keyword': 'asc' }
    else if (qsort == '-name') sort = { 'name.keyword': 'desc' }
    else if (qsort == 'price_cents') sort = { price_cents: 'asc' }
    else if (qsort == '-price_cents') sort = { price_cents: 'desc' }
    else if (qsort == 'createdAt') sort = { published_at: 'asc' }
    else if (qsort == '-createdAt') sort = { published_at: 'desc' }
  }
  delete q.page
  delete q.classification
  delete q.author
  delete q.rating
  delete q.color
  delete q.qsort
  delete q.sort
  delete q.q
  let must = []
  let should =
    shouldBuilder({
      s,
      rating,
      price_ranges,
      updated_at,
      sales,
      predicate: false,
    }) || []

  let aggSw: any = {},
    ag = [],
    predicates = [
      { name: 'classification', val: 'classification.keyword' },
      { name: 'author', val: 'author_username.keyword' },
    ]
  for (let i of predicates) {
    let must = mustBuilder({
      s,
      classification,
      author,
      rating,
      price_ranges,
      updated_at,
      sales,
      predicate: i.name,
    })
    aggSw[i.name] = {
      filter: { bool: { must: must, should: should } },
      aggs: {
        all: { terms: { size: 100, field: i.val, order: { _key: 'asc' } } },
      },
    }
  }
  must = mustBuilder({
    s,
    classification,
    author,
    rating,
    price_ranges,
    updated_at,
    sales,
    predicate: 'price_ranges',
  })

  aggSw['price_ranges'] = {
    filter: { bool: { must: must } },
    aggs: {
      all: {
        range: {
          field: 'price_cents',
          ranges: [
            { key: 'Upto $20', from: 0, to: 2000 },
            { key: '$20 to $100', from: 2000, to: 10000 },
            { key: 'More than $100', from: 10000 },
          ],
        },
      },
    },
  }
  must = mustBuilder({
    s,
    classification,
    author,
    rating,
    price_ranges,
    updated_at,
    sales,
    predicate: 'rating',
  })
  aggSw['rating'] = {
    filter: { bool: { must: must } },
    aggs: {
      all: {
        range: {
          field: 'rating',
          ranges: [
            { key: 'Upto 1 star', from: 0, to: 1 },
            { key: '1 star and higher', from: 1, to: 2 },
            { key: '2 star and higher', from: 2, to: 3 },
            { key: '3 star and higher', from: 3, to: 4 },
            { key: '4 star and higher', from: 4 },
          ],
        },
      },
    },
  }
  must = mustBuilder({
    s,
    classification,
    author,
    rating,
    price_ranges,
    updated_at,
    sales,
    predicate: 'sales',
  })

  aggSw['sales'] = {
    filter: { bool: { must: must } },
    aggs: {
      all: {
        range: {
          field: 'number_of_sales',
          ranges: [
            { key: 'No sales', from: 0, to: 1 },
            { key: 'Low', from: 1, to: 100 },
            { key: 'Medium', from: 100, to: 500 },
            { key: 'High', from: 500, to: 1000 },
            { key: 'Top Sellers', from: 1000 },
          ],
        },
      },
    },
  }
  must = mustBuilder({
    s,
    classification,
    author,
    rating,
    price_ranges,
    updated_at,
    sales,
    predicate: 'updated_at',
  })

  aggSw['updated_at'] = {
    filter: { bool: { must: must } },
    aggs: {
      all: {
        date_histogram: {
          field: 'updated_at',
          calendar_interval: '1M',
          format: 'MMM-YYYY',
          order: { _key: 'desc' },
        },
      },
    },
  }
  must =
    mustBuilder({
      s,
      classification,
      author,
      rating,
      price_ranges,
      updated_at,
      sales,
      predicate: false,
    }) || []
  return {
    from: (settings.pageSize || 40) * (page - 1),
    size: settings.pageSize || 40,
    query: { bool: { must: must, should: should } },
    sort: sort,
    aggs: {
      all_aggs: {
        global: {},
        aggs: aggSw,
      },
    },
    highlight: {
      pre_tags: ["<b style='background-color: yellow'>"],
      post_tags: ['</b>'],
      fields: {
        name: {},
        brandName: {},
      },
    },
  }
}
const toJson = (str: string) => {
  try {
    return JSON.parse(str)
  } catch (err) {
    return str
  }
}
export const constructQuery = async ({
  q,
  search,
  predicate,
  forAdmin,
}: any) => {
  const settings = { pageSize: 40 }
  let f = [],
    Ids = null,
    where: any = {}
  for (let i in q) {
    if (i == 'page' || i == 'limit' || i == 'skip' || i == 'sort') continue
    Ids = q[i]
    if (Ids && Ids.split(',').length > 0) {
      //  && i != 1
      Ids = Ids.replace(/\/$/, '') // To remove trailing slash
      // if (i == "sort") {
      //   this.fl[i] = Ids; // Required: else the sort radio text removes: when sort value
      // } else {
      //   this.fl[i] = Ids.split(",");
      // }
      if (i == 'author_username' && predicate != 'author_username') {
        f.push({ brandName: { $in: Ids.split(',') } })
      } else if (i == 'classification' && predicate != 'classification') {
        f.push({ 'classification.slug': { $in: Ids.split(',') } })
      } else if (i == 'rating' && predicate != 'rating') {
        f.push({ 'variants.size': { $in: Ids.split(',') } })
      } else if (i == 'price' && predicate != 'price') {
        f.push({
          price_cents: {
            $gte: Ids.split(',')[0],
            $lt: Ids.split(',')[1],
          },
        })
      } else if (i == 'sort') {
        q.sort = Ids
      } else if (i == 'vendor_name') {
        f.push({ vendor_name: Ids })
      } else if (i == 'sku') {
        f.push({ sku: { $regex: '.*' + Ids + '.*', $options: 'i' } })
      } else if (i == 'name') {
        f.push({ name: { $regex: '.*' + Ids + '.*', $options: 'i' } })
      } else if (i == 'vendor_id') {
        f.push({ vendor_id: Ids })
      } else if (
        predicate != 'author_username' &&
        predicate != 'classification' &&
        predicate != 'rating' &&
        predicate != 'price' &&
        predicate != 'vendor_name'
      ) {
        if (i == 'Color') {
          f.push({
            'features.key': i,
            'features.val': { $in: Ids.split(',') },
          })
        }
      }
    }
  }
  if (f.length > 0) {
    where = { $and: f }
  } else {
    where = {}
  }
  let limit = settings.pageSize || 40
  let skip = 0
  if (q.page) {
    limit = settings.pageSize
    skip = (parseInt(q.page) - 1) * (settings.pageSize || 40)
  }
  let sort = q.sort || null //{ score: { $meta: "textScore" } }
  if (!forAdmin) {
    where.active = true
    where.approved = true
    where['variants.stock'] = { $gt: 0 }
  }
  let searchString = where
  if (search != 'null' && !!search)
    searchString = { ...where, $text: { $search: search } }
  return { where: searchString, limit, skip, sort }
}

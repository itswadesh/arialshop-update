import { toJson } from './json'
import { PAGE_SIZE } from './../config'
export const index = async ({ model, args, info, userId }: any) => {
  let page = !args.page && args.page != 0 ? 1 : parseInt(args.page)
  const qlimit = parseInt(args.limit || 0)
  const sort = args.sort || '-_id'
  const search = args.search
  const select = toJson(info)
  const populate = toJson(args.populate)
  delete args.page
  delete args.sort
  delete args.search
  delete args.select
  delete args.populate
  delete args.limit
  let where = args

  for (let k in where) {
    if (
      (where[k] === '' ||
        where[k] == 'null' ||
        where[k] === 'undefined' ||
        where[k] === undefined) &&
      typeof where[k] != 'boolean'
    )
      delete where[k]

    if (where[k] == 'blank') where[k] = null
  }
  // console.log('zzzzzzzzzzzzzzzzzzzzzzzzzzz', where)
  where = toJson(where) || {}
  let role = 'user'
  //   if (req.user) {
  //     role = req.user.role
  //   }
  let skip = 0,
    limit = 0,
    pageSize = PAGE_SIZE
  if (page == 0 && qlimit != 0) {
    // If page param supplied as 0, limit specified (Deactivate paging)
    limit = qlimit
    pageSize = limit
  } else {
    // Normal pagination
    limit = PAGE_SIZE
    skip = (page - 1) * PAGE_SIZE
  }
  if (args.uid) {
    // Find only records that belong to the logged in user
    where.uid = args.uid
  }
  let searchString = where
  if (search != 'null' && !!search)
    searchString = { ...where, $text: { $search: search } }
  try {
    let data: any = await model
      .find(searchString)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .populate(populate)
      .exec()
    let count: any = await model.countDocuments(searchString)
    return { data, count, pageSize, page }
  } catch (e) {
    throw e
  }
}

export const indexSub = async ({ model, args, info }: any) => {
  let page = !args.page && args.page != 0 ? 1 : parseInt(args.page)
  const qlimit = parseInt(args.limit || 0)
  const sort = args.sort || '-_id'
  const search = args.search
  const select = toJson(info)
  const populate = toJson(args.populate)
  delete args.page
  delete args.sort
  delete args.search
  delete args.select
  delete args.populate
  delete args.limit
  let where = args

  for (let k in where) {
    if (
      where[k] == '' ||
      where[k] == 'null' ||
      where[k] == 'undefined' ||
      where[k] == undefined
    )
      delete where[k]
    if (where[k] == 'blank') where[k] = null
  }
  where = toJson(where) || {}
  let role = 'user'

  //   if (req.user) {
  //     role = req.user.role
  //   }
  let skip = 0,
    limit = 0,
    pageSize = PAGE_SIZE
  if (page == 0 && qlimit != 0) {
    // If page param supplied as 0, limit specified (Deactivate paging)
    limit = qlimit
    pageSize = limit
  } else {
    // Normal pagination
    limit = PAGE_SIZE
    skip = (page - 1) * PAGE_SIZE
  }
  if (args.uid) {
    // Find only records that belong to the logged in user
    where.uid = args.uid
  }
  let searchString = where
  if (search != 'null' && !!search)
    searchString = { ...where, q: { $regex: new RegExp(search, 'ig') } }
  let data: any = await model.aggregate([
    { $match: searchString },
    { $unwind: '$items' },
    { $match: args },
    // { $project: { orderNo: 1, createdAt: 1, updatedAt:1, items: 1, address: 1, s: { $sum: "$items.price" } } },
    {
      $group: {
        _id: {
          id: '$_id',
          orderNo: '$orderNo',
          createdAt: '$createdAt',
          updatedAt: '$updatedAt',
          reviewed: '$reviewed',
          address: '$address',
          payment: '$payment',
          amount: '$amount',
          vendor: '$items.vendor',
          user: '$user',
        },
        items: { $addToSet: '$items' },
        total: { $sum: '$items.price' },
      },
    },
    { $sort: { _id: -1 } },
  ])
  let count: any = await model.countDocuments(searchString)
  return { data, count, pageSize, page }
}

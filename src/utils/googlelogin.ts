import dayjs from 'dayjs'
import { nanoid } from 'nanoid'
import { User } from '../models'
import { logIn, markAsVerified } from '../auth'

export const googleLogIn = async (req: any, data) => {
  if (!data || !data.email) throw new Error('Something went wrong')
  const { email, picture, given_name, family_name } = data
  let user = await User.findOne({ email })
  if (!user) {
    let userData: any = {}
    if (email) userData.email = email
    if (picture) userData.avatar = picture
    if (given_name) userData.firstName = given_name
    if (family_name) userData.lastName = family_name
    // not using now  if(data.email_verified)
    userData.referralCode = nanoid(5)
    user = await User.create(userData)
  } else {
    // @ts-ignore
    user.lastSignIn = new Date()
    await user.save()
  }
  logIn(req, user.id)
  // await merge(req) // Merge guest cart with the logged in user session
  // console.log('zzzzzzzzzzzzzzzzzzzzzzzzzzz', data)
  return user
}

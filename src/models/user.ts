import { Schema, model, Document, Model } from 'mongoose'
import { hash, compare } from 'bcryptjs'
import { createHash, createHmac, timingSafeEqual } from 'crypto'
import {
  BCRYPT_WORK_FACTOR,
  APP_SECRET,
  EMAIL_VERIFICATION_TIMEOUT,
  APP_ORIGIN,
} from '../config'

export interface UserDocument extends Document {
  id: string
  name: string
  username: string
  profileUrl: string
  email: string
  emails: [string]
  gender: string
  role: string
  avatar: string
  photos: [string]
  provider: string
  password: string
  github: object

  verifiedAt: Date
  matchesPassword: (password: string) => Promise<boolean>
  verificationUrl: () => string

  // displayName: string
  // node_id: string
  // avatar_url: string
  // gravatar_id: string
  // url: string
  // html_url: string
  // followers_url: string
  // organizations_url: string
  // repos_url: string
  // subscriptions_url: string
  // received_events_url: string
  // type: string
  // site_admin: string
  // company: string
  // blog: string
  // location: string
  // hireable: string
  // bio: string
  // twitter_username: string
  // public_repos: string
  // public_gists: string
  // followers: string
  // following: string
  // created_at: string
  // updated_at: string
}

interface UserModel extends Model<UserDocument> {
  signVerificationUrl: (url: string) => string
  hasValidVerificationUrl: (path: string, query: any) => boolean
}

const userSchema = new Schema(
  {
    id: String,
    name: String,
    username: String,
    profileUrl: String,
    email: String,
    emails: [Object],
    gender: String,
    role: String,
    avatar: String,
    photos: [{ value: String }],
    provider: String,
    password: String,
    github: Object,
    verifiedAt: Date,
  },
  {
    timestamps: true,
  }
)

userSchema.pre<UserDocument>('save', async function () {
  if (this.isModified('password')) {
    this.password = await hash(this.password, BCRYPT_WORK_FACTOR)
  }
})

userSchema.methods.matchesPassword = function (password: string) {
  return compare(password, this.password)
}

userSchema.methods.verificationUrl = function () {
  const token = createHash('sha1').update(this.email).digest('hex')
  const expires = Date.now() + EMAIL_VERIFICATION_TIMEOUT

  const url = `${APP_ORIGIN}/email/verify?id=${this.id}&token=${token}&expires=${expires}`
  const signature = User.signVerificationUrl(url)

  return `${url}&signature=${signature}`
}

userSchema.statics.signVerificationUrl = (url: string) =>
  createHmac('sha256', APP_SECRET).update(url).digest('hex')

userSchema.statics.hasValidVerificationUrl = (path: string, query: any) => {
  const url = `${APP_ORIGIN}${path}`
  const original = url.slice(0, url.lastIndexOf('&'))
  const signature = User.signVerificationUrl(original)

  return (
    timingSafeEqual(Buffer.from(signature), Buffer.from(query.signature)) &&
    +query.expires > Date.now()
  )
}

userSchema.set('toJSON', {
  transform: (doc, { __v, password, ...rest }, options) => rest,
})

export const User = model<UserDocument, UserModel>('User', userSchema)

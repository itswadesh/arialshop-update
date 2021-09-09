import { User, UserDocument } from './models'
import { SESSION_NAME } from './config'
import { Request, Response } from 'express'
import passport from 'passport'

export const logIn = (req: Request, userId: string) => {
  // @ts-ignore
  req.session!.userId = userId
  // @ts-ignore
  req.session!.createdAt = Date.now()
}

export const attemptSignIn = async (
  { email, password }: { email: string; password: string },
  fields: string
): Promise<UserDocument> => {
  const user = await User.findOne({ email }).select(`${fields} password`)

  if (!user || !(await user.matchesPassword(password))) {
    throw new Error('Incorrect email or password. Please try again.')
  }

  return user
}

export const localLogin = async (
  req: Request,
  { email, password }: { email: string; password: string },
  fields: string
): Promise<any> => {
  return new Promise((resolve, reject) => {
    return passport.authenticate('local', (err, user) => {
      if (err) reject(err)

      req.login(user, (err) => {
        if (err) reject(err)
        resolve(user)
      })
    })({ body: { email, password } })
  })
}

// @ts-ignore
export const isLoggedIn = (req: Request): boolean => !!req.session!.userId

export const ensureSignedIn = (req: Request): void => {
  if (!isLoggedIn(req)) {
    throw new Error('You must be signed in.')
  }
}

export const ensureSignedOut = (req: Request): void => {
  if (isLoggedIn(req)) {
    throw new Error('You are already signed in.')
  }
}

export const logOut = (req: Request, res: Response): Promise<boolean> =>
  new Promise((resolve, reject) => {
    // @ts-ignore
    req.session!.userId = null
    resolve(true)
    // req.session!.destroy((err: Error) => {
    //   if (err) reject(err)

    //   res.clearCookie(SESSION_NAME)

    //   resolve()
    // })
  })

export const markAsVerified = async (user: UserDocument) => {
  user.verifiedAt = new Date()
  await user.save()
}

export const resetPassword = async (user: UserDocument, password: string) => {
  user.password = password
  await user.save()
}

passport.serializeUser((user, done) => {
  // @ts-ignore
  done(null, user._id)
})

passport.deserializeUser((id, done) => {
  // @ts-ignore
  User.findById(_id, (err: Error, user: UserDocument) => done(err, user)) // gets called on each req :-/
})

export default passport

import { Strategy as FacebookStrategy } from 'passport-facebook'
import { UserDocument } from '../../types'

import passport from 'passport'
import express from 'express'
import {
  ADMIN_PANEL_LINK,
  FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET,
} from '../../config'
const facebookAdminRouter = express.Router()
facebookAdminRouter.get(
  '/',
  passport.authenticate('facebook', { scope: ['email'] })
)
facebookAdminRouter.get(
  '/callback',
  passport.authenticate('facebook', {
    successRedirect: '/auth/facebook/success',
    failureRedirect: '/auth/facebook/success?failed=true',
  })
)
facebookAdminRouter.get('/success', (req: any, res) => {
  if (req.session && req.user && req.user.id) {
    req.session.userId = req.user && req.user.id
    return res.redirect(ADMIN_PANEL_LINK + '/')
  } else if (req.query.failed)
    return res.redirect(ADMIN_PANEL_LINK + '/login?failed=true')
  else return res.redirect(ADMIN_PANEL_LINK + '/login')
})

export async function setupFacebookAdmin(User: any) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: FACEBOOK_APP_ID,
        clientSecret: FACEBOOK_APP_SECRET,
        callbackURL: ADMIN_PANEL_LINK + '/auth/facebook/callback', // This must be website address, not API address
        profileFields: ['name', 'displayName', 'emails', 'gender', 'photos'],
      },
      async (accessToken: string, refreshToken: string, profile: any, cb) => {
        try {
          const currentUser: UserDocument | null = await User.findOne({
            email: profile && profile.emails[0] && profile.emails[0].value,
          })
          if (currentUser) {
            // console.log('already have this user: ', currentUser.email)
            cb(null, currentUser)
          } else {
            const newUser = new User({
              firstName: profile.name.givenName,
              lastName: profile.name.familyName,
              email: profile.emails[0].value,
              gender: profile._json.gender,
              role: 'user',
              username: profile.displayName,
              avatar: profile.photos[0].value,
              provider: 'facebook',
              facebook: profile._json,
            })
            // console.log('created new user: ', newUser)
            const savedUser: UserDocument = await newUser.save()
            cb(null, savedUser)
          }
        } catch (err) {
          // console.log('error at find user ', err)
          cb(err)
        }
      }
    )
  )
}
export { facebookAdminRouter }

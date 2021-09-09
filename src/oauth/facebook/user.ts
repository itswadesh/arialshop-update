import { Strategy as FacebookStrategy } from 'passport-facebook'
import { UserDocument } from '../../types'

import passport from 'passport'
import express from 'express'
import { WWW_URL, FACEBOOK_APP_ID, FACEBOOK_APP_SECRET } from '../../config'
const facebookRouter = express.Router()
facebookRouter.get('/', passport.authenticate('facebook', { scope: ['email'] }))
facebookRouter.get(
  '/callback',
  passport.authenticate('facebook', {
    successRedirect: '/auth/facebook/success',
    failureRedirect: '/auth/facebook/success?failed=true',
  })
)
facebookRouter.get('/success', (req: any, res) => {
  if (req.session && req.user && req.user.id) {
    req.session.userId = req.user && req.user.id
    return res.redirect(WWW_URL + '/')
  } else if (req.query.failed)
    return res.redirect(WWW_URL + '/login?failed=true')
  else return res.redirect(WWW_URL + '/login')
})

export async function setupFacebook(User: any) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: FACEBOOK_APP_ID,
        clientSecret: FACEBOOK_APP_SECRET,
        callbackURL: WWW_URL + '/auth/facebook/callback', // This must be website address, not API address
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
export { facebookRouter }

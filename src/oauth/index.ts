import { facebookRouter, setupFacebook } from './facebook'
import { googleRouter, setupGoogle } from './google'
import { githubRouter, setupGithub } from './github'
import { Router } from 'express'
import { User } from '../models'
setupFacebook(User)
setupGoogle(User)
setupGithub(User)

export default function (app: Router) {
  app.use('/auth/facebook', facebookRouter)
  app.use('/auth/google', googleRouter)
  app.use('/auth/github', githubRouter)
}

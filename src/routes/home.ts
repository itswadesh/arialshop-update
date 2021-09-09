import { Router } from 'express'
import { auth, catchAsync } from '../middleware'
import { User } from '../models'

const router = Router()

router.get(
  '/api/home',
  auth,
  catchAsync(async (req, res) => {
    // @ts-ignore
    const user = await User.findById(req.session!.userId)
    res.json(user)
  })
)

export { router as home }

import { Router } from 'express'
import { auth, catchAsync } from '../middleware'
import { User } from '../models'

const router = Router()

router.get(
  '/api/user/me',
  auth,
  catchAsync(async (req, res) => {
    try {
      // @ts-ignore
      const userId = req.session && req.session.userId
      let item: any = await User.findById(userId)
      return res.status(200).json(item)
    } catch (e) {
      return res.status(500).json(e)
    }
  })
)

export { router as user }

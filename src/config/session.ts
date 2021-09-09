import { SessionOptions } from 'express-session'
import { IN_PROD } from './app'

const ONE_HOUR = 1000 * 60 * 60

const THIRTY_MINUTES = ONE_HOUR / 2

const SIX_HOURS = ONE_HOUR * 6

const ONE_YEAR = ONE_HOUR * 24 * 365

const { env } = process

export const {
  SESSION_SECRET = 'please keep this secret, mate',
  SESSION_NAME = 'sid',
  SESSION_IDLE_TIMEOUT = ONE_YEAR,
} = env

export const SESSION_ABSOLUTE_TIMEOUT = +(
  env.SESSION_ABSOLUTE_TIMEOUT || ONE_YEAR
)

export const SESSION_OPTIONS: SessionOptions = {
  secret: SESSION_SECRET,
  name: SESSION_NAME,
  cookie: {
    maxAge: +SESSION_IDLE_TIMEOUT,
    secure: false,
    sameSite: true,
  },
  rolling: true,
  resave: false,
  saveUninitialized: false,
}

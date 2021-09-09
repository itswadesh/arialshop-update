const Sentry = require('@sentry/node')
const { SENTRY_DSN } = process.env

export default Sentry.init({ dsn: SENTRY_DSN })

import doubt from '@hydre/doubt'
import reporter from 'tap-spec-emoji'
import { pipeline } from 'stream'

const { default: Koa } = await import('./koa.test.js')

pipeline(
    await doubt(Koa),
    reporter(),
    process.stdout,
    error => {
      if (error) console.error(error)
    },
)

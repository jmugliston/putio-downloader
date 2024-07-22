import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import Fastify from 'fastify'
import AutoLoad from '@fastify/autoload'
import { fastifySensible } from '@fastify/sensible'
import { fastifyFormbody } from '@fastify/formbody'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// A test version of the app
function build() {
  const app = Fastify()

  app.register(fastifySensible, {
    errorHandler: false,
  })
  app.register(fastifyFormbody)

  // Load all the routes
  app.register(async (fastify, opts) => {
    fastify.register(AutoLoad, {
      dir: join(__dirname, '../src/routes'),
      options: Object.assign({}, opts),
    })
  }, {})

  return app
}

export { build }

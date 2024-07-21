const path = require('path')
const Fastify = require('fastify')
const AutoLoad = require('@fastify/autoload')

// A test version of the app
function build() {
  const app = Fastify()

  app.register(require('@fastify/sensible'), {
    errorHandler: false,
  })
  app.register(require('fastify-healthcheck'))
  app.register(require('@fastify/formbody'))

  // Load all the routes
  app.register(async (fastify, opts) => {
    fastify.register(AutoLoad, {
      dir: path.join(__dirname, '../src/routes'),
      options: Object.assign({}, opts),
    })
  }, {})

  return app
}

module.exports = {
  build,
}

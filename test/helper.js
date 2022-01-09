"use strict";

// This file contains code that we reuse
// between our tests.

const Fastify = require("fastify");
const fp = require("fastify-plugin");
const App = require("../src/app");

// Fill in this config with all the configurations
// needed for testing the application
function config() {
  return {};
}

// automatically build and tear down our instance
function build(t) {
  const app = Fastify();

  // fastify-plugin ensures that all decorators
  // are exposed for testing purposes, this is
  // different from the production setup
  app.register(fp(App), config());

  // tear down our app after we are done
  t.teardown(() => {
    // This doesn't close the app for some reason!
    app.close.bind(app);
    // Just force exit...
    process.exit(0);
  });

  return app;
}

module.exports = {
  config,
  build,
};

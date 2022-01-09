"use strict";

const { test } = require("tap");
const Fastify = require("fastify");
const putio = require("../../src/plugins/putio");

test("queue works", async (t) => {
  const fastify = Fastify();
  fastify.register(putio);

  await fastify.ready();
  // t.equal(fastify.putio.getFiles(), "");
});

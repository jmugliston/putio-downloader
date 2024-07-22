/**
 * Main application module.
 * @module app
 */

import url from 'url'
import path from 'path'
import fs from 'fs'
import AutoLoad from '@fastify/autoload'
import Env from '@fastify/env'
import { createRequire } from 'module'
import { scheduleJob } from 'node-schedule'
import { fastifySensible } from '@fastify/sensible'
import { fastifyFormbody } from '@fastify/formbody'
import { S } from 'fluent-json-schema'

import putio from './plugins/putio.js'
import processor from './plugins/processor.js'
import queue from './plugins/queue.js'

const PJSON = createRequire(import.meta.url)('../package.json')

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Initializes the Fastify application.
 *
 * @param {object} fastify - The Fastify instance.
 * @param {object} opts - The options object.
 * @returns {Promise<void>}
 */
export default async function (fastify, opts) {
  fastify.log.info(`App version: ${PJSON.version}`)

  // Get environment config
  await fastify.register(Env, {
    schema: S.object()
      .prop('NODE_ENV', S.string().required().default('dev'))
      .prop('ACCESS_TOKEN', S.string().required().default(''))
      .prop('PROCESSING_DIR', S.string().required().default('./download'))
      .prop('DOWNLOAD_DIR', S.string().required().default('./download'))
      .prop('DOWNLOAD_SCHEDULE_ENABLED', S.boolean().default(false))
      .prop('DOWNLOAD_SCHEDULE_CRON', S.string().default('0 6 * * *'))
      .valueOf(),
  })

  fastify.log.info(`📁 Processing dir: ${fastify.config.PROCESSING_DIR}`)
  fastify.log.info(`📁 Download dir: ${fastify.config.DOWNLOAD_DIR}`)

  if (!fs.existsSync(fastify.config.PROCESSING_DIR)) {
    fs.mkdirSync(fastify.config.PROCESSING_DIR, { recursive: true })
  }

  if (!fs.existsSync(fastify.config.DOWNLOAD_DIR)) {
    fs.mkdirSync(fastify.config.DOWNLOAD_DIR, { recursive: true })
  }

  // Register plugins
  fastify.register(fastifySensible, {
    errorHandler: false,
  })
  fastify.register(fastifyFormbody)

  // Register custom plugins (need to be loaded in order)
  await fastify.register(putio, { accessToken: fastify.config.ACCESS_TOKEN })
  await fastify.register(processor, {
    processingDir: fastify.config.PROCESSING_DIR,
    downloadDir: fastify.config.DOWNLOAD_DIR,
  })
  await fastify.register(queue)

  // Disable logging of healthcheck route
  fastify.addHook('onRoute', (opts) => {
    if (opts.path === '/healthcheck') {
      opts.logLevel = 'silent'
    }
  })

  // Define routes
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    options: Object.assign({}, opts),
  })

  if (fastify.config.DOWNLOAD_SCHEDULE_ENABLED) {
    fastify.log.info(
      `🕒 Download schedule enabled: ${fastify.config.DOWNLOAD_SCHEDULE_CRON}`
    )
    scheduleJob(fastify.config.DOWNLOAD_SCHEDULE_CRON, async () => {
      fastify.log.info('Starting download files job')
      const { files } = await fastify.putio.getFiles()
      for (const file of files) {
        fastify.queue(file.id)
      }
    })
  }
}

import { describe, it, mock } from 'node:test'
import { equal, strictEqual, rejects } from 'node:assert'
import fs from 'fs'
import path from 'path'
import stream from 'stream'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

import utils from '../../src/utils/utils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

describe('utils', () => {
  describe('waitForZip', () => {
    it('should resolve with the zip URL when the zip file is ready', async () => {
      const zipId = '12345'

      const checkZipStatus = mock.fn(() => ({
        url: 'https://example.com/zipfile.zip',
      }))

      const result = await utils.waitForZip(zipId, checkZipStatus)

      equal(result, 'https://example.com/zipfile.zip')
      strictEqual(checkZipStatus.mock.calls.length, 1)
      strictEqual(checkZipStatus.mock.calls[0].arguments[0], zipId)
    })

    it('should reject when the zip is not created in time', async () => {
      const zipId = '12345'

      const checkZipStatus = mock.fn(() => ({}))

      await rejects(
        async () => utils.waitForZip(zipId, checkZipStatus, { retries: 0 }),
        /failed to create zip file$/
      )

      strictEqual(checkZipStatus.mock.calls.length, 1)
      strictEqual(checkZipStatus.mock.calls[0].arguments[0], zipId)
    })
  })

  describe('downloadAndUnzip', () => {
    it('should extract the zip file to the specified directory', async () => {
      mock.method(fs, 'mkdirSync', () => {})
      mock.method(fs, 'createWriteStream', () => {
        const echoStream = new stream.Writable()
        echoStream._write = function (chunk, encoding, done) {
          done()
        }
        return echoStream
      })

      const testZipStream = fs.createReadStream(
        path.join(__dirname, '../test.zip')
      )

      const items = await utils.downloadAndUnzip(testZipStream, 'test-dir')

      strictEqual(items.size, 1)
    })
  })
})

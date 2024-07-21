const { describe, it, mock } = require('node:test')
const { equal, strictEqual, rejects } = require('node:assert')

const { waitForZip, downloadAndUnzip } = require('../../src/utils/utils')
const fs = require('fs')
const path = require('path')
var stream = require('stream')

describe('utils', () => {
  describe('waitForZip', () => {
    it('should resolve with the zip URL when the zip file is ready', async () => {
      const zipId = '12345'

      const checkZipStatus = mock.fn(() => ({
        url: 'https://example.com/zipfile.zip',
      }))

      const result = await waitForZip(zipId, checkZipStatus)

      equal(result, 'https://example.com/zipfile.zip')
      strictEqual(checkZipStatus.mock.calls.length, 1)
      strictEqual(checkZipStatus.mock.calls[0].arguments[0], zipId)
    })

    it('should reject when the zip is not created in time', async () => {
      const zipId = '12345'

      const checkZipStatus = mock.fn(() => ({}))

      await rejects(
        async () => waitForZip(zipId, checkZipStatus, { retries: 0 }),
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

      const items = await downloadAndUnzip(testZipStream, 'test-dir')

      strictEqual(items.size, 1)
    })
  })
})

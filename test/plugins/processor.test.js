import { describe, it, mock, before, after } from 'node:test'
import { equal, strictEqual } from 'node:assert'
import fs from 'fs'
import fp from 'fastify-plugin'

import { build } from '../app.js'
import processor from '../../src/plugins/processor.js'
import utils from '../../src/utils/utils.js'

describe('Processor plugin', () => {
  let app

  before(async () => {
    app = build()

    await app.register(processor, {
      processingDir: 'test-processing-dir',
      downloadDir: 'test-download-dir',
    })

    // mock putio plugin
    await app.register(
      fp(async (fastify) => {
        fastify.decorate('putio', {
          getFileInfo: async () => ({ file: { name: 'test-item' } }),
          createZip: async () => ({ zip_id: '12345' }),
          checkZipStatus: async () => ({
            url: 'https://example.com/zipfile.zip',
          }),
          getDownloadStream: async () => {
            return 'test-stream'
          },
          deleteFile: async () => {},
        })
      })
    )
  })

  after(() => {
    app.close()
  })

  it('process files', async () => {
    const mockRenameSync = mock.method(fs, 'renameSync', () => {})
    const mockWaitForZip = mock.method(utils, 'waitForZip', async () => {})
    const mockDownloadAndUnzip = mock.method(
      utils,
      'downloadAndUnzip',
      async () => ['test-file']
    )

    const res = await app.processor('test-item')

    strictEqual(res, true)

    equal(mockWaitForZip.mock.calls.length, 1)
    equal(mockDownloadAndUnzip.mock.calls.length, 1)
    equal(mockRenameSync.mock.calls.length, 1)
  })

  it('process files with error', async () => {
    mock.method(fs, 'renameSync', () => {})
    mock.method(utils, 'waitForZip', async () => Promise.reject('test fail'))
    mock.method(utils, 'downloadAndUnzip', async () => ['test-file'])
    const mockLogError = mock.method(app.log, 'error', () => {})

    await app.processor('test-item')

    equal(mockLogError.mock.calls.length, 1)
    equal(mockLogError.mock.calls[0].arguments[0], 'test fail')
  })

  it('process files with (axios) error', async () => {
    mock.method(fs, 'renameSync', () => {})
    mock.method(utils, 'waitForZip', async () => {})
    mock.method(utils, 'downloadAndUnzip', async () =>
      Promise.reject({ isAxiosError: true, toJSON: () => 'test fail' })
    )
    const mockLogError = mock.method(app.log, 'error', () => {})

    await app.processor('test-item')

    equal(mockLogError.mock.calls.length, 1)
    equal(mockLogError.mock.calls[0].arguments[0], 'test fail')
  })
})

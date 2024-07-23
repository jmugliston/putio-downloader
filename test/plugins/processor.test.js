import { describe, it, mock, beforeEach, afterEach } from 'node:test'
import { equal, strictEqual } from 'node:assert'
import fs from 'fs'
import fp from 'fastify-plugin'

import { build } from '../app.js'
import processor from '../../src/plugins/processor.js'
import utils from '../../src/utils/utils.js'

const registerMockPutioPlugin = async (app, opts) => {
  const getFileInfoMock = mock.fn(async () => ({
    file: { name: 'test-item' },
  }))
  const createZipMock = mock.fn(async () => ({ zip_id: '12345' }))
  const checkZipStatusMock = mock.fn(async () => ({
    url: 'https://example.com/zipfile.zip',
  }))
  const getDownloadStreamMock = mock.fn(async () => 'test-stream')
  const deleteFileMock = mock.fn(async () => {})

  await app.register(
    fp(async (fastify) => {
      fastify.decorate('putio', {
        getFileInfo: getFileInfoMock,
        createZip: createZipMock,
        checkZipStatus: checkZipStatusMock,
        getDownloadStream: getDownloadStreamMock,
        deleteFile: deleteFileMock,
      })
    }),
    opts
  )

  return {
    getFileInfoMock,
    createZipMock,
    checkZipStatusMock,
    getDownloadStreamMock,
    deleteFileMock,
  }
}

describe('Processor plugin', () => {
  let app

  beforeEach(async () => {
    app = build()
  })

  afterEach(() => {
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

    await app.register(processor, {
      processingDir: 'test-processing-dir',
      downloadDir: 'test-download-dir',
    })

    const {
      getFileInfoMock,
      createZipMock,
      getDownloadStreamMock,
      deleteFileMock,
    } = await registerMockPutioPlugin(app)

    const res = await app.processor('test-item')

    strictEqual(res, true)

    equal(mockWaitForZip.mock.calls.length, 1)
    equal(mockDownloadAndUnzip.mock.calls.length, 1)
    equal(mockRenameSync.mock.calls.length, 1)
    equal(getFileInfoMock.mock.calls.length, 1)
    equal(createZipMock.mock.calls.length, 1)
    equal(getDownloadStreamMock.mock.calls.length, 1)

    // Should not delete remote file
    equal(deleteFileMock.mock.calls.length, 0)
  })

  it('process files (delete remote file after download)', async () => {
    const mockRenameSync = mock.method(fs, 'renameSync', () => {})
    const mockWaitForZip = mock.method(utils, 'waitForZip', async () => {})
    const mockDownloadAndUnzip = mock.method(
      utils,
      'downloadAndUnzip',
      async () => ['test-file']
    )

    await app.register(processor, {
      processingDir: 'test-processing-dir',
      downloadDir: 'test-download-dir',
      // Enable delete remote files after download
      deleteRemoteFilesAfterDownload: true,
    })

    const {
      getFileInfoMock,
      createZipMock,
      getDownloadStreamMock,
      deleteFileMock,
    } = await registerMockPutioPlugin(app)

    const res = await app.processor('test-item')

    strictEqual(res, true)

    equal(mockWaitForZip.mock.calls.length, 1)
    equal(mockDownloadAndUnzip.mock.calls.length, 1)
    equal(mockRenameSync.mock.calls.length, 1)
    equal(getFileInfoMock.mock.calls.length, 1)
    equal(createZipMock.mock.calls.length, 1)
    equal(getDownloadStreamMock.mock.calls.length, 1)

    // Should delete remote file
    equal(deleteFileMock.mock.calls.length, 1)
    equal(deleteFileMock.mock.calls[0].arguments[0], 'test-item')
  })

  it('process files with error', async () => {
    mock.method(fs, 'renameSync', () => {})
    mock.method(utils, 'waitForZip', async () => Promise.reject('test fail'))
    mock.method(utils, 'downloadAndUnzip', async () => ['test-file'])
    const mockLogError = mock.method(app.log, 'error', () => {})

    await app.register(processor, {
      processingDir: 'test-processing-dir',
      downloadDir: 'test-download-dir',
    })

    await registerMockPutioPlugin(app)

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

    await app.register(processor, {
      processingDir: 'test-processing-dir',
      downloadDir: 'test-download-dir',
    })

    await registerMockPutioPlugin(app)

    await app.processor('test-item')

    equal(mockLogError.mock.calls.length, 1)
    equal(mockLogError.mock.calls[0].arguments[0], 'test fail')
  })
})

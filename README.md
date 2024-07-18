# Putio Downloader

An API that can receive callbacks from [Put.io](https://put.io) and download files to a local directory.

This project was created using the [fastify-cli](https://github.com/fastify/fastify-cli).

## Install

```
npm install
```

## Getting Started

Create a .env file in the root of the project like the following:

```sh
# Put.io access token
ACCESS_TOKEN=XXXXXXXX
# Location for downloaded files
DOWNLOAD_DIR=./download
# Processing directory for in-progress downloads
PROCESSING_DIR=./tmp
```

### Download Schedule

You can enable a download schedule with a cron e.g.

```sh
DOWNLOAD_SCHEDULE_ENABLED=true
# Download files at 7am every day...
DOWNLOAD_SCHEDULE_CRON=0 7 * * *
```

## Callbacks

This API is designed to process callbacks from put.io.

Go to https://app.put.io/settings/callback-url and add the URL where you want to receive callbacks.

## Development

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Test

```sh
npm test
```

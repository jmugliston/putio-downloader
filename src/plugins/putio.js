const fp = require("fastify-plugin");
const axios = require("axios");
const qs = require("querystring");

async function putio(fastify, opts) {
  axios.defaults.baseURL = "https://api.put.io/v2";
  axios.defaults.headers.common["Authorization"] = `Bearer ${opts.accessToken}`;
  axios.interceptors.response.use((res) => res.data);

  async function getFiles() {
    return axios.get("/files/list");
  }

  async function createZip(fileId) {
    return axios.post("/zips/create", qs.stringify({ file_ids: fileId }), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  }

  async function checkZipStatus(zipId) {
    return axios.get(`/zips/${zipId}`);
  }

  async function getDownloadStream(url) {
    return axios({
      url,
      method: "GET",
      responseType: "stream",
    });
  }

  async function deleteFile(fileId) {
    return axios.post("/files/delete", qs.stringify({ file_ids: fileId }), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  }

  fastify.decorate("putio", {
    getFiles,
    createZip,
    checkZipStatus,
    getDownloadStream,
    deleteFile,
  });
}

module.exports = fp(putio);

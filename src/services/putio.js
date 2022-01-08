const fp = require("fastify-plugin");
const axios = require("axios");
const qs = require("querystring");

module.exports = fp(async function (fastify, opts) {
  const apiRoot = "https://api.put.io/v2";

  const accessToken = fastify.config.ACCESS_TOKEN;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  axios.interceptors.response.use((res) => res.data);

  const getFiles = async () =>
    axios.get(`${apiRoot}/files/list`, {
      headers,
    });

  const createZip = async (fileId) =>
    axios.post(`${apiRoot}/zips/create`, qs.stringify({ file_ids: fileId }), {
      headers: {
        ...headers,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

  const checkZipStatus = async (zipId) =>
    axios.get(`${apiRoot}/zips/${zipId}`, {
      headers,
    });

  const getDownloadStream = async (url) =>
    axios({
      url,
      method: "GET",
      responseType: "stream",
    });

  const deleteFile = (fileId) =>
    axios.post(`${apiRoot}/files/delete`, qs.stringify({ file_ids: fileId }), {
      headers: {
        ...headers,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

  fastify.decorate("putio", {
    getFiles,
    createZip,
    checkZipStatus,
    getDownloadStream,
    deleteFile,
  });
});

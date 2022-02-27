// Purpose
// Scan through blockchain data and generate local index files so the data is easier to browse
// This will create a site-db.json file which lists all the various sites and their size.
// Each site gets it's own  json file with a list of it's files, created, and cid

// This is used as an example on how to build indexes based off blockchain indexes.
// It's a starting point for you to create your own
require("dotenv").config();

const axios = require("axios");
const fs = require("fs").promises;
const mysql = require("mysql");

const Preserve = require("../preserve/index.js");

const ipfsgateway = "ipfs.infura-ipfs.io";

const mysql_user = process.env.MYSQL_USER;
const mysql_password = process.env.MYSQL_PASSWORD;
const mysql_database = "preserve";
const mysql_table = "snapshots";

const connection = mysql.createConnection({
  host: "localhost",
  user: mysql_user,
  password: mysql_password,
  database: mysql_database,
});

connection.connect();

const cidToUrl = async (cid, filename = "metadata.json") => {
  const url = `https://${cid}.${ipfsgateway}/${filename}`;
  const response = await axios.get(url);
  return response.data;
};

/**
 * We want just the TLD, no protocol, www subdomain, filename, etc.
 * TODO: This isn't great but it works for my situation
 * */
const normazlieFilename = (filename) => {
  var normFilename = filename
    .replace(".jpg", "")
    .replace(".png", "")
    .toLowerCase();
  normFilename = normFilename.replace("http://", "").replace("https://", "");
  normFilename = normFilename.replace("www.", "");
  return normFilename;
};

const getLastIndex = () => {
  return new Promise((resolve, reject) => {
    connection.query(
      `select max(\`index\`) as last from ${mysql_database}.${mysql_table}`,
      [],
      function (error, results, fields) {
        if (error) {
          return reject(error);
        }
        return resolve(results[0].last);
      }
    );
  });
};

(async () => {
  const preserve = new Preserve(
    (network = "mainnet"),
    (contractAddress = "0x7db36be76c97fdb9d15fdfd7331ef29ed8bcb742"),
    (gateway = "infura")
  );

  const siteIndexData = {};
  var indexNum = await preserve.getIndexLength();

  // Pull the last index number from the database so we know how far to go back
  const lastIndexPulled = await getLastIndex();

  console.log(
    `Size: ${indexNum}, Last: ${lastIndexPulled}, New: ${
      indexNum - lastIndexPulled - 1
    }`
  );

  while (indexNum-- > lastIndexPulled) {
    const cid = await preserve.getValueAtIndex(indexNum);
    const metadata = await cidToUrl(cid);

    const created = metadata.created;
    const filenames = metadata.filenames;

    for (const idx in filenames) {
      const filename = filenames[idx];
      const normFilename = normazlieFilename(filename);

      if (!(normFilename in siteIndexData)) {
        siteIndexData[normFilename] = {
          files: [],
        };
      }

      siteIndexData[normFilename].files.push({
        cid,
        filename,
        created,
        indexNum,
      });
    }
  }

  for (const [name, data] of Object.entries(siteIndexData)) {
    for (const i in data.files) {
      const file = data.files[i];
      const cid = file.cid;
      const filename = file.filename;
      const created = file.created / 1000;
      const indexNum = file.indexNum;

      connection.query(
        "INSERT INTO snapshots VALUES(?,?,?,FROM_UNIXTIME(?), ?)",
        [name, filename, cid, created, indexNum],
        function (error, results, fields) {
          if (error & (error != "ER_DUP_ENTRY")) console.log(error, results);
        }
      );
    }
  }
  connection.end();
})().catch((e) => {
  console.log(e);
});

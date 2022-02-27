require("dotenv").config();

const fs = require("fs").promises;
const mysql = require("mysql");

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

const normazlieFilename = (filename) => {
  var normFilename = filename
    .replace(".jpg", "")
    .replace(".png", "")
    .toLowerCase();
  normFilename = normFilename.replace("http://", "").replace("https://", "");
  normFilename = normFilename.replace("www.", "");
  return normFilename;
};

const getSiteList = () => {
  return new Promise((resolve, reject) => {
    connection.query(
      `select url from ${mysql_database}.${mysql_table}`,
      [],
      function (error, results, fields) {
        if (error) {
          return reject(error);
        }
        return resolve(results[0]);
      }
    );
  });
};

(async () => {
  const list = await fs.readFile("./sitelist.txt");

  list
    .toString()
    .split("\r\n")
    .forEach((site) => {
      connection.query(
        "INSERT INTO sitelist VALUES(?,?,?)",
        [normazlieFilename(site), site, 1],
        function (error, results, fields) {
          if (error & (error != "ER_DUP_ENTRY")) console.log(error, results);
        }
      );
    });

  connection.end();
})().catch((e) => {
  console.log(e);
});

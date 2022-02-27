import url from "url";
import fs from "fs";
import Preserve from "../preserve/index.js";
import filenamifyUrl from "filenamify/browser";

import fsextra from "fs-extra";
import puppeteer from "puppeteer";
import minimist from "minimist";
import mysql from "mysql";
import dotenv from "dotenv";
dotenv.config();

const argv = minimist(process.argv.slice(2));

const date = new Date().toUTCString();

const mysql_user = process.env.MYSQL_USER;
const mysql_password = process.env.MYSQL_PASSWORD;
const mysql_database = "preserve";
const mysql_table = "snapshots";

// TODO we should validate this input
const network = argv["network"] || "mumbai";
const dataDir = argv["dataDir"] || "./data";
const indexFiles = argv["indexFiles"] === "true" || false;
const deleteFiles = argv["deleteFiles"] === "true" || false;
const siteCountArg = argv["siteCount"];
const cid = argv["cid"];

async function autoScroll(page) {
  await page.evaluate(async () => {
    var waitTime = 100;
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 100;
      var totalTime = 0;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        totalTime += waitTime;
        if (totalHeight >= scrollHeight || totalTime > 60000) {
          clearInterval(timer);
          resolve();
        }
      }, waitTime);
    });
  });
}

const getSiteList = (connection) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `select url from ${mysql_database}.sitelist`,
      [],
      function (error, results, fields) {
        if (error) {
          return reject(error);
        }
        return resolve(results.map((row) => row.url));
      }
    );
  });
};

(async () => {
  const startTime = new Date();
  const filenames = [];
  const connection = mysql.createConnection({
    host: "localhost",
    user: mysql_user,
    password: mysql_password,
    database: mysql_database,
  });
  connection.connect();

  const siteList = await getSiteList(connection);
  const siteCount = siteCountArg ? parseInt(siteCountArg) : siteList.length;

  console.log(network, dataDir, indexFiles, deleteFiles, siteCount, cid);

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  /* If a cid was passed in we can skip all of this */
  if (!cid) {
    const isWin = process.platform === "win32";
    const args = isWin ? [] : ["--no-sandbox", "--disable-setuid-sandbox"];
    const browser = await puppeteer.launch({
      headless: true,
      args,
    });
    const page = await browser.newPage();

    for (const site in siteList.slice(0, siteCount)) {
      let failed = false;

      const shotStartTime = new Date();

      try {
        const myURL = new URL(siteList[site]).host;
        const filename = `${filenamifyUrl(myURL)}`;
        const fullPath = `${dataDir}/${filename}.jpg`;

        if (fs.existsSync(fullPath)) {
          console.log(`Exists ${filename}`);
          filenames.push(fullPath);
          continue;
        }

        console.log(`Processing ${siteList[site]}, ${filename}`);

        await page.setDefaultNavigationTimeout(120000);
        await page.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36"
        );
        await page.setViewport({
          width: 1440,
          height: 900,
          deviceScaleFactor: 1,
        });
        await page.goto(siteList[site]);
        await autoScroll(page);

        await page.screenshot({
          type: "jpeg",
          quality: 90,
          path: fullPath,
          fullPage: true,
          captureBeyondViewport: false,
        });

        filenames.push(fullPath);
        console.log(
          `   Completed ${siteList[site]} in ${new Date() - shotStartTime} ms`
        );
      } catch (e) {
        console.error(`Failed to process ${siteList[site]} -- ${e}`);
        failed = true;
        continue;
      } finally {
        // if (browser) await browser.close();
      }
    }

    await browser.close();
    console.log("Finished");
  }

  const runTime = new Date() - startTime;

  console.log(`Finished generating screenshots in ${runTime} ms`);

  if (indexFiles) {
    console.log("Preserving to blockhain");

    const preserve = new Preserve(network);
    const hash = await preserve.preserveFiles({
      name: `Website Screenshots ${date}`,
      description: "Website screenshots taken " + date,
      files: filenames,
      attributes: {
        runTime: runTime,
      },
      cid,
    });

    console.log(`Transaction Hash: ${hash}`);
  }

  if (deleteFiles) {
    await fsextra.emptyDir(dataDir);
  }
  process.exit();
})();

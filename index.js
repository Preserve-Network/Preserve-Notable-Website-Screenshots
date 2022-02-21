import url from "url";
import fs from "fs";

import Preserve from "../preserve/index.js";
import filenamifyUrl from "filenamify/browser";

import fsextra from "fs-extra";
import puppeteer from "puppeteer";

const date = new Date().toUTCString();

const indexFiles = false;
const deleteFiles = false;

const network = "mumbai";
const dataDir = "./data";

const siteList = fs
  .readFileSync("sitelist.txt")
  .toString()
  .split("\n")
  .map((site) => site.trim());

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 100);
    });
  });
}

(async () => {
  const startTime = new Date();
  const filenames = [];

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  for (const site in siteList) {
    const myURL = new URL(siteList[site]).host;
    const filename = `${filenamifyUrl(myURL)}`;
    const fullPath = `${dataDir}/${filename}.png`;

    if (fs.existsSync(fullPath)) {
      console.log(`Exists ${filename}`);
      filenames.push(fullPath);
      continue;
    }

    let failed = false;
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    try {
      console.log(`Processing ${siteList[site]}, ${filename}`);

      await page.setDefaultNavigationTimeout(60000);
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      });
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36"
      );

      await page.goto(siteList[site]);
      // await page.waitForTimeout(30000);
      await autoScroll(page);

      await page.screenshot({ path: fullPath, fullPage: true });

      filenames.push(fullPath);
      console.log(
        ` Processed ${siteList[site]} in ${new Date() - startTime} ms`
      );
    } catch (e) {
      console.error(`Failed to process ${siteList[site]} -- ${e}`);
      failed = true;
    } finally {
      await browser.close();
    }
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
    });

    console.log(`Transaction Hash: ${hash}`);
  }

  if (deleteFiles) {
    await fsextra.emptyDir(dataDir);
  }
})();

import url from "url";
import fs from "fs";

import Preserve from "../preserve/index.js";
import filenamifyUrl from "filenamify/browser";
import Pageres from "Pageres";
import fsextra from "fs-extra";

const date = new Date().toUTCString();

// TODO move this to a file
const siteList = [
  "https://cnn.com",
  "https://nytimes.com",
  "https://foxnews.com",
  "https://msnbc.com",
  "https://nytimes.com",
  "https://wsj.com",
  "https://washingtonpost.com",
  "https://huffpost.com",
  "https://latimes.com",
  "https://reuters.com",
  "https://usatoday.com",
  "https://abcnews.go.com",
  "https://bloomberg.com",
  "https://nbcnews.com",
  "https://dailymail.co.uk",
  "https://theguardian.com",
  "https://thesun.co.uk",
  "https://bbc.com",
  "https://forbes.com",
  "https://cnbc.com",
  "https://nypost.com",
  "https://usnews.com",
  "https://time.com",
  "https://cbsnews.com",
  "https://aljazeera.com",
  "https://hollywoodreporter.com",
  "https://bangkokpost.com",
  "https://dailysun.co.za",
  "https://thejakartapost.com",
  "https://theatlantic.com",
  "https://thedailybeast.com",
  "https://sfgate.com",
  "https://thehill.com",
  "https://newsweek.com",
];

const screenShotsizes = ["1570x900"];

(async () => {
  const startTime = new Date();
  const filenames = [];

  for (const site in siteList) {
    const myURL = new URL(siteList[site]).host;
    const filename = `${filenamifyUrl(myURL)}`;
    const fullPath = `data/${filename}.png`;

    if (fs.existsSync(fullPath)) {
      console.log(`Exists ${filename}`);
      filenames.push(fullPath);
      continue;
    }

    const results = await new Pageres({ delay: 10, filename: filename })
      .dest("data")
      .src(siteList[site], screenShotsizes)
      .run();
    const files = results.map((r) => `data/${r.filename}`);
    console.log(`Processed ${files} in ${new Date() - startTime} ms`);

    filenames.push(...files);
  }
  const runTime = new Date() - startTime;
  console.log(`Finished generating screenshots in ${runTime} ms`);

  const preserve = new Preserve();
  const hash = await preserve.preserveFiles({
    name: `Home Screenshots ${date}`,
    description: "Homepage screenshots taken " + date,
    files: filenames,
    attributes: {
      runTime: runTime,
    },
  });

  console.log(`TX ${hash}`);

  await fsextra.emptyDir("data/");
})();

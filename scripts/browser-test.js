import puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setViewport({
    width: 1280,
    height: 1280,
    deviceScaleFactor: 1,
  });
  await page.goto("https://foxnews.com");
  await page.screenshot({ path: "example.png", fullPage: true });

  await browser.close();
})();

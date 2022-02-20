const Pageres = require("pageres");

(async () => {
  await new Pageres({ delay: 2 })
    // .src('https://github.com/sindresorhus/pageres', ['480x320', '1024x768', 'iphone 5s'], {crop: true})
    .src("https://cnn.com", ["1570x900"])
    .src("https://nytimes.com", ["1570x900"])
    .src("https://foxnews.com", ["1570x900"])
    .src("https://msnbc.com", ["1570x900"])
    .dest("data")
    .run();

  console.log("Finished generating screenshots!");
})();

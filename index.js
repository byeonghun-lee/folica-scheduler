const cron = require("node-cron");
// const { instagramScraping } = require("./src/schedule/instagramFollowScraping");
const { sendMail } = require("./src/service/sendMailBlogSearchResult");
const {
    naverBlogKeywordScraping,
} = require("./src/schedule/naverBlogKeywordScraping");
const { getForecast } = require("./src/schedule/getForecast");
const dotenv = require("dotenv").config();

// cron.schedule("0 * * * *", instagramFollowScraping);
cron.schedule(
    "10 9 * * *",
    naverBlogKeywordScraping,
    null,
    false,
    "Asia/Seoul"
);
cron.schedule("0 10 * * *", sendMail, null, false, "Asia/Seoul");
cron.schedule("* * * * *", getForecast, null, false, "Asia/Seoul");

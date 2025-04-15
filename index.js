const cron = require("node-cron");
// const { instagramScraping } = require("./src/schedule/instagramFollowScraping");
const { sendMail } = require("./src/service/sendMailBlogSearchResult");
const {
    naverBlogKeywordScraping,
} = require("./src/schedule/naverBlogKeywordScraping");
const { getForecast } = require("./src/schedule/getForecast");
const { getHourlyForecast } = require("./src/schedule/getHourlyForecast");
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
cron.schedule("15 * * * *", getHourlyForecast, null, false, "Asia/Seoul");

// todo 발표 시간 기준으로 바꿀 필요 있음
// cron.schedule(
//     "15 2,5,8,11,14,17,20,23 * * *",
//     getHourlyForecast,
//     null,
//     false,
//     "Asia/Seoul"
// );

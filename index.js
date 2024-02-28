const cron = require("node-cron");
const { instagramScraping } = require("./src/schedule/instagramFollowScraping");
const dotenv = require("dotenv").config();


cron.schedule("0 * * * *", instagramFollowScraping);

const cron = require("node-cron");
const { instagramScraping } = require("./src/schedule/instagramScraping");
const dotenv = require("dotenv").config();


cron.schedule("0 * * * *", instagramScraping);

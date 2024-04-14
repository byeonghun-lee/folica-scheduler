const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const dayjs = require("dayjs");
require("dayjs/locale/ko");
dayjs.locale("ko");

const DailyKeywordScrapingSchema = new Schema({
    keyword: { type: mongoose.Types.ObjectId, required: true, ref: "Keyword" },
    screenShotUrl: { type: String, required: true },
    textContent: { type: Array },
    createdAt: { type: Date, default: () => dayjs().toDate() },
});

module.exports.DailyKeywordScraping = mongoose.model(
    "DailyKeywordScraping",
    DailyKeywordScrapingSchema
);

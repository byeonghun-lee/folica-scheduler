const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const dayjs = require("dayjs");
require("dayjs/locale/ko");
dayjs.locale("ko");

const DailyKeywordScrapingSchema = new Schema({
    keyword: { type: mongoose.Types.ObjectId, required: true, ref: "Keyword" },
    screenShotUrl: { type: Boolean, required: true },
    textContent: { type: String }, // 스크린샷안에 있는 html을 json으로 구조화? 또는 html 그대로 넣기
    createdAt: { type: Date, default: () => dayjs().toDate() },
});

module.exports.DailyKeywordScraping = mongoose.model(
    "DailyKeywordScraping",
    DailyKeywordScrapingSchema
);

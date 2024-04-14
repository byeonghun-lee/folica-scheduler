const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const dayjs = require("dayjs");
require("dayjs/locale/ko");
dayjs.locale("ko");

const keywordScrapingLogSchema = new Schema({
    keywordRelation: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "KeywordRelation",
    },
    userId: { type: mongoose.Types.ObjectId, required: true, ref: "Auth" },
    action: { type: String, enum: ["create", "addScrapingData"] },
    createdAt: { type: Date, default: () => dayjs().toDate() },
});

module.exports.keywordScrapingLog = mongoose.model(
    "keywordScrapingLog",
    keywordScrapingLogSchema
);

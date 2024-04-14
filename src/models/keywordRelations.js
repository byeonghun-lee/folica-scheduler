const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const dayjs = require("dayjs");
require("dayjs/locale/ko");
dayjs.locale("ko");

const KeywordRelationSchema = new Schema({
    userId: { type: mongoose.Types.ObjectId, required: true, ref: "Auth" },
    keyword: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "Keyword",
    },
    createdAt: { type: Date, default: () => dayjs().toDate() },
    // customScrapingTime: { type: String }, // 개별 스크래핑 시간
    isDeleted: { type: Boolean, default: false },
});

module.exports.KeywordRelation = mongoose.model(
    "KeywordRelation",
    KeywordRelationSchema
);

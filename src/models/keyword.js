const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const dayjs = require("dayjs");
require("dayjs/locale/ko");
dayjs.locale("ko");

const KeywordSchema = new Schema({
    name: { type: String, required: true },
    target: { type: String, required: true, enum: ["naverBlog"] },
    createdAt: { type: Date, default: () => dayjs().toDate() },
});

module.exports.Keyword = mongoose.model("Keyword", KeywordSchema);

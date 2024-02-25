const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const dayjs = require("dayjs");
require("dayjs/locale/ko");
dayjs.locale("ko");

const snsProfileSchema = new Schema({
    snsName: { type: String, required: true },
    path: { type: String, required: true, unique: true },
    name: { type: String },
    desc: { type: String },
    lastUploadedAt: { type: Date },
    createdAt: { type: Date, default: () => dayjs().toDate() },
    updatedAt: { type: Date, default: () => dayjs().toDate() },
    imageUrl: { type: String },
});

module.exports.SnsProfile = mongoose.model("snsProfile", snsProfileSchema);

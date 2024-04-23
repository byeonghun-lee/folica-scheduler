const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const dayjs = require("dayjs");
require("dayjs/locale/ko");
dayjs.locale("ko");

const AuthSchema = new Schema({
    email: { type: String, unique: true },
    phoneNumber: { type: String },
    nickname: { type: String, unique: true },
    hasdedPassword: { type: String },
    service: { type: String },
    createdAt: { type: Date, default: () => dayjs().toDate() },
    expireAt: { type: Date },
});

module.exports.Auth = mongoose.model("Auth", AuthSchema);

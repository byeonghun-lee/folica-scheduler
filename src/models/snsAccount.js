const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const dayjs = require("dayjs");
require("dayjs/locale/ko");
dayjs.locale("ko");

const SnsAccountSchema = new Schema({
    userId: { type: mongoose.Types.ObjectId, required: true, ref: "Auth" },
    instagram: {
        path: {
            type: String,
            required: function () {
                return (
                    ["request", "pending", "complete"].indexOf(
                        this.instagram.status
                    ) >= 0
                );
            },
        },
        status: {
            type: String,
            enum: ["request", "pending", "complete"],
            // default: "request",
        },
    },
    youtube: {
        path: {
            type: String,
            required: function () {
                return (
                    ["request", "pending", "complete"].indexOf(
                        this.youtube.status
                    ) >= 0
                );
            },
        },
        status: {
            type: String,
            enum: ["request", "pending", "complete"],
            // default: "request",
        },
    },
    createdAt: { type: Date, default: () => dayjs().toDate() },
    updatedAt: { type: Date, default: () => dayjs().toDate() },
});

module.exports.SnsAccount = mongoose.model("SnsAccount", SnsAccountSchema);

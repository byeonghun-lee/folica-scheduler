const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const dayjs = require("dayjs");
require("dayjs/locale/ko");
dayjs.locale("ko");

const FollowRelationSchema = new Schema({
    userId: { type: mongoose.Types.ObjectId, required: true, ref: "Auth" },
    snsName: { type: String, enum: ["instagram", "youtube"] },
    followId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "SnsProfile",
    },
    groupIdList: [{ type: mongoose.Types.ObjectId, ref: "Group" }],
    createdAt: { type: Date, default: () => dayjs().toDate() },
    updatedAt: { type: Date, default: () => dayjs().toDate() },
    lastViewedDate: { type: Date, default: () => dayjs().toDate() },
});

module.exports.FollowRelation = mongoose.model(
    "FollowRelation",
    FollowRelationSchema
);

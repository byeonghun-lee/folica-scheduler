const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const weatherUserSchema = new Schema({
    deviceId: { type: String, required: true },
    token: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
});

module.exports.WeatherUser = mongoose.model("WeatherUser", weatherUserSchema);

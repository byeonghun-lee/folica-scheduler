const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const dayjs = require("dayjs");
require("dayjs/locale/ko");
dayjs.locale("ko");

const weatherForecastSchema = new Schema(
    {
        deviceId: { type: String, required: true },
        weatherAlarm: { type: mongoose.Types.ObjectId, ref: "WeatherAlarm" },
        location: {
            type: String,
            required: true,
        },
        forecastDate: {
            type: Date,
            required: true,
        },
        temperature: {
            min: { type: Number }, // 최저 기온 (°C)
            max: { type: Number }, // 최고 기온 (°C)
        },
        weather: {
            am: { type: String },
            pm: { type: String },
        },
        precipitationProbability: {
            am: { type: Number },
            pm: { type: Number },
        },
        source: {
            type: String, // 데이터 출처
            required: true,
        },
    },
    { timestamps: true } // createdAt, updatedAt 자동 생성
);

module.exports.WeatherForecast = mongoose.model(
    "WeatherForecast",
    weatherForecastSchema
);

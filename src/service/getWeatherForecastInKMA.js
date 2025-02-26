const axios = require("axios");
const dayjs = require("dayjs");
require("dayjs/locale/ko");
dayjs.locale("ko");

const KMAForecastUrl =
    "http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst";

const tempMin = "TMN";
const tempMax = "TMX";
const sky = "SKY"; // 하늘 상태
const precipType = "PTY"; // 강수 형태
const precipProb = "POP";
const baseTimes = [
    "0200",
    "0500",
    "0800",
    "1100",
    "1400",
    "1700",
    "2000",
    "2300",
];
const skyValues = {
    1: "sunny",
    3: "cloudy",
    4: "overcast",
};
const precipTypeValues = {
    1: "rain",
    2: "rainOrSnow",
    3: "snow",
    4: "rainShower",
};

const getForecast = async ({ alertDaysBefore, alertTime, nx, ny }) => {
    const result = {};
    const alertBaseTime = baseTimes
        .filter(
            (baseTime) =>
                Number(baseTime) <= Number(dayjs(alertTime).format("HHmm"))
        )
        .pop();
    const alertBaseDate = dayjs()
        .add(alertDaysBefore, "day")
        .format("YYYYMMDD");

    console.log("alertBaseDate:", alertBaseDate);
    console.log("alertTime:", alertTime);
    console.log("alertBaseTime:", alertBaseTime);

    const searchQuery = {
        serviceKey: process.env.KMA_SERVICE_KEY,
        numOfRows: 1000,
        dataType: "JSON",
        base_date: dayjs().format("YYYYMMDD"),
        base_time: baseTimes
            .filter(
                (baseTime) => Number(baseTime) <= Number(dayjs().format("HHmm"))
            )
            .pop(),
        nx,
        ny,
    };

    try {
        const { data } = await axios.get(`${KMAForecastUrl}`, {
            params: searchQuery,
        });

        data.response.body.items.item.forEach((item) => {
            if (item.fcstDate === alertBaseDate) {
                const { fcstTime, category, fcstValue } = item;

                switch (category) {
                    case tempMax:
                        result.tempMax = fcstValue;
                        break;

                    case tempMin:
                        result.tempMin = fcstValue;
                        break;

                    case precipType:
                        if (
                            ["0900", "1800"].includes(fcstTime) &&
                            fcstValue !== "0"
                        ) {
                            result.precipType ??= {};
                            result.precipType[
                                fcstTime === "0900" ? "am" : "pm"
                            ] = precipTypeValues[fcstValue];
                        }
                        break;

                    case sky:
                        if (["0900", "1800"].includes(fcstTime)) {
                            result.sky ??= {};
                            result.sky[fcstTime === "0900" ? "am" : "pm"] =
                                skyValues[fcstValue];
                        }
                        break;

                    case precipProb:
                        if (["0900", "1800"].includes(fcstTime)) {
                            result.precipProb ??= {};
                            result.precipProb[
                                fcstTime === "0900" ? "am" : "pm"
                            ] = fcstValue;
                        }
                        break;
                }
            }
        });

        console.log("weather:", result);
    } catch (error) {
        console.log("Get Forecast in KMA Error:", error);
        throw new Error(error.message);
    }
};

module.exports = {
    getForecast,
};

const axios = require("axios");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

require("dayjs/locale/ko");
dayjs.locale("ko");
dayjs.extend(utc);
dayjs.extend(timezone);

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
                Number(baseTime) <=
                Number(dayjs(alertTime).tz("Asia/Seoul").format("HHmm"))
        )
        .pop();
    const alertBaseDate = dayjs()
        .add(alertDaysBefore, "day")
        .format("YYYYMMDD");

    console.log("alertBaseDate:", alertBaseDate);
    console.log("alertTime:", alertTime);

    const searchQuery = {
        serviceKey: process.env.KMA_SERVICE_KEY,
        numOfRows: 1000,
        dataType: "JSON",
        base_date: dayjs().format("YYYYMMDD"),
        base_time: "0200",
        nx,
        ny,
    };

    try {
        const { data } = await axios.get(`${KMAForecastUrl}`, {
            params: searchQuery,
        });

        const items = data.response.body.items.item;

        const itemsByDate = items.filter(
            (item) => item.fcstDate === alertBaseDate
        );

        const amCandidates = ["0600", "0900", "1200"];
        const pmCandidates = ["1500", "1800", "2100"];

        const getLatestTime = (candidates) =>
            [...candidates]
                .reverse()
                .find((t) => itemsByDate.some((item) => item.fcstTime === t));

        const amTime = getLatestTime(amCandidates);
        const pmTime = getLatestTime(pmCandidates);

        console.log("AM 기준 시간:", amTime, "| PM 기준 시간:", pmTime);

        itemsByDate.forEach((item) => {
            if (item.fcstDate === alertBaseDate) {
                const { fcstTime, category, fcstValue } = item;

                if (category === tempMax) {
                    result.tempMax = fcstValue;
                }
                if (category === tempMin) {
                    result.tempMin = fcstValue;
                }

                const timeKey =
                    fcstTime === amTime
                        ? "am"
                        : fcstTime === pmTime
                        ? "pm"
                        : null;

                if (!timeKey) return;

                switch (category) {
                    case precipType:
                        if (fcstValue !== "0") {
                            result.precipType ??= {};
                            result.precipType[timeKey] =
                                precipTypeValues[fcstValue];
                        }
                        break;

                    case sky:
                        result.sky ??= {};
                        result.sky[timeKey] = skyValues[fcstValue];
                        break;

                    case precipProb:
                        result.precipProb ??= {};
                        result.precipProb[timeKey] = fcstValue;
                        break;
                }
            }
        });

        console.log("weather:", result);
        return result;
    } catch (error) {
        console.log("Get Forecast in KMA Error:", error);
        throw new Error(error.message);
    }
};

module.exports = {
    getForecast,
};

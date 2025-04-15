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

const fetchKMAForecastData = async ({
    nx,
    ny,
    baseDate = dayjs().format("YYYYMMDD"),
    baseTime,
}) => {
    const searchQuery = {
        serviceKey: process.env.KMA_SERVICE_KEY,
        numOfRows: 1000,
        dataType: "JSON",
        base_date: baseDate,
        base_time: baseTime,
        nx,
        ny,
    };

    const { data } = await axios.get(KMAForecastUrl, {
        params: searchQuery,
    });

    return data.response.body.items.item;
};

const getForecast = async ({ alertDaysBefore, alertTime, nx, ny }) => {
    const result = {};
    // const alertBaseTime = baseTimes
    //     .filter(
    //         (baseTime) =>
    //             Number(baseTime) <=
    //             Number(dayjs(alertTime).tz("Asia/Seoul").format("HHmm"))
    //     )
    //     .pop();
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
        const items = await fetchKMAForecastData({ nx, ny, baseTime: "0200" });

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

const getHourlyForecastFromNow = async ({ nx, ny }) => {
    const alertBaseTime = baseTimes
        .filter(
            (baseTime) =>
                Number(baseTime) <=
                Number(dayjs().tz("Asia/Seoul").format("HHmm"))
        )
        .pop();

    console.log("alertBaseTime:", alertBaseTime);

    const items = await fetchKMAForecastData({
        nx,
        ny,
        baseDate:
            !alertBaseTime && dayjs().subtract(1, "day").format("YYYYMMDD"),
        baseTime: alertBaseTime || "2300",
    });

    const now = dayjs().tz("Asia/Seoul").second(0).millisecond(0);
    const hourlyForecastMap = {};

    // 예보 항목 정리
    for (const item of items) {
        const date = item.fcstDate;
        const time = item.fcstTime;
        const dateTime = dayjs
            .tz(`${date} ${time}`, "YYYYMMDD HHmm", "Asia/Seoul")
            .toDate();

        if (!hourlyForecastMap[dateTime]) {
            hourlyForecastMap[dateTime] = {};
        }

        hourlyForecastMap[dateTime][item.category] = item.fcstValue;
    }

    const sortedForecasts = Object.entries(hourlyForecastMap)
        .map(([time, data]) => ({
            time: new Date(time),
            temperature: data.TMP ? Number(data.TMP) : null,
            weather:
                data.PTY === "0"
                    ? data.SKY
                        ? skyValues[data.SKY]
                        : null
                    : precipTypeValues[data.PTY],
            precipitationProbability: data.POP ? Number(data.POP) : null,
        }))
        .sort((a, b) => new Date(a.time) - new Date(b.time));

    // 보간
    const forecast24h = [];
    for (let i = 0; i < 24; i++) {
        const targetTime = now.add(i, "hour");

        // 이전, 다음 예보 찾기
        const before = sortedForecasts
            .slice()
            .reverse()
            .find((f) => dayjs(f.time).isBefore(targetTime));
        const after = sortedForecasts.find((f) =>
            dayjs(f.time).isAfter(targetTime)
        );

        // 보간
        const interpolate = ({ before, after, ratio }) => {
            if (before == null || after == null) return null;
            return Math.round((1 - ratio) * before + ratio * after);
        };

        const interpolateRatio =
            before && after
                ? (targetTime - dayjs(before.time)) /
                  (dayjs(after.time) - dayjs(before.time))
                : 0;

        forecast24h.push({
            time: targetTime.toDate(),
            temperature: interpolate({
                before: before?.temperature,
                after: after?.temperature,
                ratio: interpolateRatio,
            }),
            precipitationProbability: interpolate({
                before: before?.precipitationProbability,
                after: after?.precipitationProbability,
                ratio: interpolateRatio,
            }),
            weather:
                interpolateRatio < 0.5
                    ? before?.weather ?? after?.weather
                    : after?.weather ?? before?.weather,
        });
    }

    // console.log("forecast24h:", forecast24h);
    return forecast24h;
};

module.exports = {
    getForecast,
    getHourlyForecastFromNow,
};

const dayjs = require("dayjs");
require("dayjs/locale/ko");
dayjs.locale("ko");

module.exports.generateWeatherPushMessage = (weatherData) => {
    const { forecastDate, temperature, weather, precipitationProbability } =
        weatherData;

    const weatherMap = {
        sunny: "맑음",
        cloudy: "구름 많음",
        overcast: "흐림",
        rain: "비",
        rainOrSnow: "비 또는 눈",
        snow: "눈",
        rainShower: "소나기",
    };

    const date = new Date(forecastDate);
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const amWeather = weatherMap[weather.am] || "정보 없음";
    const pmWeather = weatherMap[weather.pm] || "정보 없음";

    const minTemp = Math.round(temperature.min);
    const maxTemp = Math.round(temperature.max);

    const amPrecip = precipitationProbability.am;
    const pmPrecip = precipitationProbability.pm;

    let rainText = "";

    if (amPrecip >= 60) {
        rainText = `오전 강수확률 ${amPrecip}%`;
    } else if (pmPrecip >= 60) {
        rainText = `오후 강수확률 ${pmPrecip}%`;
    } else if (amPrecip >= 30 || pmPrecip >= 30) {
        rainText = "강수확률 보통";
    } else {
        rainText = "강수확률 낮음";
    }

    return `${dayjs(forecastDate).format("M월 DD일")} ${
        amWeather === "정보 없음" ? "" : `오전 ${amWeather} /`
    } 오후 ${pmWeather}, ${minTemp}~${maxTemp}°, ${rainText}`;
};

module.exports.getNextClosestDay = ({
    baseDays,
    days,
    alertDaysBefore,
    alertTime,
}) => {
    const today = dayjs(baseDays);
    console.log("today:", today);
    const todayDayOfWeek = today.day();

    const sortedDays = [...days].sort((a, b) => a - b);

    for (let day of sortedDays) {
        const alertDay = (day - alertDaysBefore + 7) % 7;

        if (
            alertDay > todayDayOfWeek ||
            (alertDay === todayDayOfWeek && dayjs(alertTime).isAfter(today))
        ) {
            console.log("day:", day);
            return day;
        }
    }

    console.log("sor", sortedDays[0]);
    return sortedDays[0];
};

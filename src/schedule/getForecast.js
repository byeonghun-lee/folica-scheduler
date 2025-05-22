const dayjs = require("dayjs");
require("dayjs/locale/ko");
dayjs.locale("ko");

const { connect, disconnect } = require("../db");
const { WeatherAlarm } = require("../models/weatherAlarm");
const { WeatherForecast } = require("../models/weatherForecast");
const { WeatherUser } = require("../models/weatherUser");
const { getCoordinates } = require("../service/convertLocationToCoordinates");
const { getForecast } = require("../service/getWeatherForecastInKMA");
const { sendPushNotification } = require("../service/sendFCM");
const {
    generateWeatherPushMessage,
    getNextClosestDay,
} = require("../service/weatherAlarmService");

module.exports.getForecast = async () => {
    console.log("START FORECAST.");
    await connect();

    try {
        const weatherAlarmList = await WeatherAlarm.find({
            nextAlertDate: {
                $gt: dayjs().toDate(),
                $lte: dayjs().add(1, "minute"),
            },
            isActive: true,
            isDeleted: false,
        }).populate({
            path: "user",
            model: WeatherUser,
        });

        console.log("Target weather alarm:", weatherAlarmList);

        if (!weatherAlarmList?.length) {
            console.log("Empty weather alarm.");
            console.log("END FORECAST.");
            disconnect();
            return;
        }

        for (let index = 0; index < weatherAlarmList.length; index++) {
            const weatherAlarmItem = weatherAlarmList[index];

            if (!weatherAlarmItem.locationCoordinates.x) {
                const coordinates = await getCoordinates(
                    weatherAlarmItem.location
                );
                console.log("coordinates:", coordinates);

                weatherAlarmItem.locationCoordinates = {
                    x: coordinates.x,
                    y: coordinates.y,
                    location: {
                        type: "Ponint",
                        coordinates: [coordinates.lng, coordinates.lat],
                    },
                };
            }

            const weatherData = await getForecast({
                alertDaysBefore: weatherAlarmItem.alertDaysBefore,
                alertTime: weatherAlarmItem.alertTime,
                nx: weatherAlarmItem.locationCoordinates.x,
                ny: weatherAlarmItem.locationCoordinates.y,
            });

            const forecast = {
                deviceId: weatherAlarmItem.deviceId,
                weatherAlarm: weatherAlarmItem._id,
                location: weatherAlarmItem.location,
                forecastDate: weatherAlarmItem.nextAlertDate,
                temperature: {
                    min: weatherData?.tempMin,
                    max: weatherData?.tempMax,
                },
                weather: {
                    am: weatherData.precipType?.am || weatherData.sky?.am,
                    pm: weatherData.precipType?.pm || weatherData.sky?.pm,
                },
                precipitationProbability: {
                    am: weatherData.precipProb?.am,
                    pm: weatherData.precipProb?.pm,
                },
                source: "KMA",
            };

            try {
                await WeatherForecast.create(forecast);

                const message = generateWeatherPushMessage(forecast);
                console.log("message:", message);

                await sendPushNotification({
                    token: weatherAlarmItem.user?.token,
                    title: `${weatherAlarmItem.location} 예보`,
                    body: message,
                    data: {
                        screen: "Noti",
                    },
                });

                console.log(
                    `Success send noti. device ID: ${weatherAlarmItem.user?.deviceId}`
                );

                if (weatherAlarmItem.dayOfTheWeek?.length > 0) {
                    const nextAlertDayOfWeek = getNextClosestDay({
                        baseDays: weatherAlarmItem.nextAlertDate,
                        days: weatherAlarmItem.dayOfTheWeek,
                        alertDaysBefore: weatherAlarmItem.alertDaysBefore,
                        alertTime: weatherAlarmItem.alertTime,
                    });

                    const diffDays =
                        nextAlertDayOfWeek - dayjs().day() < 0
                            ? nextAlertDayOfWeek - dayjs().day() + 7
                            : nextAlertDayOfWeek - dayjs().day();

                    weatherAlarmItem.nextAlertDate = dayjs()
                        .add(diffDays - weatherAlarmItem.alertDaysBefore, "day")
                        .hour(dayjs(weatherAlarmItem.alertTime).hour())
                        .minute(dayjs(weatherAlarmItem.alertTime).minute())
                        .startOf("second")
                        .toDate();
                } else {
                    weatherAlarmItem.isActive = false;
                }

                await weatherAlarmItem.save();
                console.log("Saved weather alarm.");
            } catch (messageError) {
                console.log("Message Error:", messageError);
                console.log("target:", weatherAlarmItem);
            }
        }
        console.log("END FORECAST.");
        await disconnect();
    } catch (error) {
        console.log("Get forecast error:", error);
    }
};

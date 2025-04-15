const { connect, disconnect } = require("../db");
const { WeatherAlarm } = require("../models/weatherAlarm");
const { getCoordinates } = require("../service/convertLocationToCoordinates");
const {
    getHourlyForecastFromNow,
} = require("../service/getWeatherForecastInKMA");

module.exports.getHourlyForecast = async () => {
    console.log("START HOURLY FORECAST.");
    await connect();

    try {
        const weatherAlarmList = await WeatherAlarm.find({
            isActive: true,
            isDeleted: false,
        });

        if (!weatherAlarmList?.length) {
            console.log("Empty weather alarm.");
            console.log("END HOURLY FORECAST.");
            disconnect();
            return;
        }

        for (let index = 0; index < weatherAlarmList.length; index++) {
            const weatherAlarmItem = weatherAlarmList[index];
            console.log(
                "weatherAlarmItem location: ",
                weatherAlarmItem.location
            );

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

            weatherAlarmItem.forecast24h = await getHourlyForecastFromNow({
                nx: weatherAlarmItem.locationCoordinates.x,
                ny: weatherAlarmItem.locationCoordinates.y,
            });

            await weatherAlarmItem.save();
            console.log("Saved weather alarm.");
        }

        console.log("END HOURLY FORECAST.");
    } catch (error) {
        console.log("Get hourly forecast error:", error);
    }

    disconnect();
};

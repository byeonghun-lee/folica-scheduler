const axios = require("axios");

const kakaoLocalSearchUrl = "https://dapi.kakao.com/v2/local/search/address";
const RE = 6371.00877; // 지구 반경(km)
const GRID = 5.0; // 격자 간격(km)
const SLAT1 = 30.0; // 투영 위도1(degree)
const SLAT2 = 60.0; // 투영 위도2(degree)
const OLON = 126.0; // 기준점 경도(degree)
const OLAT = 38.0; // 기준점 위도(degree)
const XO = 43; // 기준점 X좌표(GRID)
const YO = 136; // 기1준점 Y좌표(GRID)

const convertCoordinatesToXY = ({ lat, lng }) => {
    const DEGRAD = Math.PI / 180.0;

    const re = RE / GRID;
    const slat1 = SLAT1 * DEGRAD;
    const slat2 = SLAT2 * DEGRAD;
    const olon = OLON * DEGRAD;
    const olat = OLAT * DEGRAD;

    let sn =
        Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
        Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
    let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
    ro = (re * sf) / Math.pow(ro, sn);
    const result = {};

    let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
    ra = (re * sf) / Math.pow(ra, sn);
    let theta = lng * DEGRAD - olon;
    if (theta > Math.PI) theta -= 2.0 * Math.PI;
    if (theta < -Math.PI) theta += 2.0 * Math.PI;
    theta *= sn;
    result["x"] = Math.floor(ra * Math.sin(theta) + XO + 0.5);
    result["y"] = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

    return result;
};

const getCoordinates = async (query) => {
    try {
        const result = await axios.get(
            `${kakaoLocalSearchUrl}?query=${query}`,
            {
                headers: {
                    Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
                },
            }
        );
        console.log("resultData:", result.data);
        const lat = result.data.documents[0].y;
        const lng = result.data.documents[0].x;

        const convertedXY = convertCoordinatesToXY({ lat, lng });
        console.log("convertedXY:", convertedXY);

        return {
            lat,
            lng,
            x: convertedXY.x,
            y: convertedXY.y,
        };
    } catch (error) {
        console.log("Get coordinates error:", error);
        throw new Error(error.message);
    }
};

module.exports = {
    getCoordinates,
};

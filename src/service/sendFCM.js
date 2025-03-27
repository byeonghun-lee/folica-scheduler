const admin = require("firebase-admin");
const serviceAccount = require("../keys/ahead-weather-firebase-adminsdk-fbsvc-9171fc95b0.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

module.exports.sendPushNotification = async ({
    token,
    title,
    body,
    data = {},
}) => {
    const message = {
        token: token, // 대상 기기의 FCM 토큰
        notification: {
            title: title,
            body: body,
        },
        data: data, // 선택: 커스텀 데이터 전달
    };

    try {
        const response = await admin.messaging().send(message);
        console.log("푸시 전송 성공:", response);
    } catch (error) {
        console.error("푸시 전송 실패:", error);
    }
};

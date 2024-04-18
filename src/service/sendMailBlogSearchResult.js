const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const sendMail = async () => {
    try {
        const client = new SESClient({
            credentials: {
                accessKeyId: process.env.ACCESS_KEY_ID,
                secretAccessKey: process.env.SECRET_ACCESS_KEY,
            },
            region: process.env.AWS_REGION,
        });

        const params = {
            Source: "info@chickentowel.com",
            Destination: {
                ToAddresses: ["byeonghun08@gmail.com"],
            },
            Message: {
                Subject: {
                    Data: "2023년 4월 30일 키워드 노출",
                    Charset: "UTF-8",
                },
                Body: {
                    Text: {
                        Data: "TEST email",
                        Charset: "UTF-8",
                    },
                },
            },
        };

        const result = await client.send(new SendEmailCommand(params));
        console.log("result:", result);
    } catch (error) {
        console.log("Send mail error:", error);
    }
};

module.exports = {
    sendMail,
};

const mongoose = require("mongoose");

let isConnected = false;
let connectionCount = 0;

module.exports.connect = async () => {
    if (!isConnected) {
        const safeOn = (event, handler) => {
            if (mongoose.connection.listenerCount(event) === 0) {
                mongoose.connection.on(event, handler);
            }
        };

        safeOn("error", (error) => {
            console.log(`DB connect error:`, error);
        });

        safeOn("disconnected", () => {
            console.log("DB disconnected.");
            isConnected = false;
        });

        safeOn("close", () => {
            console.log("DB close.");
            isConnected = false;
        });

        safeOn("connected", () => {
            console.log("DB connected!");
        });

        await mongoose.connect(process.env.DB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        isConnected = true;
    }

    connectionCount++;
    console.log("Connect connectionCount:", connectionCount);
};

module.exports.disconnect = async () => {
    connectionCount--;
    console.log("Disconnect connectionCount:", connectionCount);

    if (connectionCount <= 0 && isConnected) {
        await mongoose.disconnect();
        isConnected = false;
        connectionCount = 0;
        console.log("Disconnected from DB");
    }
};

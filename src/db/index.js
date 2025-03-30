const mongoose = require("mongoose");

module.exports.connect = async () => {
    if (mongoose.connection.readyState === 1) {
        return;
    }

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
    });

    safeOn("close", () => {
        console.log("DB close.");
    });

    safeOn("connected", () => {
        console.log("DB connected!");
    });

    await mongoose.connect(process.env.DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
};

module.exports.disconnect = async () => {
    await mongoose.disconnect();
};

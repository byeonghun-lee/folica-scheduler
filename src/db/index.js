const mongoose = require("mongoose");

module.exports.connect = async () => {
    if (mongoose.connection.readyState === 1) {
        return;
    }

    mongoose.connection.on("error", (error) => {
        console.log(`DB connect error:`, error);
    });
    mongoose.connection.on("disconnected", () => {
        console.log("DB disconnected.");
    });
    mongoose.connection.on("close", () => {
        console.log("DB close.");
    });

    mongoose.connection.on("connected", () => {
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

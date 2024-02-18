const { connect, disconnect } = require("../db");
const mongoose = require("mongoose");

module.exports.instagramScraping = async () => {
    console.log("START INSTAGRAM SCRAPING.");
    await connect();

    console.log("End INSTAGRAM SCRAPING.");
    disconnect();
};

const dotenv = require("dotenv").config();
const {
    instagramFollowScraping,
} = require("./src/schedule/instagramFollowScraping");
const {
    instagramProfileScraping,
} = require("./src/schedule/instagramProfileScraping");

// instagramFollowScraping();
instagramProfileScraping();

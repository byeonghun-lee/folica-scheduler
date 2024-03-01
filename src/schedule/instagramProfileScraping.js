const { connect, disconnect } = require("../db");
const { SnsProfile } = require("../models/snsProfile");
const puppeteer = require("puppeteer");
const axios = require("axios");
const FormData = require("form-data");

module.exports.instagramProfileScraping = async () => {
    console.log("START INSTAGRAM PROFILE SCRAPING.");

    await connect();

    try {
        const targetProfileList = await SnsProfile.find({
            snsName: "instagram",
            name: { $exists: false },
            desc: { $exists: false },
            imageUrl: { $exists: false },
        }).sort({ _id: -1 });
        console.log("targetProfileList:", targetProfileList);
        
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        await new Promise((resolve) => setTimeout(resolve, 30000));

        const profileImgPath = "section header > div img";
        const profileNamePath =
            "section header > section > div:nth-child(4) > div";
        const profileDescPath =
            "section header > section > div:nth-child(4) > h1";

        for (let index = 0; index < targetProfileList.length; index++) {
            const targetInstagram = targetProfileList[index];

            await page.goto(targetInstagram.path);
            console.log("인스타그램 페이지로 이동:", targetInstagram.path);

            await page.waitForSelector(profileImgPath);
            console.log("페이지 대기 완료");

            const profileImg = await page.evaluate(
                (profileImgPath) => document.querySelector(profileImgPath)?.src,
                profileImgPath
            );
            console.log("profileImg:", profileImg);
            const name = await page.evaluate(
                (profileNamePath) =>
                    document.querySelector(profileNamePath)?.innerText,
                profileNamePath
            );
            console.log("name:", name);
            const desc = await page.evaluate(
                (profileDescPath) =>
                    document.querySelector(profileDescPath)?.innerText,
                profileDescPath
            );
            console.log("desc:", desc);

            const form = new FormData();
            form.append("url", profileImg);
            form.append("metadata", JSON.stringify({ sns: "instagram" }));

            const uploadImage = await axios.post(
                `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUD_FLARE_ACCOUNT_ID}/images/v1`,
                form,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.CLOUD_FLARE_TOKEN}`,
                    },
                }
            );

            console.log("uploadImage:", uploadImage.data);

            targetInstagram.name = name;
            targetInstagram.desc = desc;
            targetInstagram.updatedAt = new Date();
            targetInstagram.imageUrl = uploadImage.data.result.variants[0];
            await targetInstagram.save();

            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        console.log("완료");
    } catch (error) {
        console.log("INSTAGRAM PROFILE ERROR:", error);
    }

    console.log("END INSTAGRAM PROFILE SCRAPING.");
    disconnect();
};

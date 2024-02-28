const { connect, disconnect } = require("../db");
const { SnsProfile } = require("../models/snsProfile");
const puppeteer = require("puppeteer");

module.exports.instagramProfileScraping = async () => {
    console.log("START INSTAGRAM PROFILE SCRAPING.");

    await connect();

    try {
        const targetProfileList = await SnsProfile.find({
            snsName: "instagram",
            name: { $exists: false },
            desc: { $exists: false },
            imageUrl: { $exists: false },
        })
            .limit(1)
            .sort({ _id: -1 });
        console.log("targetProfileList:", targetProfileList);

        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

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
                (profileImgPath) => document.querySelector(profileImgPath).src,
                profileImgPath
            );
            console.log("profileImg:", profileImg);
            const name = await page.evaluate(
                (profileNamePath) =>
                    document.querySelector(profileNamePath).innerText,
                profileNamePath
            );
            console.log("name:", name);
            const desc = await page.evaluate(
                (profileDescPath) =>
                    document.querySelector(profileDescPath).innerText,
                profileDescPath
            );
            console.log("desc:", desc);
            // 업데이트 해주고.
            // 이미지 cloudflare에 넣어주고
        }
    } catch (error) {
        console.log("INSTAGRAM PROFILE ERROR:", error);
    }

    console.log("END INSTAGRAM PROFILE SCRAPING.");
    disconnect();
};

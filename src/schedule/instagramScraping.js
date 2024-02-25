const { connect, disconnect } = require("../db");
const { SnsAccount } = require("../models/snsAccount");
const { SnsProfile } = require("../models/snsProfile");
const puppeteer = require("puppeteer");

module.exports.instagramScraping = async () => {
    console.log("START INSTAGRAM SCRAPING.");
    await connect();

    try {
        const accountList = await SnsAccount.find({
            "instagram.status": "complete",
        })
            .select("instagram")
            .lean();

        console.log("accountList:", accountList);

        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        await page.goto("https://www.instagram.com/accounts/login/");

        await page.waitForSelector("input");

        await page.type('input[name="username"]', process.env.INSTAGRAM_ID);
        await page.type('input[type="password"]', process.env.INSTAGRAM_PWD);
        await page.click('button[type="submit"]');
        await page.waitForSelector('svg[aria-label="홈"]');

        for (let index = 0; index < accountList.length; index++) {
            const account = accountList[index];
            await page.goto(
                `https://www.instagram.com/${account.instagram.path}/following/`
            );
            console.log("인스타그램 페이지로 이동:", account.instagram.path);
            await page.waitForSelector('div[role="dialog"]');
            console.log("페이지 대기 완료");

            await page.evaluate(async () => {
                let lastScrollHeight = 0;
                while (true) {
                    await new Promise((resolve) => setTimeout(resolve, 2000));

                    const scrollableElement = document.querySelector(
                        "div[style='height: auto; overflow: hidden auto;']"
                    ).parentNode;
                    scrollableElement.scrollTo(
                        0,
                        scrollableElement.scrollHeight
                    );

                    await new Promise((resolve) => setTimeout(resolve, 2000));

                    const currentScrollHeight = scrollableElement.scrollHeight;

                    if (currentScrollHeight === lastScrollHeight) {
                        break;
                    }

                    lastScrollHeight = currentScrollHeight;
                }
            });
        }

        const hrefs = await page.evaluate(() => {
            const linkElements = document.querySelectorAll(
                "div[style='height: auto; overflow: hidden auto;'] a"
            );

            const hrefArray = [];
            linkElements.forEach((link) => {
                hrefArray.push(link.getAttribute("href"));
            });

            return hrefArray;
        });
        console.log("hrefs:", hrefs);

        const uniqueFollowAccount = hrefs.reduce(
            (followList, followAccount) => {
                if (followList.indexOf(followAccount) < 0) {
                    followList.push(followAccount);
                }
                return followList;
            },
            []
        );

        console.log("uniqueFollowAccount:", uniqueFollowAccount);

        await SnsProfile.bulkWrite(
            uniqueFollowAccount.map((follow) => ({
                updateOne: {
                    filter: { path: `https://www.instagram.com${follow}` },
                    update: { path: `https://www.instagram.com${follow}` },
                    upsert: true,
                },
            }))
        );
        console.log("완료");
    } catch (error) {
        console.log("error:", error);
    }

    console.log("End INSTAGRAM SCRAPING.");
    disconnect();
};

const puppeteer = require("puppeteer");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const dayjs = require("dayjs");
require("dayjs/locale/ko");
dayjs.locale("ko");

const { connect, disconnect } = require("../db");
const { Keyword } = require("../models/keyword");
const { DailyKeywordScraping } = require("../models/dailyKeywordScraping");
const { KeywordRelation } = require("../models/keywordRelations");
const { keywordScrapingLog } = require("../models/keywordScrapingLog");

module.exports.naverBlogKeywordScraping = async () => {
    console.log("START NAVER BLOG KEYWORD SCRAPING.");
    const folderName = `blogKeyword_${dayjs().format("YYYY_MM_DD_HH_mm")}`;
    fs.mkdirSync(folderName, {
        recursive: true,
    });

    await connect();

    // 키워드를 가져와
    // 키워드에 대한 dailyScraping을 만들어줘
    // 키워드에 대한  keyword relation을 가져와
    // scraping log를 만들어줘 (여기에 키워드에 대한 정보를 넣어줄지? 이메일을 만들때 넣어줄지?)

    const blogListWrapperPath = "section > div > ul";
    const blogListPath = "section > div > ul > li";
    const blogMainUrl = ".user_box_inner > a";
    const blogContentTitle = ".detail_box > .title_area > a";
    const blogContentDesc = ".detail_box > .dsc_area";

    try {
        const keywordList = await Keyword.find({}).limit(1).lean();

        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        for (let index = 0; index < keywordList.length; index++) {
            const keywordItem = keywordList[index];

            console.log("keywordItem:", keywordItem);

            await page.goto(
                `https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_jum&query=${keywordItem.name}`
            );

            await page.waitForSelector(blogListWrapperPath);

            const blogDataList = await page.evaluate(
                ({
                    blogListPath,
                    blogMainUrl,
                    blogContentTitle,
                    blogContentDesc,
                }) => {
                    const blogList = Array.from(
                        document.querySelectorAll(blogListPath)
                    );
                    console.log("blogList:", blogList);

                    return blogList
                        .filter((blog) => !!blog.querySelector(blogMainUrl))
                        .map((blog) => {
                            const userBlogUrl =
                                blog.querySelector(blogMainUrl).href;
                            const userBlogContentUrl =
                                blog.querySelector(blogContentTitle).href;

                            const userBlogContentTitle =
                                blog.querySelector(blogContentTitle).innerText;
                            const userBlogContentDesc =
                                blog.querySelector(blogContentDesc).innerText;
                            const element = blog.getBoundingClientRect();

                            return {
                                userBlogUrl,
                                userBlogContentUrl,
                                userBlogContentTitle,
                                userBlogContentDesc,
                                element: {
                                    bottom: element.bottom,
                                    height: element.height,
                                    left: element.left,
                                    right: element.right,
                                    top: element.top,
                                    width: element.width,
                                    x: element.x,
                                    y: element.y,
                                },
                            };
                        });
                },
                {
                    blogListPath,
                    blogMainUrl,
                    blogContentTitle,
                    blogContentDesc,
                }
            );

            console.log("blogDataList:", blogDataList);

            const screenshotFileName = `${keywordItem.name}_${dayjs().format(
                "YYYY_MM_DD_HH_mm"
            )}.png`;

            await page.screenshot({
                path: `${folderName}/${screenshotFileName}`,
                fullPage: true,
            });

            const form = new FormData();
            const image = fs.readFileSync(
                path.join(__dirname, "..", "..", folderName, screenshotFileName)
            );

            form.append("file", image, screenshotFileName);

            const uploadImage = await axios.post(
                `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUD_FLARE_ACCOUNT_ID}/images/v1`,
                form,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.CLOUD_FLARE_TOKEN}`,
                    },
                }
            );
            console.log("uploadImage:", uploadImage?.data);

            await DailyKeywordScraping.create({
                keyword: keywordItem._id,
                screenShotUrl: uploadImage?.data?.result?.variants[1],
                textContent: blogDataList,
            });

            const keywordRelationList = await KeywordRelation.find({
                keyword: keywordItem._id,
                isDeleted: false,
            }).lean();
            console.log("keywordRelationList:", keywordRelationList);

            await keywordScrapingLog.create(
                keywordRelationList.map((relationItem) => ({
                    keywordRelation: relationItem._id,
                    userId: relationItem.userId,
                    action: "addScrapingData",
                }))
            );
        }

        fs.rmSync(folderName, { recursive: true, force: true });
        console.log("완료");
    } catch (error) {
        console.log("Error:", error);
    }
};

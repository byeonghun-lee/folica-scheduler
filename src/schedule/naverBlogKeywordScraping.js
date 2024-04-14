const puppeteer = require("puppeteer");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

module.exports.naverBlogKeywordScraping = async () => {
    console.log("START NAVER BLOG KEYWORD SCRAPING.");

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
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();

        const keyword = "수원구치소";

        await page.goto(
            `https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_jum&query=${keyword}`
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

                        return {
                            userBlogUrl,
                            userBlogContentUrl,
                            userBlogContentTitle,
                            userBlogContentDesc,
                        };
                    });
            },
            { blogListPath, blogMainUrl, blogContentTitle, blogContentDesc }
        );

        console.log("blogDataList:", blogDataList);

        await page.screenshot({
            path: "fullpage.png",
            fullPage: true,
        });

        const form = new FormData();
        const image = fs.readFileSync(
            path.join(__dirname, "..", "..", "fullpage.png")
        );
        form.append("file", image, "fullpage.png");

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
    } catch (error) {
        console.log("Error:", error);
    }
};

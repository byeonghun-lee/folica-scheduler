const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const dayjs = require("dayjs");
require("dayjs/locale/ko");
dayjs.locale("ko");
const { connect, disconnect } = require("../db");

const { Auth } = require("../models/auth");
const { KeywordRelation } = require("../models/keywordRelation");
const { DailyKeywordScraping } = require("../models/dailyKeywordScraping");
const { Keyword } = require("../models/keyword");
const { KeywordScrapingLog } = require("../models/keywordScrapingLog");

const sendMail = async () => {
    console.log("이메일 전송 시작");
    try {
        await connect();

        const client = new SESClient({
            credentials: {
                accessKeyId: process.env.ACCESS_KEY_ID,
                secretAccessKey: process.env.SECRET_ACCESS_KEY,
            },
            region: process.env.AWS_REGION,
        });

        const targetUserList = await Auth.find({ service: "echorank" })
            .select(["_id", "email"])
            .lean();

        console.log("targetUserList", targetUserList);

        for (let index = 0; index < targetUserList.length; index++) {
            const user = targetUserList[index];
            const emailContents = [];

            const keywordRelationList = await KeywordRelation.find({
                userId: user._id,
                isDeleted: false,
            })
                .select(["_id", "userId", "keyword", "blogList", "uuid"])
                .populate({
                    path: "keyword",
                    select: ["_id", "name"],
                    model: Keyword,
                })
                .sort({ _id: -1 })
                .lean();

            if (!keywordRelationList.length) {
                continue;
            }

            const keywordIdList = keywordRelationList.map(
                (keywordRelationItem) => keywordRelationItem.keyword
            );

            console.log("keywordIdList:", keywordIdList);

            if (!keywordIdList.filter((item) => !!item).length) {
                continue;
            }

            const dailyScrapingList = await DailyKeywordScraping.find({
                keyword: { $in: keywordIdList },
                createdAt: {
                    $gte: dayjs().startOf("days").toDate(),
                    $lt: dayjs().add(1, "days").startOf("days").toDate(),
                },
            }).lean();

            for (
                let relationIndex = 0;
                relationIndex < keywordRelationList.length;
                relationIndex++
            ) {
                const keywordRelationItem = keywordRelationList[relationIndex];

                const targetDailyScraping = dailyScrapingList.find(
                    (scrapingItem) =>
                        scrapingItem.keyword.toString() ===
                        keywordRelationItem.keyword._id.toString()
                );
                console.log("Has targetDailyScraping:", !!targetDailyScraping);

                emailContents.push(
                    `<h2>키워드: ${keywordRelationItem.keyword.name}</h2>`
                );
                emailContents.push(
                    `<p><a href='https://echorank.info/scrapingLog?image=${
                        keywordRelationItem.uuid
                    }&date=${dayjs().format(
                        "YYYY-MM-DD"
                    )}' rel='nofollow noreferrer noopener' target='_balnk'>검색 결과 이미지 보기<a/></p>`
                );

                if (!keywordRelationItem?.blogList?.length) {
                    emailContents.push(
                        "<p>키워드에 추가하신 블로그가 없습니다.</p>"
                    );
                }

                const blogAndRankList = keywordRelationItem.blogList?.length
                    ? keywordRelationItem.blogList.map((blogUrl) => {
                          const rank =
                              targetDailyScraping.textContent.findIndex(
                                  (searchedBlog) =>
                                      searchedBlog.userBlogUrl === blogUrl ||
                                      searchedBlog.userBlogContentUrl ===
                                          blogUrl
                              );

                          emailContents.push(
                              `<p><a href='${blogUrl}' rel='nofollow noreferrer noopener' target='_balnk'>${blogUrl}<a/>: <span>${
                                  rank >= 0
                                      ? `${rank + 1} 번째 노출됨`
                                      : "노출 안 됨"
                              }</span></p>`
                          );
                          return {
                              url: blogUrl,
                              rank,
                          };
                      })
                    : [];

                await KeywordScrapingLog.create({
                    keywordRelation: keywordRelationItem._id,
                    userId: keywordRelationItem.userId,
                    action: "addScrapingData",
                    displayedList: blogAndRankList.filter(
                        (item) => item?.rank >= 0
                    ),
                });
            }

            console.log("emailContents:", emailContents);

            const params = {
                Source: "info@chickentowel.com",
                Destination: {
                    ToAddresses: ["byeonghun08@gmail.com"],
                    // ToAddresses: [user.email],
                    BccAddresses: ["info@chickentowel.com"],
                },
                Message: {
                    Subject: {
                        Data: `EchoRank에서 ${dayjs().format(
                            "YYYY년 MM월 DD일"
                        )} 키워드 노출 전달드립니다.`,
                        Charset: "UTF-8",
                    },
                    Body: {
                        Html: {
                            Data: emailContents.join(""),
                            Charset: "UTF-8",
                        },
                    },
                },
            };

            const result = await client.send(new SendEmailCommand(params));
            console.log("result:", result);
        }
        console.log("이메일 전송 완료");
    } catch (error) {
        console.log("Send mail error:", error);
    }
};

module.exports = {
    sendMail,
};

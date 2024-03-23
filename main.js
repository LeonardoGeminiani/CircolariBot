const fs = require('node:fs');
const jsdom = require("jsdom");
const {argv, exit } = require('node:process');
const TelegramBot = require('node-telegram-bot-api');
const { JSDOM } = jsdom;

if(argv[2] === undefined || argv[3] === undefined){
    console.error("\x1b[31myou need to call process with:\nCHAT_ID BOT_ID\x1b[0m");
    exit(1);
}

const SECONDS = 10;
const CHAT_ID = argv[2];
const BOT_ID = argv[3];
const bot = new TelegramBot(BOT_ID);

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

main();

async function main() {
    while (true) {
        try {
            await fetch("https://www.ittsrimini.edu.it/circolare/").then(res => res.text())
                .then(html => {
                    let link, desc;

                    try {
                        const dom = new JSDOM(html);

                        let l = dom.window.document.querySelector("main").children;
                        let lastSection = l[l.length - 1];
                        let div = lastSection.querySelector("div > div").children;
                        let el = div[div.length - 1].children;

                        let lastCircolare;
                        try {
                            lastCircolare = el[1].children[1].children[1].children[0];
                        } catch(err) {
                            console.log("non readable");
                            return;
                        }

                        link = lastCircolare.getAttribute("href");
                        desc = lastCircolare.querySelector("h2").innerHTML;

                        if (link === null | undefined || desc === null | undefined) {
                            throw "Undefined Link";
                        }

                    } catch (err) {
                        console.log("bot crash for known reason (site update)", err);
                        exit(1);
                    }

                    const obj = JSON.parse(fs.readFileSync("./Data/lastCircolare.json", "utf8"));

                    if (obj.link !== link || obj.desc !== desc) {
                        // trigger
                        fs.writeFileSync("./Data/lastCircolare.json", JSON.stringify({
                            link,
                            desc
                        }, null, "\t"));

                        // send message
                        bot.sendMessage(CHAT_ID, `🔔<i>Nuova Circolare!!</i>📭️ \n<b>${desc}</b>\n\n${link}`, {
                            parse_mode: "HTML"
                        });
                    } else {
                        console.log("none");
                    }
                });

            await sleep(1000 * SECONDS);
        } catch (err) {
            console.log("bot crash fot unknown reason (internet crash)")
            exit(1);
        }
    }
}
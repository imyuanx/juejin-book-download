import fs from "fs";
import fetch from "node-fetch";

// 小册 ID
const BOOKLET_ID = ["小册1 ID", "小册2 ID"];

// 以下 4 项都可以在 URL 或 Request Headers 中找到
const X_SECSDK_CSRF_TOKEN = "";
const COOKIE = "";
const AID = "";
const UUID = "";

// 下载路径
const OUTPUT_PATH = "./output";

async function main() {
  async function getBookletInfo(booklet_id) {
    const url = `https://api.juejin.cn/booklet_api/v1/booklet/get?aid=${AID}&uuid=${UUID}&spider=0`;
    const body = JSON.stringify({ booklet_id: booklet_id });
    const bookletInfo = await fetch(url, {
      headers: {
        "content-type": "application/json",
        "x-secsdk-csrf-token": X_SECSDK_CSRF_TOKEN,
        cookie: COOKIE,
      },
      body,
      method: "POST",
    });

    return bookletInfo.json();
  }

  async function downloadBooklet(booklet_id) {
    const bookletInfo = await getBookletInfo(booklet_id);
    const {
      data: {
        booklet: {
          base_info: { summary, title },
        },
        sections,
      },
    } = bookletInfo;
    const bookPath = OUTPUT_PATH + `/${title}-${summary}`;
    fs.mkdirSync(bookPath, { recursive: true });

    for (let i = 0; i < sections.length; i++) {
      if (i === 13) continue;
      const { section_id } = sections[i];
      const {
        data: {
          section: { title, markdown_show },
        },
      } = await downloadSection(section_id);
      const bookletSectionTitle = `${i + 1}.${title}`;
      const bookletSectionPath = bookPath + `/${bookletSectionTitle}.md`;
      fs.writeFileSync(bookletSectionPath, markdown_show);
      console.log(`Download complete: ${bookletSectionTitle}`);
    }
  }

  async function downloadSection(sectionId) {
    const sectionInfo = await fetch(
      `https://api.juejin.cn/booklet_api/v1/section/get?aid=${AID}&uuid=${UUID}&spider=0`,
      {
        headers: {
          "content-type": "application/json",
          "x-secsdk-csrf-token": X_SECSDK_CSRF_TOKEN,
          cookie: COOKIE,
        },
        body: `{"section_id":"${sectionId}"}`,
        method: "POST",
      }
    );
    return sectionInfo.json();
  }

  for (let i = 0; i < BOOKLET_ID.length; i++) {
    await downloadBooklet(BOOKLET_ID[i]);
  }
}

main();

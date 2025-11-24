const express = require("express");
const { chromium } = require("playwright");

const app = express();

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/reddit-thread", async (req, res) => {
  const threadUrl = req.query.url;
  if (!threadUrl) {
    return res
      .status(400)
      .json({ error: "Missing query param: ?url=<reddit_thread_url>" });
  }

  // Clean and build the .json URL
  const cleaned = threadUrl.replace(/\?.*$/, "").replace(/\/$/, "");
  const jsonUrl = `${cleaned}.json?raw_json=1`;

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/123 Safari/537.36"
    });

    await page.goto(jsonUrl, {
      waitUntil: "networkidle",
      timeout: 60000
    });

    // Reddit returns JSON text in the body
    const jsonText = await page.evaluate(() => document.body.innerText);
    const data = JSON.parse(jsonText);

    const postData = data[0].data.children[0].data;
    const commentsListing = data[1].data.children;

    function parseComments(children) {
      const tree = [];
      for (const item of children) {
        if (item.kind !== "t1") continue; // only comments
        const d = item.data;
        const node = {
          id: d.id,
          author: d.author,
          body: d.body || "",
          score: d.score,
          created_utc: d.created_utc,
          replies: []
        };
        if (d.replies && typeof d.replies === "object") {
          node.replies = parseComments(d.replies.data.children);
        }
        tree.push(node);
      }
      return tree;
    }

    const post = {
      id: postData.id,
      title: postData.title,
      selftext: postData.selftext || "",
      author: postData.author,
      score: postData.score,
      created_utc: postData.created_utc
    };

    const commentsTree = parseComments(commentsListing);

    res.json({
      post,
      comments: commentsTree,
      jsonUrl
    });
  } catch (err) {
    console.error("Scrape error:", err);
    res.status(500).json({ error: String(err), jsonUrl });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Reddit Playwright scraper listening on port", PORT);
});

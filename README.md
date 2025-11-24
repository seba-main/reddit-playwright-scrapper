# Reddit Playwright Scraper

Small Express + Playwright API that scrapes a full Reddit thread (post + nested comments)
via the `.json?raw_json=1` endpoint from a real browser context.

## Endpoints

- `GET /health`  
  Simple health check: returns `{ "status": "ok" }`.

- `GET /reddit-thread?url=<reddit_thread_url>`  
  Example:

  ```text
  http://localhost:3000/reddit-thread?url=https://www.reddit.com/r/automation/comments/1ncuv8k/best_web_scraping_tools_ive_tried_and_what_i/

---
lastUpdatedOn: 2026-01-13
tags:
  - productivity
---

# Chrome Power User Shortcuts

Maximize productivity by using address bar keywords.  
**To Setup:** Go to `chrome://settings/searchEngines` > **Site search** > **Add**.

## Table of Contents

## 🛠 Development & Work Tools

_Note: Jira URLs are customized for the '`<your-company-name>`' domain._

| Tool                                               | Keyword | Shortcut URL (Copy & Paste)                                                                              | Usage                                        |
| :------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------- | :------------------------------------------- |
| **Jira (Smart Search)**                            | `j`     | `https://<your-company-name>.atlassian.net/secure/QuickSearch.jspa?searchString=%s`                      | `j 123` (jumps to ticket) or `j login bug`   |
| **Jira (Project: <your-project-code>)**            | `jp`    | `https://<your-company-name>.atlassian.net/issues?jql=textfields~"%s" AND project="<your-project-code>"` | `jp checkout` (searches only this project)   |
| **Jira Ticket for a project <your-project-code>)** | `jt`    | `https://<your-company-name>.atlassian.net/browse/<your-project-code>-%s"`                               | `jt 125` (opens ticket `<project-code>-125`) |
| **Confluence**                                     | `cf`    | `https://<your-company-name>.atlassian.net/wiki/search?text=%s`                                          | `cf onboarding`                              |
| **Bitbucket**                                      | `bb`    | `https://bitbucket.org/search?q=%s`                                                                      | `bb repo_name`                               |
| **Chrome Store**                                   | `ext`   | `https://chrome.google.com/webstore/search/%s`                                                           | `ext json viewer`                            |

---

## 🤖 AI Tools

| Tool           | Keyword  | Shortcut URL (Copy & Paste)             | Usage                     |
| :------------- | :------- | :-------------------------------------- | :------------------------ |
| **Claude**     | `c`      | `https://claude.ai/new?q=%s`            | `c explain this code`     |
| **Perplexity** | `p`      | `https://www.perplexity.ai/search?q=%s` | `p latest react features` |
| **ChatGPT**    | `gpt`    | `https://chatgpt.com/?q=%s`             | `gp write a poem`         |
| **Gemini**     | `gemini` | `https://gemini.google.com/app?q=%s`    | `gemini summarize this`   |

**Notes:**

- For ChatGPT & Claude, search was not auto initializing, and was only creating a draft promt, and needed to press Enter.
  - For my work profile, I have set ChatGPT as default search engine by using a chrome extension called "ChatGPT Search"
  - For Claude, I use the desktop app, with shortcut key binding of `Opt + Space`.
- For Perplexity and Gemini, search was working fine
  - For my personal chrome profile, I have set perplexity as default search engine.

---

## 📂 Google Office & Drive

| Tool              | Keyword | Shortcut URL (Copy & Paste)                      | Usage                   |
| :---------------- | :------ | :----------------------------------------------- | :---------------------- |
| **Google Sheets** | `sheet` | `https://docs.google.com/spreadsheets/u/0/?q=%s` | `sheet Q1 budget`       |
| **Google Docs**   | `doc`   | `https://docs.google.com/document/u/0/?q=%s`     | `doc meeting notes`     |
| **Google Drive**  | `dr`    | `https://drive.google.com/drive/search?q=%s`     | `dr project proposal`   |
| **Gmail**         | `gm`    | `https://mail.google.com/mail/u/0/#search/%s`    | `gm invoice from apple` |

> **🔥 Pro Tip:** Type `sheet.new` or `doc.new` directly in the address bar to create a blank file instantly (no setup required).

---

## 🍿 Entertainment & Shopping

| Tool              | Keyword | Shortcut URL (Copy & Paste)                       | Usage                |
| :---------------- | :------ | :------------------------------------------------ | :------------------- |
| **YouTube**       | `yt`    | `https://www.youtube.com/results?search_query=%s` | `yt coding tutorial` |
| **YouTube Music** | `ym`    | `https://music.youtube.com/search?q=%s`           | `ym lo-fi beats`     |
| **Amazon**        | `az`    | `https://www.amazon.com/s?k=%s`                   | `am running shoes`   |

---

## ⚡️ Bonus Utilities

| Tool                | Keyword | Shortcut URL (Copy & Paste)                          | Usage                  |
| :------------------ | :------ | :--------------------------------------------------- | :--------------------- |
| **Google Maps**     | `map`   | `https://www.google.com/maps/search/%s`              | `map coffee near me`   |
| **Google Calendar** | `cal`   | `https://calendar.google.com/calendar/r/search?q=%s` | `cal standup`          |
| **Google Images**   | `img`   | `https://www.google.com/search?tbm=isch&q=%s`        | `img transparent logo` |
| **Thesaurus**       | `def`   | `https://www.google.com/search?q=define+%s`          | `def esoteric`         |

- For new calendar events try `cal.new`

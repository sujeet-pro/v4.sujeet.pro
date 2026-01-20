---
lastUpdatedOn: 2025-12-24
tags:
  - productivity
---

# Chrome Power User Setup

My Chrome configuration for maximum productivity: address bar keywords for instant navigation and essential extensions for a seamless cross-browser workflow.

## TLDR

- **Address bar keywords** turn Chrome's omnibox into a command palette—type `j 123` to jump directly to Jira ticket 123
- **Cross-browser extensions** (Raindrop, Bitwarden) ensure bookmarks and passwords sync regardless of which browser you're testing
- **Claude ecosystem** integration: desktop app (`Opt+Space`), CLI, IDE extensions, and browser extension cover all AI use cases

---

## Address Bar Keywords

Address bar keywords let you search any site directly from Chrome's omnibox. Instead of navigating to Jira, then searching, type `j login bug` and hit Enter.

**Setup:** `chrome://settings/searchEngines` → **Site search** → **Add**


### Development & Work Tools

> Replace `<your-company-name>` and `<your-project-code>` with your actual Jira/Atlassian values.

| Tool                                               | Keyword | Shortcut URL (Copy & Paste)                                                                              | Usage                                        |
| :------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------- | :------------------------------------------- |
| **Jira (Smart Search)**                            | `j`     | `https://<your-company-name>.atlassian.net/secure/QuickSearch.jspa?searchString=%s`                      | `j 123` (jumps to ticket) or `j login bug`   |
| **Jira (Project: <your-project-code>)**            | `jp`    | `https://<your-company-name>.atlassian.net/issues?jql=textfields~"%s" AND project="<your-project-code>"` | `jp checkout` (searches only this project)   |
| **Jira Ticket for a project <your-project-code>)** | `jt`    | `https://<your-company-name>.atlassian.net/browse/<your-project-code>-%s`                                | `jt 125` (opens ticket `<project-code>-125`) |
| **Confluence**                                     | `cf`    | `https://<your-company-name>.atlassian.net/wiki/search?text=%s`                                          | `cf onboarding`                              |
| **Bitbucket**                                      | `bb`    | `https://bitbucket.org/search?q=%s`                                                                      | `bb repo_name`                               |
| **Chrome Store**                                   | `ext`   | `https://chrome.google.com/webstore/search/%s`                                                           | `ext json viewer`                            |

### AI Tools

| Tool           | Keyword  | Shortcut URL (Copy & Paste)             | Usage                     |
| :------------- | :------- | :-------------------------------------- | :------------------------ |
| **Claude**     | `c`      | `https://claude.ai/new?q=%s`            | `c explain this code`     |
| **Perplexity** | `p`      | `https://www.perplexity.ai/search?q=%s` | `p latest react features` |
| **ChatGPT**    | `gpt`    | `https://chatgpt.com/?q=%s`             | `gpt write a poem`        |
| **Gemini**     | `gemini` | `https://gemini.google.com/app?q=%s`    | `gemini summarize this`   |

**Notes:**

- ChatGPT & Claude keywords create a draft prompt—you still need to press Enter to submit
- Perplexity and Gemini auto-submit the search
- I set Perplexity as default search engine on my personal profile, ChatGPT on work profile (via "ChatGPT Search" extension)

### Google Office & Drive

| Tool              | Keyword | Shortcut URL (Copy & Paste)                      | Usage                   |
| :---------------- | :------ | :----------------------------------------------- | :---------------------- |
| **Google Sheets** | `sheet` | `https://docs.google.com/spreadsheets/u/0/?q=%s` | `sheet Q1 budget`       |
| **Google Docs**   | `doc`   | `https://docs.google.com/document/u/0/?q=%s`     | `doc meeting notes`     |
| **Google Drive**  | `dr`    | `https://drive.google.com/drive/search?q=%s`     | `dr project proposal`   |
| **Gmail**         | `gm`    | `https://mail.google.com/mail/u/0/#search/%s`    | `gm invoice from apple` |

> **Pro Tip:** Type `sheet.new` or `doc.new` directly in the address bar to create a blank file instantly (no setup required).

### Entertainment & Shopping

| Tool              | Keyword | Shortcut URL (Copy & Paste)                       | Usage                |
| :---------------- | :------ | :------------------------------------------------ | :------------------- |
| **YouTube**       | `yt`    | `https://www.youtube.com/results?search_query=%s` | `yt coding tutorial` |
| **YouTube Music** | `ym`    | `https://music.youtube.com/search?q=%s`           | `ym lo-fi beats`     |
| **Amazon**        | `az`    | `https://www.amazon.com/s?k=%s`                   | `az running shoes`   |

### Utilities

| Tool                | Keyword | Shortcut URL (Copy & Paste)                          | Usage                  |
| :------------------ | :------ | :--------------------------------------------------- | :--------------------- |
| **Google Maps**     | `map`   | `https://www.google.com/maps/search/%s`              | `map coffee near me`   |
| **Google Calendar** | `cal`   | `https://calendar.google.com/calendar/r/search?q=%s` | `cal standup`          |
| **Google Images**   | `img`   | `https://www.google.com/search?tbm=isch&q=%s`        | `img transparent logo` |
| **Thesaurus**       | `def`   | `https://www.google.com/search?q=define+%s`          | `def esoteric`         |

> **Pro Tip:** `cal.new` creates a new calendar event instantly.

---

## Essential Extensions

I frequently switch browsers to test features (Arc, Firefox, Brave, etc.), so browser-agnostic tools are essential. Chrome remains my daily driver.

### Cross-Browser Sync

| Extension | Purpose |
| :-------- | :------ |
| **[Raindrop.io](https://raindrop.io/)** | Bookmark manager that syncs across all browsers. When testing Arc's spaces or Brave's privacy features, I still have access to my entire bookmark library. |
| **[Bitwarden](https://bitwarden.com/)** | Password manager + passkey storage. Set as default password manager with the companion desktop app for system-wide autofill. Works identically across browsers. |

### Development

| Extension | Purpose |
| :-------- | :------ |
| **[React Developer Tools](https://chromewebstore.google.com/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)** | Inspect React component hierarchy, props, and state. Essential for debugging React applications. |
| **Ad Blocker** | I use uBlock Origin. Reduces noise and improves page load times during development. |

### AI Integration

| Extension | Purpose |
| :-------- | :------ |
| **[Claude](https://chromewebstore.google.com/detail/claude/danfoobphdgcjkkpopfngjfnfckhpnhl)** | Browser extension for using Claude on any webpage. Most ChatGPT Atlas and Perplexity features are available here—summarize pages, ask questions about content, extract data. |

**My Claude Workflow:**

I'm a heavy Claude user across multiple surfaces:

- **Desktop app** (`Opt + Space`) — Quick questions and searches without leaving current context
- **Claude Code CLI + IDE extensions** — All coding tasks: debugging, refactoring, code generation
- **Browser extension** — AI assistance on any website: summarizing articles, analyzing content, extracting structured data

This combination covers every AI use case without context-switching between tools.

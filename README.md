# Geminify ✨

**AI Summarizer & Assistant for Chrome** — by [Hulmify](https://hulmify.com)

> Summarize pages, chat with context, and organize web insights instantly using the power of Google Gemini AI.

<img width="1280" height="800" alt="Banner Geminify" src="https://github.com/user-attachments/assets/7f9f43f2-78da-42d0-932e-919d5629faff" />

---

## 🚀 Features

### 1. 💬 Streaming Contextual Chat (Multi-Turn)

Chat with AI about the content of any webpage in real time. Geminify streams responses token-by-token as they arrive — no waiting for the full answer. The conversation is multi-turn, keeping up to the last **10 exchanges (20 messages)** in session history so the AI remembers what was said earlier. You can stop a response mid-stream at any time with the **Stop** button.

- **Read Page** — one click scrapes the current page's text (and form values) into the context window.
- **+Collect** — stack context from multiple pages before asking a question across all of them (up to 5 pages in the context stack).
- **Clear All** — resets context, input, response, and chat history in one click.

---

### 2. ✂️ Inline Selection Toolbar

Highlight any text on a page while **Reading Mode** is active and a mini floating toolbar pops up above your selection with four instant actions:

| Action        | What it does                                    |
| ------------- | ----------------------------------------------- |
| **Explain**   | Explains the selected text in simple terms      |
| **Fix Text**  | Corrects grammar, spelling, and punctuation     |
| **Summarize** | Condenses the selection to the key information  |
| **Chat**      | Sends the selected text to the popup as context |

The toolbar auto-dismisses after 5 seconds and can be closed with `Escape`. It won't appear inside editable fields (those are handled by the right-click context menu).

---

### 3. 📋 Prompt Templates

Pre-built and user-defined prompt shortcuts that appear as pill buttons above the chat input. Click any template to instantly pre-fill your question.

**Built-in templates:**

| Template       | Prompt                                                      |
| -------------- | ----------------------------------------------------------- |
| **Explain**    | Explain this page clearly and simply                        |
| **Summarize**  | Structured summary: What is this / Key Points / My Takeaway |
| **Key Points** | Top 5 most important points as bullet points                |
| **Timeline**   | Extract all dates, events, and deadlines chronologically    |
| **Quiz Me**    | Generate 5 quiz questions to test understanding             |
| **Critique**   | Balanced critique: strengths and weaknesses                 |

**Custom templates:** Type any prompt in the input field and click **＋ Save** to name and save it as your own template. Custom templates are synced across devices and can be deleted from **Settings → Prompt Templates**.

---

### 4. 🖼️ Multimodal Attachments (Screenshots & PDFs)

Send visual or document context alongside your message:

- **Screenshot** — captures the current tab as a PNG and attaches it to your next message. Works with all AI providers.
- **PDF** — attach a local PDF file for analysis. PDF support depends on the provider: available with **Google Gemini** and **OpenRouter** models that declare file input support. Built-in AI shows a note when PDFs cannot be read natively.

Attachments are cleared automatically after each message is sent.

---

### 5. 📖 Reading Mode

Activate a full-page reading companion sidebar via **right-click → Geminify Actions → Reading Mode** (or press `Escape` to exit). The sidebar slides in from the right and includes:

- **AI Page Summary** — automatically generates a TL;DR, key takeaways, and an open question about the current page (powered by whichever AI provider you have configured).
- **Skeleton loading animation** while the summary generates.
- **Inline text selection toolbar** — selecting any text on the page while Reading Mode is on shows the floating action toolbar (see Feature 2 above).
- Smooth slide-in animation and a close button (or `Escape` to dismiss).

---

### 6. ✍️ Right-Click Text Refinement

Right-click any **editable field** (input, textarea, content-editable) to access **Geminify Actions → Refine and Correct** with five tone options:

| Option                        | What it does                                           |
| ----------------------------- | ------------------------------------------------------ |
| **Grammar and Spelling Only** | Fixes errors, outputs corrected text                   |
| **Make Professional**         | Rewrites for a polished, professional tone             |
| **Make Concise**              | Shortens while keeping core information                |
| **Make Friendly**             | Rewrites with a warm, approachable tone                |
| **Use Custom Rules**          | Uses your saved custom refinement prompt from Settings |

Results appear in a floating **draggable response box** pinned near the active element, with a **Copy** button.

---

### 7. 📚 My Pages Library

Save and organize AI summaries of pages you visit into a searchable library (up to **40 pages**).

- **Auto-categorize** — pages are automatically tagged by URL pattern: `Dev`, `Social`, `News`, `Media`, `Search`, `Insight`.
- **Custom categories** — define your own keyword-based category rules in Settings.
- **Re-categorize** — change a page's category directly from the library card via a dropdown.
- **Search** — filter the library by title or summary text in real time.
- **Filter by category** — tab buttons filter to a specific category.
- **Delete** — remove individual entries.
- **Export / Import** — download your library as a JSON file or import a previously exported file for backup and migration.

**Saving a page:** Right-click → Geminify Actions → **Summarize and Save Page**. Uses AI by default; enable **Save Locally (No AI)** in Settings to save a heuristic summary without spending tokens.

---

### 8. 🖥️ Browser Automation via AI Commands

The AI can issue built-in action commands that Geminify will execute automatically after a response is received:

| Command                    | Effect                                                     |
| -------------------------- | ---------------------------------------------------------- |
| `[SEARCH: "query"]`        | Opens a Google search in a new tab                         |
| `[GOTO: "url"]`            | Navigates the current tab to the URL                       |
| `[SCROLL: "up/down"]`      | Scrolls the page (supports "every Xs/min" for auto-scroll) |
| `[CLICK: "selector"]`      | Clicks a DOM element matching the CSS selector             |
| `[TYPE: "selector\|text"]` | Types text into a matching input field                     |
| `[NOTIFY: "message"]`      | Shows a Chrome system notification                         |

Auto-scroll shows a floating **capsule** at the bottom of the page with a live indicator and a **STOP** button.

---

### 9. ⚙️ Settings & Configuration

#### AI Provider Selection

Switch between three providers from the Settings tab:

| Provider          | Description                                                                      |
| ----------------- | -------------------------------------------------------------------------------- |
| **Built-in AI**   | On-device Gemini Nano via Chrome's Prompt API — fully private, no API key needed |
| **Google Gemini** | Cloud access via Google AI Studio API key (uses `gemini-flash-latest`)           |
| **OpenRouter**    | Access to hundreds of multimodal models (Claude, Llama, Mistral, and more)       |

#### Other Settings

| Setting                      | Description                                                        |
| ---------------------------- | ------------------------------------------------------------------ |
| **Free Tier Optimization**   | Reduces context window to 4,000 chars and forces shorter responses |
| **Save Locally (No AI)**     | Saves page snapshots using heuristics instead of AI tokens         |
| **Auto-Copy to Clipboard**   | Automatically copies each AI response after streaming completes    |
| **Dark Mode**                | Switches the popup to a dark theme                                 |
| **Default Refine Rules**     | Custom prompt used by the "Use Custom Rules" refinement option     |
| **Prompt Templates Manager** | View all templates; delete custom ones                             |

All settings are synced via `chrome.storage.sync` and persist across sessions and devices.

---

### 10. 🌐 Chrome Built-in AI Support (On-Device, Private)

Geminify natively integrates with Chrome's experimental **Prompt API** (`window.ai.languageModel` / `window.LanguageModel`), letting you run AI entirely on-device with no API key or internet connection for inference. Supports text and image inputs.

- Automatically detects availability on startup.
- If the model needs to be downloaded, triggers the download in the background (via the service worker) and shows a **live progress bar** in Settings.
- Supports the latest proposed standard (`window.LanguageModel`) as well as the earlier `window.ai.languageModel` API.

**To enable Built-in AI (requires Chrome 131+):**

1. Navigate to `chrome://flags/#prompt-api-for-gemini-nano` → set to **Enabled**
2. Navigate to `chrome://flags/#optimization-guide-on-device-model` → set to **Enabled BypassPerfRequirement**
3. Restart Chrome
4. Go to `chrome://components` and update **Optimization Guide On Device Model**

---

## 🛠️ Installation (Developer Mode)

```bash
# 1. Clone the repository
git clone https://github.com/Hulmify/Geminify-by-Hulmify.git
cd Geminify-by-Hulmify

# 2. Install dependencies
npm install

# 3. Build the extension
npm run build
```

Then load the extension:

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder

For active development with hot-reloading of the build:

```bash
npm run dev   # or: npm run watch
```

---

## 🏗️ Project Structure

```
ext.geminify/
├── src/
│   ├── background/
│   │   └── background.js      # Service worker: context menus, tab capture, local AI download
│   ├── content/
│   │   └── content.js         # Content script: toolbar, reading mode, refinement, automation
│   └── ui/
│       ├── popup.html         # Extension popup shell
│       ├── popup.jsx          # React app: chat, library, settings
│       └── styles.css         # Popup UI styles
├── assets/
│   └── icons/                 # Extension icons (16, 32, 48, 128px)
├── manifest.json              # Chrome extension manifest v3
├── webpack.config.js          # Build configuration
└── package.json
```

---

## 💻 Tech Stack

| Layer                  | Technology                                                                  |
| ---------------------- | --------------------------------------------------------------------------- |
| **UI Framework**       | React 19                                                                    |
| **Markdown Rendering** | marked                                                                      |
| **Bundler**            | Webpack 5                                                                   |
| **Transpiler**         | Babel (preset-env + preset-react)                                           |
| **AI — On-device**     | Chrome Prompt API (Gemini Nano)                                             |
| **AI — Cloud**         | Google Generative Language API (`gemini-flash-latest`)                      |
| **AI — Gateway**       | OpenRouter API (OpenAI-compatible, multimodal models)                       |
| **Storage**            | `chrome.storage.sync` (settings) + `chrome.storage.local` (library/history) |

---

## 🔑 API Keys

| Provider      | Where to get the key                                                      |
| ------------- | ------------------------------------------------------------------------- |
| Google Gemini | [Google AI Studio](https://aistudio.google.com/) — free tier available    |
| OpenRouter    | [openrouter.ai](https://openrouter.ai/) — pay-per-token, many free models |
| Built-in AI   | No key needed — Chrome handles it locally                                 |

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

_Geminify is an **unofficial** extension and is not affiliated with or endorsed by Google._  
_Built with ❤️ by [Hulmify](https://hulmify.com)_

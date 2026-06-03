import { marked } from "marked";

// ─────────────────────────────────────────────
// SECTION 1: FLOATING RESPONSE BOX
// ─────────────────────────────────────────────

/**
 * Creates and displays a floating response box near the active element.
 *
 * @param {HTMLElement} element - The target element to position the box near.
 * @param {string} text - The content (markdown) to display in the box.
 * @param {Object} options - Configuration options (e.g., custom title).
 */
function addBox(element, text, options = {}) {
  document.getElementById("geminify-box")?.remove();

  const SPACING = 16;
  const MAX_HEIGHT = 224;
  const rect = element.getBoundingClientRect();
  const topPosition = rect.top + element.clientHeight + SPACING;

  const box = document.createElement("div");
  box.id = "geminify-box";
  box.style.position = "fixed";
  box.style.left = `${Math.min(rect.left + window.scrollX, window.innerWidth - 360)}px`;
  box.style.width = `${Math.min(element.clientWidth, 480)}px`;

  if (topPosition + MAX_HEIGHT < window.innerHeight) {
    box.style.top = `${topPosition}px`;
  } else {
    box.style.bottom = `${SPACING}px`;
  }
  box.style.maxHeight = `${MAX_HEIGHT}px`;

  const closeButton = document.createElement("button");
  closeButton.id = "geminify-close-button";
  closeButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  closeButton.addEventListener("click", () => box.remove());
  box.appendChild(closeButton);

  const heading = document.createElement("h6");
  heading.innerText = options.title || "Geminify Response";
  box.appendChild(heading);

  const contentElement = document.createElement("div");
  contentElement.className = "geminify-content";
  contentElement.innerHTML = marked.parse(text);
  box.appendChild(contentElement);

  const innerDiv = document.createElement("div");
  innerDiv.className = "geminify-footer";
  box.appendChild(innerDiv);

  const copyButton = document.createElement("button");
  copyButton.id = "geminify-copy-button";
  const copySvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
  const checkSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  copyButton.innerHTML = `${copySvg} Copy`;
  innerDiv.appendChild(copyButton);

  copyButton.addEventListener("click", () => {
    navigator.clipboard.writeText(text);
    copyButton.innerHTML = `${checkSvg} Copied!`;
    setTimeout(() => { copyButton.innerHTML = `${copySvg} Copy`; }, 2000);
  });

  document.body.appendChild(box);
  box.focus();
}

// ─────────────────────────────────────────────
// SECTION 2: STYLES
// ─────────────────────────────────────────────

/**
 * Injects all required CSS for Geminify overlays into the page head.
 * Includes: response box, inline toolbar, and reading mode sidebar.
 */
function addStyles() {
  if (document.getElementById("geminify-styles")) return;

  const style = document.createElement("style");
  style.id = "geminify-styles";
  style.innerHTML = `
    /* ── Response Box ── */
    #geminify-box {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #1e293b;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
      font-size: 14px;
      line-height: 1.6;
      padding: 16px 20px;
      position: fixed;
      z-index: 2147483647;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 480px;
      min-width: 320px;
    }
    #geminify-box h6 { color: #4896bf; margin: 0; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
    .geminify-content { margin: 0 !important; color: #334155; max-height: 250px; overflow-y: auto; font-size: 0.9rem; }
    .geminify-content p { margin-bottom: 8px !important; }
    .geminify-footer { display: flex; justify-content: flex-end; margin-top: 4px; gap: 8px; }
    #geminify-box button#geminify-copy-button { display: inline-flex; align-items: center; justify-content: center; gap: 5px; padding: 5px 12px; color: #4896bf!important; background: transparent!important; border: 1px solid #e2e8f0!important; border-radius: 6px!important; cursor: pointer!important; font-size: 12px!important; font-weight: 600!important; font-family: inherit; transition: all 0.15s ease; }
    #geminify-box button#geminify-copy-button:hover { background: #f0f9ff!important; border-color: #bae6fd!important; }
    #geminify-box button#geminify-close-button { display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: #94a3b8; cursor: pointer; position: absolute; right: 10px; top: 10px; height: 28px; width: 28px; transition: all 0.2s ease; border-radius: 6px; }
    #geminify-box button#geminify-close-button:hover { background: #f1f5f9; color: #475569; }

    /* ── Inline Toolbar ── */
    #geminify-toolbar {
      position: fixed;
      background: #1e293b;
      color: white;
      border-radius: 10px;
      padding: 5px 6px;
      display: flex;
      gap: 3px;
      z-index: 2147483647;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.15);
      animation: geminifyToolbarIn 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes geminifyToolbarIn {
      from { opacity: 0; transform: translateY(6px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0)  scale(1); }
    }
    #geminify-toolbar::after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-top-color: #1e293b;
      border-bottom: none;
    }
    .geminify-toolbar-btn {
      background: rgba(255,255,255,0.08);
      border: none;
      color: #f8fafc;
      padding: 5px 10px;
      border-radius: 7px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      font-family: 'Inter', system-ui, sans-serif;
      transition: background 0.15s ease;
      white-space: nowrap;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
    }
    .geminify-toolbar-btn svg { flex-shrink: 0; }
    .geminify-toolbar-btn:hover { background: rgba(255,255,255,0.18); }
    .geminify-toolbar-btn:active { transform: scale(0.97); }

    /* ── Reading Mode Sidebar ── */
    #geminify-reading-sidebar {
      position: fixed;
      top: 0;
      right: 0;
      width: 380px;
      height: 100vh;
      background: #ffffff;
      border-left: 1px solid #e2e8f0;
      box-shadow: -8px 0 32px rgba(0,0,0,0.12);
      z-index: 2147483646;
      display: flex;
      flex-direction: column;
      font-family: 'Inter', system-ui, sans-serif;
      animation: geminifySidebarIn 0.3s cubic-bezier(0.22, 1, 0.36, 1);
      overflow: hidden;
    }
    @keyframes geminifySidebarIn {
      from { transform: translateX(100%); opacity: 0.5; }
      to   { transform: translateX(0);    opacity: 1; }
    }
    #geminify-reading-header {
      padding: 16px 20px;
      background: linear-gradient(135deg, #4896bf 0%, #3b82f6 100%);
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    #geminify-reading-header h5 {
      margin: 0;
      font-size: 0.8rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    #geminify-reading-close {
      background: rgba(255,255,255,0.15);
      border: none;
      color: white;
      cursor: pointer;
      width: 28px;
      height: 28px;
      border-radius: 7px;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    #geminify-reading-close:hover { background: rgba(255,255,255,0.25); }
    #geminify-reading-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    #geminify-reading-body::-webkit-scrollbar { width: 5px; }
    #geminify-reading-body::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .geminify-reading-section-label {
      font-size: 0.6rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #94a3b8;
      margin-bottom: 6px;
    }
    .geminify-reading-summary {
      font-size: 0.875rem;
      line-height: 1.7;
      color: #334155;
    }
    .geminify-reading-summary p { margin-bottom: 8px; }
    .geminify-reading-summary ul { padding-left: 16px; }
    .geminify-reading-summary li { margin-bottom: 4px; }
    .geminify-reading-summary h1,
    .geminify-reading-summary h2,
    .geminify-reading-summary h3 { font-size: 0.9rem; margin: 10px 0 5px; color: #1e293b; }
    .geminify-reading-hint {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 10px;
      padding: 10px 14px;
      font-size: 0.78rem;
      color: #0369a1;
      line-height: 1.5;
    }
    .geminify-reading-skeleton {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .geminify-skeleton-line {
      height: 12px;
      border-radius: 6px;
      background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
      background-size: 200% 100%;
      animation: geminifyShimmer 1.4s infinite;
    }
    @keyframes geminifyShimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .geminify-reading-footer {
      padding: 12px 20px;
      border-top: 1px solid #f1f5f9;
      font-size: 0.7rem;
      color: #94a3b8;
      text-align: center;
      flex-shrink: 0;
    }

    /* ── Page paragraph highlight in Reading Mode ── */
    .geminify-para-highlight {
      cursor: pointer;
      transition: background 0.2s ease, border-radius 0.2s ease;
      border-radius: 4px;
      padding: 2px 4px;
      margin: -2px -4px;
    }
    .geminify-para-highlight:hover {
      background: rgba(72, 150, 191, 0.08) !important;
      outline: 1px dashed rgba(72, 150, 191, 0.3);
    }

    /* ── Automation capsule ── */
    @keyframes capsuleFadeIn { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
    @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }
  `;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────────
// SECTION 3: GEMINI API HELPER
// ─────────────────────────────────────────────

/**
 * Generic helper to call the Gemini API (non-streaming).
 *
 * @param {string} prompt - The prompt to send.
 * @param {string} apiKey - Google API Key.
 * @param {string} model  - Target model ID.
 * @returns {Promise<string>} The response text.
 */
/**
 * Generic helper to call the configured AI provider (non-streaming).
 * Reads aiProvider + keys from storage data object passed by caller.
 *
 * @param {string} prompt   - The prompt to send.
 * @param {string} apiKey   - Google API Key (used when provider is "gemini").
 * @param {Object} [opts]   - Optional: { aiProvider, openrouterApiKey }
 * @returns {Promise<string>} The response text.
 */
const callAI = async (prompt, apiKey, opts = {}) => {
  const provider = opts.aiProvider || "windowai";

  if (provider === "windowai") {
    let availableStatus = "unavailable";
    const aiOptions = { 
      expectedInputs: [{ type: "text", languages: ["en"] }, { type: "image" }],
      expectedOutputs: [{ type: "text", languages: ["en"] }] 
    };
    
    if (window.ai && window.ai.languageModel) {
      const capabilities = await window.ai.languageModel.capabilities(aiOptions);
      availableStatus = capabilities.available;
    } else if (window.LanguageModel) {
      availableStatus = await window.LanguageModel.availability(aiOptions);
    } else {
      throw new Error("Chrome Built-in AI is not available. Please enable it in Settings.");
    }
    
    if (availableStatus === "no" || availableStatus === "unavailable") {
      throw new Error("Chrome Built-in AI is disabled or unsupported. Please check Settings.");
    }
    
    try {
      const aiOptions = {
        expectedInputs: [{ type: "text", languages: ["en"] }, { type: "image" }],
        expectedOutputs: [{ type: "text", languages: ["en"] }]
      };
      const session = (window.ai && window.ai.languageModel) ? 
        await window.ai.languageModel.create(aiOptions) : 
        await window.LanguageModel.create(aiOptions);
        
      const result = await session.prompt(prompt);
      session.destroy();
      return result || "No response.";
    } catch (err) {
      throw new Error(`Chrome AI Error: ${err.message}`);
    }
  }

  if (provider === "openrouter") {
    const orKey = opts.openrouterApiKey || "";
      
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${orKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://hulmify.com",
        "X-Title": "Geminify by Hulmify",
      },
      body: JSON.stringify({
        model: opts.openrouterModel,
        messages: [{ role: "user", content: prompt }],
        stream: false,
      }),
    });
    if (!response.ok) throw new Error("OpenRouter API request failed");
    const data = await response.json();
    return data?.choices?.[0]?.message?.content || "No response.";
  }

  // Default: Google Gemini
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!response.ok) throw new Error("API request failed");
  const data = await response.json();
  return data?.candidates[0]?.content?.parts[0]?.text || "No response.";
};

// Keep backward-compatible alias used internally
const callGemini = (prompt, apiKey) => callAI(prompt, apiKey);

// ─────────────────────────────────────────────
// SECTION 4: PAGE CATEGORIZATION & SAVING
// ─────────────────────────────────────────────

/**
 * Heuristic to categorize a page based on its URL for library filtering.
 */
function getCategoryForUrl(url, customCategories = []) {
  const lowUrl = url.toLowerCase();

  for (const cat of customCategories) {
    if (cat.keywords.some(kw => lowUrl.includes(kw.toLowerCase()))) {
      return cat.name;
    }
  }

  if (lowUrl.includes("google.com/search")) return "Search";
  if (lowUrl.includes("github.com") || lowUrl.includes("stackoverflow") || lowUrl.includes("docs.")) return "Dev";
  if (lowUrl.includes("youtube.com") || lowUrl.includes("netflix.com")) return "Media";
  if (lowUrl.includes("twitter.com") || lowUrl.includes("linkedin.com") || lowUrl.includes("facebook.com")) return "Social";
  if (lowUrl.includes("news.") || lowUrl.includes("cnn.com") || lowUrl.includes("bbc.")) return "News";

  return "Insight";
}

/**
 * Persists a page summary to local storage.
 */
function saveSummaryToStorage(summary) {
  chrome.storage.sync.get(["customCategories"], (syncData) => {
    chrome.storage.local.get({ savedPages: [] }, (localData) => {
      const newPage = {
        url: window.location.href,
        title: document.title,
        summary,
        category: getCategoryForUrl(window.location.href, syncData.customCategories || []),
        timestamp: Date.now()
      };
      chrome.storage.local.set({ savedPages: [newPage, ...localData.savedPages].slice(0, 40) });
    });
  });
}

/**
 * Extracts a heuristic summary from the page without using an LLM.
 */
function extractLocalSummary() {
  const metaDesc = document.querySelector('meta[name="description"]')?.content ||
    document.querySelector('meta[property="og:description"]')?.content || "";

  const mainContent = document.querySelector("article") || document.querySelector("main") || document.body;
  const rawText = mainContent.innerText.substring(0, 1000).replace(/\s+/g, " ").trim();
  const snippet = rawText.substring(0, 400) + (rawText.length > 400 ? "..." : "");

  const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
    .slice(0, 4)
    .map(h => `- ${h.innerText.trim()}`)
    .filter(t => t.length > 4)
    .join("\n");

  let text = `### Insight Overview\n\n`;
  if (metaDesc) text += `**Description:** ${metaDesc}\n\n`;
  if (headings) text += `**Structural Highlights:**\n${headings}\n\n`;
  text += `**Detailed Preview:**\n${snippet}`;

  return text;
}

// ─────────────────────────────────────────────
// SECTION 5: INLINE SELECTION TOOLBAR (Feature 2)
// ─────────────────────────────────────────────

let toolbarDismissTimer = null;

/**
 * Displays a floating action toolbar above the user's text selection.
 * @param {Selection} selection
 */
function showToolbar(selection) {
  document.getElementById("geminify-toolbar")?.remove();
  clearTimeout(toolbarDismissTimer);

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  const selectedText = selection.toString().trim();

  const toolbar = document.createElement("div");
  toolbar.id = "geminify-toolbar";

  // Position above selection, centred, with viewport clamping
  // Position above selection, horizontally centered with selection bounds
  const leftRaw = rect.left + rect.width / 2;
  const top = Math.max(8, rect.top - 48);

  toolbar.style.left = `${leftRaw}px`;
  toolbar.style.top = `${top}px`;
  toolbar.style.transform = `translateX(-50%)`;
  toolbar.style.width = `max-content`;
  toolbar.style.maxWidth = `${window.innerWidth - 16}px`;
  toolbar.style.justifyContent = "center";

  const actions = [
    { label: "Explain",   tone: "explain", svg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5Z"/></svg>` },
    { label: "Fix Text",  tone: "grammar", svg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>` },
    { label: "Summarize", tone: "concise", svg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>` },
    { label: "Chat",      tone: "chat",    svg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>` },
  ];

  actions.forEach(({ label, tone, svg }) => {
    const btn = document.createElement("button");
    btn.className = "geminify-toolbar-btn";
    btn.innerHTML = `${svg}${label}`;
    btn.addEventListener("mousedown", (e) => {
      e.preventDefault(); // Don't deselect text
      handleToolbarAction(selectedText, tone);
      toolbar.remove();
    });
    toolbar.appendChild(btn);
  });

  document.body.appendChild(toolbar);

  // Auto-dismiss after 5 seconds of inactivity
  toolbarDismissTimer = setTimeout(() => toolbar.remove(), 5000);
}

/**
 * Handles a toolbar action on selected text.
 * 'chat' sends text to the popup; other tones call Gemini inline.
 * @param {string} text
 * @param {string} tone
 */
function handleToolbarAction(text, tone) {
  addStyles();

  if (tone === "chat") {
    chrome.storage.sync.set({ selectedText: text }, () => {
      chrome.runtime.sendMessage({ action: "openPopup" });
    });
    return;
  }

  // Use the focused/body element as anchor for the response box
  const anchor = document.activeElement && document.activeElement !== document.body
    ? document.activeElement
    : document.body;

  addBox(anchor, "Thinking...", { title: "Geminify" });

  chrome.storage.sync.get(["googleApiKey", "refineCustomPrompt", "isFreePlan", "aiProvider", "openrouterApiKey", "openrouterModel"], async (data) => {
    const activeKey = data.aiProvider === "openrouter" ? data.openrouterApiKey : data.aiProvider === "windowai" ? "local" : data.googleApiKey;
    if (!activeKey) {
      addBox(anchor, "No API key set. Open Geminify settings to add your key.");
      return;
    }

    const prompts = {
      explain:      "Explain the following text clearly in simple terms. Be concise.",
      grammar:      "Fix all grammar, spelling, and punctuation errors. Output ONLY the corrected text.",
      concise:      "Summarize the following text as concisely as possible, keeping all key information.",
    };

    const systemPrompt = prompts[tone] || data.refineCustomPrompt || "Improve this text.";
    const freeTierNote = data.isFreePlan ? " (Be extremely concise.)" : "";

    try {
      const result = await callAI(
        `${systemPrompt}${freeTierNote}\n\nText:\n${text}`,
        data.googleApiKey,
        { aiProvider: data.aiProvider, openrouterApiKey: data.openrouterApiKey, openrouterModel: data.openrouterModel }
      );
      addBox(anchor, result, { title: tone === "explain" ? "Explanation" : tone === "grammar" ? "Fixed Text" : "Summary" });
    } catch (err) {
      addBox(anchor, "Error: Could not reach AI provider. Check your API key.");
    }
  });
}

// Listen for mouseup to show the toolbar on text selection
document.addEventListener("mouseup", (e) => {
  // Don't interfere with the Geminify toolbar/box itself
  if (e.target.closest("#geminify-toolbar") || e.target.closest("#geminify-box")) return;
  // Don't show toolbar inside editable fields (refine context menu covers those)
  if (e.target.isContentEditable || ["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;

  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.toString().trim().length < 10) {
    document.getElementById("geminify-toolbar")?.remove();
    return;
  }

  showToolbar(selection);
});

// Dismiss toolbar on click outside or Escape
document.addEventListener("mousedown", (e) => {
  if (!e.target.closest("#geminify-toolbar")) {
    document.getElementById("geminify-toolbar")?.remove();
    clearTimeout(toolbarDismissTimer);
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.getElementById("geminify-toolbar")?.remove();
    document.getElementById("geminify-reading-sidebar")?.remove();
    clearTimeout(toolbarDismissTimer);
    deactivateReadingMode();
  }
});

// ─────────────────────────────────────────────
// SECTION 6: READING MODE (Feature 5)
// ─────────────────────────────────────────────

let readingModeActive = false;
let highlightedParas = [];

/**
 * Activates Reading Mode: injects the sidebar and sets up paragraph click handlers.
 */
async function activateReadingMode() {
  if (readingModeActive) {
    deactivateReadingMode();
    return;
  }

  addStyles();
  readingModeActive = true;

  // ── Build sidebar ──────────────────────────────────
  const sidebar = document.createElement("div");
  sidebar.id = "geminify-reading-sidebar";

  // Header
  const header = document.createElement("div");
  header.id = "geminify-reading-header";
  header.innerHTML = `
    <h5>Geminify Reading Mode</h5>
    <button id="geminify-reading-close">&times;</button>
  `;
  sidebar.appendChild(header);

  // Body
  const body = document.createElement("div");
  body.id = "geminify-reading-body";

  // Hint
  const hint = document.createElement("div");
  hint.className = "geminify-reading-hint";
  hint.innerHTML = `<strong>Tip:</strong> Click any paragraph on the page to ask Gemini about it instantly.`;
  body.appendChild(hint);

  // Summary section
  const summaryLabel = document.createElement("div");
  summaryLabel.className = "geminify-reading-section-label";
  summaryLabel.innerText = "AI Page Summary";
  body.appendChild(summaryLabel);

  const summaryContainer = document.createElement("div");
  summaryContainer.id = "geminify-reading-summary";

  // Loading skeleton
  const skeleton = document.createElement("div");
  skeleton.className = "geminify-reading-skeleton";
  [100, 85, 95, 70, 88, 60].forEach(w => {
    const line = document.createElement("div");
    line.className = "geminify-skeleton-line";
    line.style.width = `${w}%`;
    skeleton.appendChild(line);
  });
  summaryContainer.appendChild(skeleton);
  body.appendChild(summaryContainer);

  sidebar.appendChild(body);

  // Footer
  const footer = document.createElement("div");
  footer.className = "geminify-reading-footer";
  footer.innerText = `Geminify by Hulmify`;
  sidebar.appendChild(footer);

  document.body.appendChild(sidebar);

  // Close button
  document.getElementById("geminify-reading-close").addEventListener("click", deactivateReadingMode);

  // ── Highlight paragraphs ──────────────────────────
  const article = document.querySelector("article, [role='main'], main") || document.body;
  const paragraphs = Array.from(article.querySelectorAll("p, h2, h3, li"))
    .filter(el => el.innerText && el.innerText.trim().length > 60 && !el.closest("#geminify-reading-sidebar"));

  paragraphs.forEach(para => {
    para.classList.add("geminify-para-highlight");
    const onClick = () => handleParagraphClick(para);
    para.addEventListener("click", onClick);
    highlightedParas.push({ el: para, handler: onClick });
  });

  // ── Generate AI summary ───────────────────────────
  chrome.storage.sync.get(["googleApiKey", "isFreePlan", "aiProvider", "openrouterApiKey", "openrouterModel"], async (data) => {
    const summaryEl = document.getElementById("geminify-reading-summary");
    if (!summaryEl) return;

    const activeKey = data.aiProvider === "openrouter" ? data.openrouterApiKey : data.aiProvider === "windowai" ? "local" : data.googleApiKey;
    if (!activeKey) {
      summaryEl.innerHTML = `<p style="color:#94a3b8;font-size:0.8rem;">Set your API key in Geminify settings to generate AI summaries.</p>`;
      return;
    }

    try {
      const limit = data.isFreePlan ? 3000 : 8000;
      const pageText = (document.querySelector("article, main") || document.body).innerText.substring(0, limit);
      const brevity = data.isFreePlan
        ? "Provide a TL;DR (1 sentence) and 3 bullet points."
        : "Provide: 1) TL;DR (2 sentences), 2) Key Takeaways (4-5 bullets), 3) One open question.";

      const summary = await callAI(
        `You are a reading assistant. Analyze this page and ${brevity}\n\nURL: ${window.location.href}\nTitle: ${document.title}\n\nContent:\n${pageText}`,
        data.googleApiKey,
        { aiProvider: data.aiProvider, openrouterApiKey: data.openrouterApiKey, openrouterModel: data.openrouterModel }
      );

      if (document.getElementById("geminify-reading-summary")) {
        const div = document.createElement("div");
        div.className = "geminify-reading-summary";
        div.innerHTML = marked.parse(summary);
        summaryEl.innerHTML = "";
        summaryEl.appendChild(div);
      }
    } catch (err) {
      if (document.getElementById("geminify-reading-summary")) {
        document.getElementById("geminify-reading-summary").innerHTML =
          `<p style="color:#f43f5e;font-size:0.8rem;">Summary failed. ${err.message}</p>`;
      }
    }
  });
}

/**
 * Handles a paragraph click in reading mode — shows an inline Q&A box.
 * @param {HTMLElement} para
 */
function handleParagraphClick(para) {
  const paraText = para.innerText.trim().substring(0, 600);
  addBox(para, "Analysing paragraph...", { title: "Paragraph Insight" });

  chrome.storage.sync.get(["googleApiKey", "isFreePlan", "aiProvider", "openrouterApiKey", "openrouterModel"], async (data) => {
    const activeKey = data.aiProvider === "openrouter" ? data.openrouterApiKey : data.aiProvider === "windowai" ? "local" : data.googleApiKey;
    if (!activeKey) {
      addBox(para, "No API key set.");
      return;
    }

    try {
      const result = await callAI(
        `Explain this paragraph clearly and highlight any key insight, claim, or implication in 2-3 sentences:\n\n"${paraText}"`,
        data.googleApiKey,
        { aiProvider: data.aiProvider, openrouterApiKey: data.openrouterApiKey, openrouterModel: data.openrouterModel }
      );
      addBox(para, result, { title: "Paragraph Insight" });
    } catch {
      addBox(para, "Could not analyse paragraph.");
    }
  });
}

/**
 * Deactivates Reading Mode: removes the sidebar and cleans up paragraph highlights.
 */
function deactivateReadingMode() {
  document.getElementById("geminify-reading-sidebar")?.remove();
  highlightedParas.forEach(({ el, handler }) => {
    el.removeEventListener("click", handler);
    el.classList.remove("geminify-para-highlight");
  });
  highlightedParas = [];
  readingModeActive = false;
}

// ─────────────────────────────────────────────
// SECTION 7: MESSAGE LISTENER
// ─────────────────────────────────────────────

/**
 * Main listener for messages from the background script.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // --- ACTION: Refine Text ---
  if (message.action === "refineText") {
    const element = document.activeElement;
    const originalText = (message.text || element.value || element.innerText || "").trim();
    if (!originalText) return;

    addStyles();
    addBox(element, "Thinking...");

    chrome.storage.sync.get(["googleApiKey", "refineCustomPrompt", "isFreePlan", "aiProvider", "openrouterApiKey", "openrouterModel"], async (data) => {
      const activeKey = data.aiProvider === "openrouter" ? data.openrouterApiKey : data.aiProvider === "windowai" ? "local" : data.googleApiKey;
      if (!activeKey) {
        addBox(element, "API Key missing. Set it in Geminify Settings.");
        return;
      }

      let systemPrompt = "";
      switch (message.tone) {
        case "grammar":      systemPrompt = "Fix grammar, spelling, and punctuation. Output ONLY the corrected text."; break;
        case "professional": systemPrompt = "Rewrite to be professional and polished. Output ONLY the refined text."; break;
        case "concise":      systemPrompt = "Make as concise as possible while keeping core info. Output ONLY the shortened text."; break;
        case "friendly":     systemPrompt = "Rewrite to be friendly and warm. Output ONLY the refined text."; break;
        case "custom":       systemPrompt = data.refineCustomPrompt || "Refine text for clarity."; break;
        default:             systemPrompt = "Fix grammar and improve flow. Output ONLY the corrected text.";
      }

      try {
        const freeTierNote = data.isFreePlan ? " (Be extremely concise.)" : "";
        const refined = await callAI(
          `${systemPrompt}${freeTierNote}\n\nText: ${originalText}`,
          data.googleApiKey,
          { aiProvider: data.aiProvider, openrouterApiKey: data.openrouterApiKey, openrouterModel: data.openrouterModel }
        );
        addBox(element, refined, { title: "Refined Text" });
      } catch {
        addBox(element, "Error: Could not reach AI provider. Check your API key.");
      }
    });

  // --- ACTION: Auto Summarize Page ---
  } else if (message.action === "autoSummarize") {
    addStyles();

    const floatingStatus = document.createElement("div");
    floatingStatus.style.cssText = "position:fixed;top:20px;right:20px;padding:10px 20px;background:#4896bf;color:white;border-radius:10px;z-index:2147483645;font-family:sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.2);";
    floatingStatus.innerText = "Summarizing Page...";
    document.body.appendChild(floatingStatus);

    chrome.storage.sync.get(["googleApiKey", "isFreePlan", "useAiSummaries", "aiProvider", "openrouterApiKey", "openrouterModel"], async (data) => {
      if (data.useAiSummaries === false) {
        const localSummary = extractLocalSummary();
        saveSummaryToStorage(localSummary);
        floatingStatus.innerText = "Page Saved!";
        setTimeout(() => floatingStatus.remove(), 2000);
        return;
      }

      const activeKey = data.aiProvider === "openrouter" ? data.openrouterApiKey : data.aiProvider === "windowai" ? "local" : data.googleApiKey;
      if (!activeKey) {
        floatingStatus.innerText = "Set API Key first";
        setTimeout(() => floatingStatus.remove(), 3000);
        return;
      }

      try {
        const limit = data.isFreePlan ? 3500 : 10000;
        const pageText = document.body.innerText.substring(0, limit);
        const brevity = data.isFreePlan ? " Provide 2-3 extremely concise bullet points max." : " Provide 3-5 concise bullet points.";

        const summary = await callAI(
          `Summarize the following webpage content professionally.${brevity} Provide a title first.\n\nURL: ${window.location.href}\nTitle: ${document.title}\n\nContent:\n${pageText}`,
          data.googleApiKey,
          { aiProvider: data.aiProvider, openrouterApiKey: data.openrouterApiKey, openrouterModel: data.openrouterModel }
        );
        saveSummaryToStorage(summary);
        floatingStatus.innerText = "Page Saved!";
        setTimeout(() => floatingStatus.remove(), 2000);
      } catch {
        floatingStatus.innerText = "Summary Failed.";
        setTimeout(() => floatingStatus.remove(), 3000);
      }
    });

  // --- ACTION: Activate Reading Mode ---
  } else if (message.action === "activateReadingMode") {
    activateReadingMode();

  // --- ACTION: Perform Browser Automation ---
  } else if (message.action === "performAction") {
    const { type, value } = message;

    if (window._geminifyInterval) {
      clearInterval(window._geminifyInterval);
      window._geminifyInterval = null;
    }
    document.getElementById("geminify-automation-capsule")?.remove();

    try {
      if (type === "SCROLL") {
        const isEvery = value.toLowerCase().includes("every");
        const direction = value.toLowerCase().includes("up") ? "up" : "down";

        const doScroll = () => {
          window.scrollBy({ top: direction === "down" ? 500 : -500, behavior: "smooth" });
        };

        if (isEvery) {
          const timeMatch = value.match(/(\d+)\s*(s|sec|min|minute|second)/i);
          const amount = timeMatch ? parseInt(timeMatch[1]) : 1;
          const unit = timeMatch ? timeMatch[2].toLowerCase() : "min";
          const intervalMs = unit.startsWith("s") ? amount * 1000 : amount * 60 * 1000;

          doScroll();
          window._geminifyInterval = setInterval(doScroll, intervalMs);

          const capsule = document.createElement("div");
          capsule.id = "geminify-automation-capsule";
          capsule.style.cssText = `
            position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
            background:#1e293b; color:#f8fafc; padding:8px 16px; border-radius:100px;
            font-family:'Inter',sans-serif; font-size:13px; font-weight:600;
            display:flex; align-items:center; gap:12px;
            box-shadow:0 10px 25px -5px rgba(0,0,0,0.3); z-index:2147483647;
            animation:capsuleFadeIn 0.3s ease;
          `;
          capsule.innerHTML = `
            <span style="display:flex;align-items:center;gap:6px;">
              <span style="width:8px;height:8px;background:#10b981;border-radius:50%;animation:pulse 1.5s infinite;"></span>
              Scrolling ${direction} every ${amount}${unit.startsWith("s") ? "s" : "m"}
            </span>
            <button id="stop-geminify-automation" style="background:rgba(255,255,255,0.1);border:none;color:white;padding:4px 10px;border-radius:12px;cursor:pointer;font-size:11px;font-weight:700;">STOP</button>
          `;
          addStyles();
          document.body.appendChild(capsule);
          document.getElementById("stop-geminify-automation").onclick = () => {
            clearInterval(window._geminifyInterval);
            capsule.remove();
          };
        } else {
          doScroll();
        }
      } else if (type === "CLICK") {
        const el = document.querySelector(value);
        if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(() => el.click(), 500); }
      } else if (type === "TYPE") {
        const [selector, text] = value.split("|");
        const el = document.querySelector(selector);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.value = text;
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    } catch (e) { console.error("Geminify Action Error:", e); }
  }
});

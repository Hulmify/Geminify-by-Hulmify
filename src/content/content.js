import { marked } from "marked";

function addBox(element, text, options = {}) {
  document.getElementById("geminify-box")?.remove();
  const SPACING = 16;
  const MAX_HEIGHT = 224;
  const rect = element.getBoundingClientRect();
  const topPosition = rect.top + element.clientHeight + SPACING;

  const box = document.createElement("div");
  box.id = "geminify-box";
  box.style.position = "fixed";
  box.style.left = `${rect.left + window.scrollX}px`;
  box.style.width = `${element.clientWidth}px`;

  if (topPosition + MAX_HEIGHT < window.innerHeight) {
    box.style.top = `${topPosition}px`;
  } else {
    box.style.bottom = `${SPACING}px`;
  }
  box.style.maxHeight = `${MAX_HEIGHT}px`;

  const closeButton = document.createElement("button");
  closeButton.id = "geminify-close-button";
  closeButton.innerHTML = "&times;";
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
  copyButton.innerText = "Copy";
  innerDiv.appendChild(copyButton);

  copyButton.addEventListener("click", () => {
    navigator.clipboard.writeText(text);
    copyButton.innerText = "Copied!";
    setTimeout(() => { copyButton.innerText = "Copy"; }, 2000);
  });

  document.body.appendChild(box);
  box.focus();
}

function addStyles() {
  if (document.getElementById("geminify-styles")) return;
  const style = document.createElement("style");
  style.id = "geminify-styles";
  style.innerHTML = `
    #geminify-box {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #1e293b;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
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
    #geminify-box button#geminify-copy-button { padding: 6px 12px; color: #4896bf!important; background: #f8fafc!important; border: 1px solid #e2e8f0!important; border-radius: 6px!important; cursor: pointer!important; font-size: 12px!important; font-weight: 600!important; }
    #geminify-box button#geminify-close-button { display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 18px; position: absolute; right: 10px; top: 10px; height: 24px; width: 24px; transition: all 0.2s ease; }
    #geminify-box button#geminify-close-button:hover { background: #f1f5f9; color: #475569; border-radius: 4px; }
  `;
  document.head.appendChild(style);
}

const callGemini = async (prompt, apiKey, model) => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-flash-latest'}:generateContent?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!response.ok) throw new Error("API request failed");
  const data = await response.json();
  return data?.candidates[0]?.content?.parts[0]?.text || "No response.";
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "refineText") {
    const element = document.activeElement;
    const originalText = (message.text || element.value || element.innerText || "").trim();
    if (!originalText) return;

    addStyles();
    addBox(element, "Thinking...");

    chrome.storage.sync.get(["googleApiKey", "refineCustomPrompt", "selectedModel"], async (data) => {
      if (!data.googleApiKey) {
        addBox(element, "Settings Error: API Key missing.");
        return;
      }

      let systemPrompt = "";
      switch (message.tone) {
        case "grammar":
          systemPrompt = "Act as a world-class editor. Fix grammar, spelling, and punctuation errors in the provided text. Keep the exact same meaning and tone. Output ONLY the corrected text.";
          break;
        case "professional":
          systemPrompt = "Rewrite this text to be professional, polished, and suitable for corporate communication. Fix any linguistic errors. Output ONLY the refined text.";
          break;
        case "concise":
          systemPrompt = "Make the following text as concise as possible while keeping all core information. Remove fluff and fix grammar. Output ONLY the shortened text.";
          break;
        case "friendly":
          systemPrompt = "Rewrite this text to have a friendly, warm, and inviting tone while staying clear and correct. Output ONLY the refined text.";
          break;
        case "custom":
          systemPrompt = data.refineCustomPrompt || "Refine the text based on standard professional clarity.";
          break;
        default:
          systemPrompt = "Fix grammar and improve flow. Output ONLY the corrected text.";
      }

      try {
        const refined = await callGemini(`${systemPrompt}\n\nText: ${originalText}`, data.googleApiKey, data.selectedModel);
        addBox(element, refined, { onCopy: true });
      } catch (err) {
        addBox(element, "Error: Could not reach Gemini. Check your key.");
      }
    });
  } else if (message.action === "autoSummarize") {
    addStyles();
    const floatingStatus = document.createElement("div");
    floatingStatus.style = "position:fixed;top:20px;right:20px;padding:10px 20px;background:#4896bf;color:white;border-radius:10px;z-index:100000;font-family:sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.2);";
    floatingStatus.innerText = "Summarizing Page...";
    document.body.appendChild(floatingStatus);

    chrome.storage.sync.get(["googleApiKey", "selectedModel"], async (data) => {
      if (!data.googleApiKey) {
        floatingStatus.innerText = "Error: Set API Key";
        setTimeout(() => floatingStatus.remove(), 3000);
        return;
      }
      try {
        const pageText = document.body.innerText.substring(0, 10000); // Token efficiency: cap at 10k chars
        const summary = await callGemini(`Summarize the following webpage content professionally in 3-5 concise bullet points. Provide a title first.\n\nURL: ${window.location.href}\nTitle: ${document.title}\n\nContent:\n${pageText}`, data.googleApiKey, data.selectedModel);

        // Save to storage
        chrome.storage.local.get({ savedPages: [] }, (localData) => {
          const newPage = {
            url: window.location.href,
            title: document.title,
            summary: summary,
            timestamp: Date.now()
          };
          chrome.storage.local.set({ savedPages: [newPage, ...localData.savedPages].slice(0, 20) }); // Save last 20
        });

        floatingStatus.innerText = "Page Saved!";
        setTimeout(() => floatingStatus.remove(), 2000);
      } catch (err) {
        floatingStatus.innerText = "Summary Failed.";
        setTimeout(() => floatingStatus.remove(), 3000);
      }
    });
  } else if (message.action === "performAction") {
    const { type, value } = message;
    try {
      if (type === "SCROLL") {
        window.scrollBy({ top: value === "down" ? 500 : -500, behavior: "smooth" });
      } else if (type === "CLICK") {
        const el = document.querySelector(value);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => el.click(), 500);
        }
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

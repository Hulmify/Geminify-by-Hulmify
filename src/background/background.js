/**
 * background.js
 * Geminify by Hulmify
 *
 * Handles context menu creation, interaction events, tab capture,
 * and keyboard command routing for the extension.
 */

/**
 * Initializes and creates the context menu structure for Geminify.
 */
function createMenus() {
  chrome.contextMenus.removeAll(() => {

    // Create the primary parent menu for all Geminify actions
    chrome.contextMenus.create({
      id: "geminifyParent",
      title: "Geminify Actions",
      contexts: ["selection", "editable", "page"],
    });

    // Option to send currently selected text to the popup chat
    chrome.contextMenus.create({
      id: "sendText",
      parentId: "geminifyParent",
      title: "Send to Chat",
      contexts: ["selection"],
    });

    // Sub-menu for text refinement tasks (Grammar, Professional, etc.)
    chrome.contextMenus.create({
      id: "refineSub",
      parentId: "geminifyParent",
      title: "Refine and Correct",
      contexts: ["editable"],
    });

    // Defined tones and refinement options
    const tones = [
      { id: "refine-grammar", title: "Grammar and Spelling Only" },
      { id: "refine-professional", title: "Make Professional" },
      { id: "refine-concise", title: "Make Concise" },
      { id: "refine-friendly", title: "Make Friendly" },
      { id: "refine-custom", title: "Use Custom Rules" },
    ];

    // Dynamically generate sub-menu items for each tone
    tones.forEach((tone) => {
      chrome.contextMenus.create({
        id: tone.id,
        parentId: "refineSub",
        title: tone.title,
        contexts: ["editable"],
      });
    });

    // Action to summarize the entire current webpage and save it to storage
    chrome.contextMenus.create({
      id: "summarizePage",
      parentId: "geminifyParent",
      title: "Summarize and Save Page",
      contexts: ["page"],
    });

    // Action to toggle Reading Mode on the current page
    chrome.contextMenus.create({
      id: "readingMode",
      parentId: "geminifyParent",
      title: "Reading Mode",
      contexts: ["page"],
    });

  });
}

/**
 * Trigger menu creation upon extension installation or update.
 */
chrome.runtime.onInstalled.addListener(() => {
  createMenus();
});

/**
 * Global listener for context menu interactions.
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {

  if (info.menuItemId === "sendText") {
    // Save selected text to storage and open the popup
    chrome.storage.sync.set({ selectedText: info.selectionText }, () => {
      chrome.action.openPopup();
    });

  } else if (info.menuItemId === "summarizePage") {
    // Notify the content script to perform auto-summarization
    chrome.tabs.sendMessage(tab.id, { action: "autoSummarize" });

  } else if (info.menuItemId === "readingMode") {
    // Activate Reading Mode via the content script
    chrome.tabs.sendMessage(tab.id, { action: "activateReadingMode" });

  } else if (info.menuItemId.startsWith("refine-")) {
    const tone = info.menuItemId.replace("refine-", "");
    chrome.tabs.sendMessage(tab.id, {
      action: "refineText",
      tone: tone,
      text: info.selectionText
    });
  }
});

/**
 * Captures the visible tab as a base64-encoded PNG data URL.
 * Used by the popup for screenshot-based multimodal queries.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "captureTab") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ dataUrl });
      }
    });
    return true; // Keep message channel open for async response
  }
  
  if (message.action === "openPopup") {
    chrome.action.openPopup();
  }
  
  if (message.action === "triggerLocalAIDownload") {
    const aiOptions = { 
      expectedInputs: [{ type: "text", languages: ["en"] }, { type: "image" }],
      expectedOutputs: [{ type: "text", languages: ["en"] }] 
    };
    const createOpts = {
      ...aiOptions,
      monitor(m) {
        m.addEventListener("downloadprogress", (e) => {
          chrome.runtime.sendMessage({ 
            action: "downloadProgress", 
            data: { loaded: e.loaded, total: e.total } 
          }).catch(() => {});
        });
      }
    };
    
    (async () => {
      try {
        let dummySession;
        if (self.ai && self.ai.languageModel) {
          dummySession = await self.ai.languageModel.create(createOpts);
        } else if (self.LanguageModel) {
          dummySession = await self.LanguageModel.create(createOpts);
        }
        chrome.runtime.sendMessage({ action: "downloadComplete" }).catch(() => {});
        if (dummySession) dummySession.destroy();
      } catch (err) {
        chrome.runtime.sendMessage({ action: "downloadError" }).catch(() => {});
      }
    })();
    sendResponse({ status: "started" });
  }
});

/**
 * background.js
 * Geminify by Hulmify
 * 
 * Handles context menu creation and interaction events for the extension.
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

    // Sub-menu for text refinement tasks (Grammar, Professionaling, etc.)
    chrome.contextMenus.create({
      id: "refineSub",
      parentId: "geminifyParent",
      title: "Refine & Correct",
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

  } else if (info.menuItemId.startsWith("refine-")) {
    const tone = info.menuItemId.replace("refine-", "");
    chrome.tabs.sendMessage(tab.id, {
      action: "refineText",
      tone: tone,
      text: info.selectionText
    });
  }
});

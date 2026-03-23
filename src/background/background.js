// background.js

function createMenus() {
  chrome.contextMenus.removeAll(() => {
    // Parent Menu
    chrome.contextMenus.create({
      id: "geminifyParent",
      title: "Geminify Actions",
      contexts: ["selection", "editable", "page"],
    });

    // Send selection to popup
    chrome.contextMenus.create({
      id: "sendText",
      parentId: "geminifyParent",
      title: "Send to Chat",
      contexts: ["selection"],
    });

    // Refinement sub-menu
    chrome.contextMenus.create({
      id: "refineSub",
      parentId: "geminifyParent",
      title: "Refine & Correct",
      contexts: ["editable"],
    });

    const tones = [
      { id: "refine-grammar", title: "Grammar and Spelling Only" },
      { id: "refine-professional", title: "Make Professional" },
      { id: "refine-concise", title: "Make Concise" },
      { id: "refine-friendly", title: "Make Friendly" },
      { id: "refine-custom", title: "Use Custom Rules" },
    ];

    tones.forEach((tone) => {
      chrome.contextMenus.create({
        id: tone.id,
        parentId: "refineSub",
        title: tone.title,
        contexts: ["editable"],
      });
    });

    // Page actions
    chrome.contextMenus.create({
      id: "summarizePage",
      parentId: "geminifyParent",
      title: "Summarize and Save Page",
      contexts: ["page"],
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  createMenus();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "sendText") {
    chrome.storage.sync.set({ selectedText: info.selectionText }, () => {
      chrome.action.openPopup();
    });
  } else if (info.menuItemId === "summarizePage") {
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

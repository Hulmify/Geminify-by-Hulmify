// background.js
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "sendText",
    title: "Send to Geminify",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "sendText") {
    // We have the selected text in info.selectionText
    // Store it so popup can retrieve it
    chrome.storage.sync.set({ selectedText: info.selectionText }, () => {
      console.log("Selected text saved to storage:", info.selectionText);
    });
  }
});

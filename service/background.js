// background.js
chrome.runtime.onInstalled.addListener(() => {
  // Add context on right-click
  chrome.contextMenus.create({
    id: "sendText",
    title: "Send to Geminify",
    contexts: ["selection"],
  });

  // Add context on textareas and input fields
  chrome.contextMenus.create({
    id: "refineText",
    title: "Refine text with Geminify",
    contexts: ["editable"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "sendText") {
    // We have the selected text in info.selectionText
    // Store it so popup can retrieve it
    chrome.storage.sync.set({ selectedText: info.selectionText }, () => {
      console.log("Selected text saved to storage:", info.selectionText);
    });

    // Open the popup
    chrome.action.openPopup();
  } else if (info.menuItemId === "refineText") {
    console.log("Refining text:", info);
    chrome.tabs.sendMessage(tab.id, {
      action: "refineText",
      text: info.selectionText,
    });
  }
});

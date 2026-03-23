import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { marked } from "marked";

const NO_CONTEXT_TEXT = "The context is empty. Select some text on the page to provide context.";
const MAX_CONTEXT_CHARS = 12000; // ~3000 tokens for efficiency

const App = () => {
  const [activeTab, setActiveTab] = useState("chat");
  const [selectedText, setSelectedText] = useState(NO_CONTEXT_TEXT);
  const [userInput, setUserInput] = useState("");
  const [response, setResponse] = useState("No response yet.");
  const [googleApiKey, setGoogleApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-flash-latest");
  const [refineCustomPrompt, setRefineCustomPrompt] = useState("");
  const [models, setModels] = useState([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copyStatus, setCopyStatus] = useState("Copy");
  const [savedPages, setSavedPages] = useState([]);

  useEffect(() => {
    chrome.storage.sync.get(
      ["selectedText", "googleApiKey", "refineCustomPrompt", "selectedModel", "response", "userInput"],
      (data) => {
        if (data.selectedText) setSelectedText(data.selectedText.substring(0, MAX_CONTEXT_CHARS));
        if (data.googleApiKey) {
          setGoogleApiKey(data.googleApiKey);
          fetchModels(data.googleApiKey, data.selectedModel);
        }
        if (data.selectedModel) setSelectedModel(data.selectedModel);
        if (data.refineCustomPrompt) setRefineCustomPrompt(data.refineCustomPrompt);
        if (data.response) setResponse(data.response);
        if (data.userInput) setUserInput(data.userInput);
      }
    );

    chrome.storage.local.get({ savedPages: [] }, (data) => setSavedPages(data.savedPages));

    const storageListener = (changes) => {
      if (changes.savedPages) setSavedPages(changes.savedPages.newValue);
      if (changes.selectedText) setSelectedText(changes.selectedText.newValue.substring(0, MAX_CONTEXT_CHARS));
    };
    chrome.storage.onChanged.addListener(storageListener);
    return () => chrome.storage.onChanged.removeListener(storageListener);
  }, []);

  const fetchModels = async (apiKey, currentSelected) => {
    if (!apiKey) return;
    setIsLoadingModels(true);
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (!resp.ok) throw new Error("API call failed");
      const data = await resp.json();
      const filtered = data.models.filter(m => {
        const id = m.name.toLowerCase();
        return (
          id.includes("gemini") &&
          (id.includes("flash") || id.includes("pro")) &&
          !id.includes("preview") &&
          !id.includes("001") &&
          !id.includes("002") &&
          m.supportedGenerationMethods.includes("generateContent")
        );
      });
      setModels(filtered);
    } catch (err) { console.error(err); } finally { setIsLoadingModels(false); }
  };

  const handleSend = async () => {
    if ((!selectedText || selectedText === NO_CONTEXT_TEXT) && !userInput) return;
    if (isSending || !googleApiKey) return;

    setIsSending(true);
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs || tabs.length === 0) {
        setResponse("Error: Could not find active tab.");
        return;
      }
      const tab = tabs[0];
      const currentSelectedText = selectedText === NO_CONTEXT_TEXT ? "" : selectedText;

      const prompt = `Act as Geminify by Hulmify. Efficiently summarize/answer using the provided context. 
        Supported actions: [SEARCH: "query"], [GOTO: "url"], [SCROLL: "up/down"], [CLICK: "selector"], [TYPE: "selector|text"], [NOTIFY: "message"].
        
        URL: ${tab.url}
        Page: ${tab.title}
        Context: ${currentSelectedText}
        User: ${userInput || "Please summarize neatly."}`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { 
          "x-goog-api-key": googleApiKey,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `API error: ${res.status}`);
      }
      const data = await res.json();
      let responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";

      const match = responseText.match(/\[([A-Z]+): "(.*?)"\]/);
      if (match) {
        const action = match[1], val = match[2];
        switch (action) {
          case "SEARCH": chrome.tabs.create({ url: `https://www.google.com/search?q=${encodeURIComponent(val)}` }); responseText = `Searching: ${val}`; break;
          case "GOTO": chrome.tabs.update(tab.id, { url: val }); responseText = `Opening ${val}`; break;
          case "SCROLL": case "CLICK": case "TYPE": chrome.tabs.sendMessage(tab.id, { action: "performAction", type: action, value: val }); responseText = `${action}ing...`; break;
          case "NOTIFY": chrome.notifications.create({ type: "basic", iconUrl: "/icons/icon128.png", title: "Geminify", message: val }); break;
        }
      }

      setResponse(responseText);
      chrome.storage.sync.set({ response: responseText });
    } catch (err) { 
      setResponse(`**Error:** ${err.message}`); 
      console.error("Geminify error:", err);
    } finally { setIsSending(false); }
  };

  const handleDeletePage = (timestamp) => {
    const updated = savedPages.filter(p => p.timestamp !== timestamp);
    chrome.storage.local.set({ savedPages: updated });
  };

  const selectAll = async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        const documentText = document.body.innerText;
        let allValues = "";
        document.querySelectorAll("input, textarea, select").forEach((element) => {
          if (["password", "email", "hidden", "file"].includes(element.type)) return;
          let name = element.name || "";
          let value = element.value || "";
          if (!name) {
            let parentLoopIndex = 0, parentElement = element;
            while (parentLoopIndex < 10) {
              parentElement = parentElement?.parentElement;
              if (!parentElement) break;
              const labelElement = parentElement.querySelector("label");
              if (labelElement) { name = labelElement.innerText; break; }
              parentLoopIndex++;
            }
          }
          if (element.tagName === "SELECT") {
            value = element.options[element.selectedIndex]?.innerText || "";
          }
          allValues += `Name: ${name || element.id || "Unknown"}, Value: ${value || "Empty"}\n`;
        });
        return `${documentText}${allValues ? "\n\n===== Form Values =====\n\n" + allValues : ""}`;
      },
    }, (results) => {
      const text = results && results[0] ? (results[0].result || "") : "";
      if (text) {
        setSelectedText(text.substring(0, MAX_CONTEXT_CHARS));
        chrome.storage.sync.set({ selectedText: text });
      }
    });
  };

  return (
    <div className="app-container">
      <header>
        <div className="header-top">
          <div className="logo-text">GEMINI<span>FY</span></div>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: googleApiKey ? "#10b981" : "#f43f5e" }}></span>
        </div>
        <div className="tabs-nav">
          <button className={`tab-btn ${activeTab === "chat" ? "active" : ""}`} onClick={() => setActiveTab("chat")}>Chat</button>
          <button className={`tab-btn ${activeTab === "pages" ? "active" : ""}`} onClick={() => setActiveTab("pages")}>My Pages</button>
          <button className={`tab-btn ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}>Settings</button>
        </div>
      </header>

      {activeTab === "chat" && (
        <div className="section">
          <div className="card">
            <div className="label-row">
              <label>Page Context</label>
              <div style={{ display: "flex", gap: "10px" }}>
                <a href="#" className="small-link" onClick={selectAll} title="Automatically extract text and form data from the current page">Read Page</a>
                <a href="#" className="small-link" onClick={() => chrome.storage.sync.set({ selectedText: NO_CONTEXT_TEXT })}>Clear</a>
              </div>
            </div>
            <div className="context-box">{selectedText}</div>
          </div>
          <div className="card">
            <label>Ask Gemini</label>
            <textarea placeholder="Ask about this page..." value={userInput} onChange={(e) => { setUserInput(e.target.value); chrome.storage.sync.set({ userInput: e.target.value }); }} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()} />
            <button className="btn-primary" disabled={isSending || !googleApiKey} onClick={handleSend}>{isSending ? "Thinking..." : "Send"}</button>
          </div>
          {response && response !== "No response yet." && (
            <div className="response-card">
              <div className="response-header"><label>AI Response</label><a href="#" className="small-link" onClick={() => { navigator.clipboard.writeText(response); setCopyStatus("Copied!"); setTimeout(() => setCopyStatus("Copy"), 2000); }}>{copyStatus}</a></div>
              <div className="response-content" dangerouslySetInnerHTML={{ __html: marked.parse(response) }} />
            </div>
          )}
        </div>
      )}

      {activeTab === "pages" && (
        <div className="section">
          <label style={{ marginLeft: "4px" }}>Right-click the page to "Summarize and Save"</label>
          {savedPages.length > 0 ? savedPages.map(page => (
            <div className="card" key={page.timestamp} style={{ gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <a href={page.url} target="_blank" className="small-link" style={{ fontSize: "0.9rem", color: "#1e293b", maxWidth: "80%" }}>{page.title}</a>
                <a href="#" className="small-link" style={{ color: "#f43f5e" }} onClick={() => handleDeletePage(page.timestamp)}>Delete</a>
              </div>
              <div className="context-box" style={{ background: "white", border: "none", fontStyle: "normal", padding: "0" }} dangerouslySetInnerHTML={{ __html: marked.parse(page.summary) }} />
            </div>
          )) : <div className="card" style={{ textAlign: "center", fontStyle: "italic", padding: "40px" }}>No saved pages yet.</div>}
        </div>
      )}

      {activeTab === "settings" && (
        <div className="section">
          <div className="card">
            <label>API Setup</label>
            <input type="text" placeholder="Gemini API Key" value={googleApiKey} onChange={(e) => setGoogleApiKey(e.target.value)} />
            <button className="btn-primary" onClick={() => { chrome.storage.sync.set({ googleApiKey }, () => { alert("Saved!"); fetchModels(googleApiKey); }); }}>Save Key</button>
          </div>
          <div className="card">
            <label>Model Configuration</label>
            <select value={selectedModel} onChange={(e) => { setSelectedModel(e.target.value); chrome.storage.sync.set({ selectedModel: e.target.value }); }}>
              {isLoadingModels ? <option>Loading...</option> : models.length > 0 ? models.map(m => (<option key={m.name} value={m.name.split("/").pop()}>{m.displayName || m.name}</option>)) : <option value="gemini-flash-latest">Gemini Flash Latest</option>}
            </select>
          </div>
          <div className="card">
            <label>Default Refine Rules</label>
            <textarea placeholder="e.g. 'Fix grammar and style...'" value={refineCustomPrompt} onChange={(e) => setRefineCustomPrompt(e.target.value)} style={{ minHeight: "60px" }} />
            <button className="btn-primary" onClick={() => { chrome.storage.sync.set({ refineCustomPrompt }, () => alert("Saved!")); }}>Update Rules</button>
          </div>
        </div>
      )}

      <footer>Geminify by Hulmify &bull; Powered by Google Gemini &copy; 2026</footer>
    </div>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);

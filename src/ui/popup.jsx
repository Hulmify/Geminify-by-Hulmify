import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { marked } from "marked";

// --- CONSTANTS ---
const NO_CONTEXT_TEXT = "The context is empty. Select some text on the page to provide context.";
const MAX_CONTEXT_CHARS_DEFAULT = 12000;
const MAX_CONTEXT_CHARS_FREE = 4000;

const App = () => {
  // --- STATE: NAVIGATION ---
  const [activeTab, setActiveTab] = useState("chat");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // --- STATE: CONTENT & INPUT ---
  const [selectedText, setSelectedText] = useState(NO_CONTEXT_TEXT);
  const [userInput, setUserInput] = useState("");
  const [response, setResponse] = useState("No response yet.");
  const [copyStatus, setCopyStatus] = useState("Copy");

  // --- STATE: CONFIGURATION ---
  const [googleApiKey, setGoogleApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-flash-latest");
  const [refineCustomPrompt, setRefineCustomPrompt] = useState("");
  const [isFreePlan, setIsFreePlan] = useState(false);
  const [useAiSummaries, setUseAiSummaries] = useState(false);
  const [autoCopy, setAutoCopy] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [contextStack, setContextStack] = useState([]);
  const [customCategories, setCustomCategories] = useState([
    { name: "Dev", keywords: ["github", "stackoverflow", "docs."] },
    { name: "Social", keywords: ["twitter", "linkedin", "facebook"] },
    { name: "News", keywords: ["news.", "cnn.", "bbc."] },
    { name: "Media", keywords: ["youtube", "netflix"] },
    { name: "Search", keywords: ["google.com/search"] }
  ]);

  // --- STATE: API & PERSISTENCE ---
  const [models, setModels] = useState([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [savedPages, setSavedPages] = useState([]);

  // --- SIDE EFFECTS: INITIALIZATION ---
  useEffect(() => {
    // 1. Sync settings from chrome.storage.sync
    chrome.storage.sync.get(
      ["selectedText", "googleApiKey", "refineCustomPrompt", "selectedModel", "response", "userInput", "isFreePlan", "useAiSummaries", "autoCopy", "isDarkMode", "customCategories", "contextStack"],
      (data) => {
        const maxChars = data.isFreePlan ? MAX_CONTEXT_CHARS_FREE : MAX_CONTEXT_CHARS_DEFAULT;
        if (data.selectedText) setSelectedText(data.selectedText.substring(0, maxChars));
        if (data.googleApiKey) setGoogleApiKey(data.googleApiKey);
        if (data.selectedModel) setSelectedModel(data.selectedModel);
        if (data.refineCustomPrompt) setRefineCustomPrompt(data.refineCustomPrompt);
        if (data.response) setResponse(data.response);
        if (data.userInput) setUserInput(data.userInput);
        if (data.isFreePlan !== undefined) setIsFreePlan(data.isFreePlan);
        setUseAiSummaries(data.useAiSummaries ?? false);
        if (data.autoCopy !== undefined) setAutoCopy(data.autoCopy);
        if (data.isDarkMode !== undefined) setIsDarkMode(data.isDarkMode);
        if (data.customCategories) setCustomCategories(data.customCategories);
        if (data.contextStack) setContextStack(data.contextStack);
        if (data.googleApiKey) fetchModels(data.googleApiKey, data.selectedModel);
      }
    );

    // 2. Load saved pages from local storage
    chrome.storage.local.get({ savedPages: [] }, (data) => setSavedPages(data.savedPages));

    // 3. Setup dynamic listener for storage changes
    const storageListener = (changes) => {
      if (changes.savedPages) setSavedPages(changes.savedPages.newValue);
      
      if (changes.selectedText) {
        chrome.storage.sync.get(["isFreePlan"], (data) => {
          const maxChars = data.isFreePlan ? MAX_CONTEXT_CHARS_FREE : MAX_CONTEXT_CHARS_DEFAULT;
          setSelectedText(changes.selectedText.newValue.substring(0, maxChars));
        });
      }
      
      if (changes.isFreePlan) setIsFreePlan(changes.isFreePlan.newValue);
      if (changes.useAiSummaries) setUseAiSummaries(changes.useAiSummaries.newValue);
      if (changes.autoCopy) setAutoCopy(changes.autoCopy.newValue);
      if (changes.isDarkMode) setIsDarkMode(changes.isDarkMode.newValue);
      if (changes.customCategories) setCustomCategories(changes.customCategories.newValue);
      if (changes.contextStack) setContextStack(changes.contextStack.newValue);
    };

    chrome.storage.onChanged.addListener(storageListener);
    return () => chrome.storage.onChanged.removeListener(storageListener);
  }, []);

  /**
   * Fetches compatible Gemini models from the API.
   */
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

    } catch (err) { 
      console.error("Failed to fetch models:", err); 
    } finally { 
      setIsLoadingModels(false); 
    }
  };

  /**
   * Constructs the prompt and sends it to the Gemini API.
   */
  const handleSend = async () => {
    if ((!selectedText || selectedText === NO_CONTEXT_TEXT) && !userInput) return;
    if (isSending || !googleApiKey) return;

    setIsSending(true);

    try {
      // 1. Get current tab information
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs || tabs.length === 0) {
        setResponse("Error: Could not find active tab.");
        return;
      }
      const tab = tabs[0];
      const currentSelectedText = selectedText === NO_CONTEXT_TEXT ? "" : selectedText;
      
      // Combine current context with the stacked multi-page collection
      const fullContext = [...contextStack, currentSelectedText].filter(t => t.trim().length > 0).join("\n---\n");

      // 2. Prepare the payload
      const freeTierNote = isFreePlan ? " (Important: Be extremely concise to save tokens)" : "";
      const prompt = `Act as Geminify by Hulmify. Efficiently summarize/answer using the provided context.${freeTierNote}
        Supported actions: [SEARCH: "query"], [GOTO: "url"], [SCROLL: "up/down"], [CLICK: "selector"], [TYPE: "selector|text"], [NOTIFY: "message"].
        
        URL: ${tab.url}
        Page: ${tab.title}
        Context: ${fullContext || "No context provided."}
        User: ${userInput || "Please summarize neatly."}`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent`;

      // 3. Perform the API call
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

      // 4. Handle response and built-in actions (e.g., [SEARCH: "..."])
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

      const resText = responseText;
      setResponse(resText);
      setCopyStatus("Copy");
      chrome.storage.sync.set({ response: resText });

      // Add to Session History (keep last 20)
      const newHistory = [
        ...chatHistory, 
        { role: "user", text: userInput, timestamp: Date.now() }, 
        { role: "assistant", text: resText, timestamp: Date.now() }
      ].slice(-20);
      setChatHistory(newHistory);
      chrome.storage.local.set({ chatHistory: newHistory });

      // Support Auto-Copy
      if (autoCopy) {
        navigator.clipboard.writeText(resText);
        setCopyStatus("Auto-Copied!");
        setTimeout(() => setCopyStatus("Copy"), 2000);
      }

    } catch (err) { 
      setResponse(`**Error:** ${err.message}`); 
      console.error("Geminify error:", err);
    } finally { 
      setIsSending(false); 
    }
  };

  /**
   * Removes a saved page from local storage.
   */
  const handleDeletePage = (timestamp) => {
    const updated = savedPages.filter(p => p.timestamp !== timestamp);
    chrome.storage.local.set({ savedPages: updated });
  };

  /**
   * Updates the category of an existing saved page.
   */
  const handleUpdateCategory = (timestamp, newCategory) => {
    const updated = savedPages.map(page => 
      page.timestamp === timestamp ? { ...page, category: newCategory } : page
    );
    // Persist changes to local storage
    chrome.storage.local.set({ savedPages: updated });
  };

  /**
   * Scrapes the current page for text and form inputs to use as context.
   */
  const selectAll = async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        const documentText = document.body.innerText;
        let allValues = "";
        
        // Extract basic form values for better multi-step context
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
        const maxChars = isFreePlan ? MAX_CONTEXT_CHARS_FREE : MAX_CONTEXT_CHARS_DEFAULT;
        setSelectedText(text.substring(0, maxChars));
        chrome.storage.sync.set({ selectedText: text });
      }
    });
  };

  /**
   * Adds the current page context to the multi-page context stack.
   */
  const handleAddToStack = () => {
    if (selectedText === NO_CONTEXT_TEXT) return;
    const newStack = [...contextStack, selectedText].slice(-5); // Keep last 5 pages
    setContextStack(newStack);
    chrome.storage.sync.set({ contextStack: newStack });
    setSelectedText(NO_CONTEXT_TEXT);
    chrome.storage.sync.set({ selectedText: NO_CONTEXT_TEXT });
  };

  /**
   * Clears context, user input, AI response, and full chat history.
   */
  const handleClearAll = () => {
    // 1. Reset all React state
    setSelectedText(NO_CONTEXT_TEXT);
    setUserInput("");
    setResponse("No response yet.");
    setChatHistory([]);
    setContextStack([]);

    // 2. Persist to storage
    chrome.storage.sync.set({ 
      selectedText: NO_CONTEXT_TEXT,
      userInput: "",
      response: "No response yet.",
      contextStack: []
    });
    chrome.storage.local.set({ chatHistory: [] });
  };

  /**
   * Exports the library of saved pages to a JSON file.
   */
  const handleExport = () => {
    const data = JSON.stringify(savedPages, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `geminify_library_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Imports a library of saved pages from a JSON file.
   */
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (Array.isArray(data)) {
          chrome.storage.local.set({ savedPages: data }, () => {
            setSavedPages(data);
            alert("Library imported successfully!");
          });
        }
      } catch (err) {
        alert("Invalid file format. Please upload a valid Geminify JSON export.");
      }
    };
    reader.readAsText(file);
  };

  // --- RENDER ---
  return (
    <div className={`app-container ${isDarkMode ? "dark-theme" : ""}`}>
      
      {/* HEADER SECTION */}
      <header>
        <div className="header-top">
          <div className="logo-text">GEMINI<span>FY</span></div>
          <span style={{ 
            width: "8px", 
            height: "8px", 
            borderRadius: "50%", 
            background: googleApiKey ? "#10b981" : "#f43f5e" 
          }}></span>
        </div>
        
        <div className="tabs-nav">
          <button className={`tab-btn ${activeTab === "chat" ? "active" : ""}`} onClick={() => setActiveTab("chat")}>Chat</button>
          <button className={`tab-btn ${activeTab === "pages" ? "active" : ""}`} onClick={() => setActiveTab("pages")}>My Pages</button>
          <button className={`tab-btn ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}>Settings</button>
        </div>
      </header>

      {/* TAB: CHAT INTERFACE */}
      {activeTab === "chat" && (
        <div className="section">
          
          <div className="card">
            <div className="label-row">
              <label>Page Context</label>
              <div style={{ display: "flex", gap: "10px" }}>
                <a href="#" className="small-link" onClick={selectAll} title="Automatically extract text and form data from the current page">Read Page</a>
                <a href="#" className="small-link" onClick={handleAddToStack} title="Store current page text into a multi-page context collection">Add to Collection</a>
                <a href="#" className="small-link" style={{ color: "#f43f5e" }} onClick={handleClearAll}>Clear All</a>
              </div>
            </div>
            <div className="context-box">{selectedText}</div>
            {contextStack.length > 0 && (
              <div style={{ fontSize: "0.65rem", color: "#4896bf", marginTop: "4px", fontWeight: "600" }}>
                &bull; {contextStack.length} other page(s) in collection
              </div>
            )}
          </div>

          <div className="card">
            <label>Ask Gemini</label>
            <textarea 
              placeholder="Ask about this page..." 
              value={userInput} 
              onChange={(e) => { setUserInput(e.target.value); chrome.storage.sync.set({ userInput: e.target.value }); }} 
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()} 
            />
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn-primary" style={{ flex: 1 }} disabled={isSending || !googleApiKey} onClick={handleSend}>
                {isSending ? "Thinking..." : "Send"}
              </button>
              <button className="btn-primary" style={{ background: "#f1f5f9", color: "#64748b", boxShadow: "none", width: "auto", padding: "14px 20px" }} onClick={handleClearAll}>
                Clear
              </button>
            </div>
          </div>

          {response && response !== "No response yet." && (
            <div className="response-card">
              <div className="response-header">
                <label>AI Response</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <a href="#" className="small-link" onClick={() => setIsEditMode(!isEditMode)}>
                    {isEditMode ? "View" : "Code"}
                  </a>
                  <a href="#" className="small-link" onClick={() => { 
                    navigator.clipboard.writeText(response); 
                    setCopyStatus("Copied!"); 
                    setTimeout(() => setCopyStatus("Copy"), 2000); 
                  }}>{copyStatus}</a>
                </div>
              </div>
              {isEditMode ? (
                <textarea 
                  className="response-content-edit" 
                  value={response} 
                  readOnly 
                  style={{ background: "#f8fafc", fontFamily: "monospace", fontSize: "0.8rem" }}
                />
              ) : (
                <div className="response-content" dangerouslySetInnerHTML={{ __html: marked.parse(response) }} />
              )}
            </div>
          )}

          {/* CHAT SESSION HISTORY */}
          {chatHistory.length > 0 && (
            <div className="chat-history-container">
              <label style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", margin: "10px 0 5px 5px", display: "block" }}>Session History</label>
              {chatHistory.map((msg, i) => (
                <div key={i} className={`chat-bubble ${msg.role}`}>
                  <div className="bubble-text">{msg.text}</div>
                  <div className="bubble-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ))}
            </div>
          )}
          
        </div>
      )}

      {/* TAB: SAVED PAGES */}
      {activeTab === "pages" && (
        <div className="section">
          {/* SEARCH & FILTERS */}
          <div className="search-container">
            <input 
              type="text" 
              placeholder="Search in library..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="search-input"
            />
          </div>

          <div className="category-tabs">
            {["All", "Insight", "Dev", "News", "Social", "Media", "Search"].map(cat => (
              <button 
                key={cat} 
                className={`category-tag ${activeCategory === cat ? "active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
            <label>Library (Last 40 Pages)</label>
            <span style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: "600" }}>{savedPages.length}/40</span>
          </div>
          
          {savedPages.filter(p => {
            const matchesCat = activeCategory === "All" || p.category === activeCategory;
            const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                 p.summary.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCat && matchesSearch;
          }).length > 0 ? 
            savedPages
              .filter(p => {
                const matchesCat = activeCategory === "All" || p.category === activeCategory;
                const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                     p.summary.toLowerCase().includes(searchTerm.toLowerCase());
                return matchesCat && matchesSearch;
              })
              .map(page => (
                <div className="card" key={page.timestamp} style={{ gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", maxWidth: "80%" }}>
                      <select 
                        className="badge-category-select" 
                        value={page.category || "Insight"}
                        onChange={(e) => handleUpdateCategory(page.timestamp, e.target.value)}
                      >
                        {["Insight", "Dev", "News", "Social", "Media", "Search"].map(cat => (
                          <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                        ))}
                      </select>
                      <a href={page.url} target="_blank" className="small-link" style={{ fontSize: "0.9rem", color: "#1e293b" }}>
                        {page.title}
                      </a>
                    </div>
                    <a href="#" className="small-link" style={{ color: "#f43f5e" }} onClick={() => handleDeletePage(page.timestamp)}>
                      Delete
                    </a>
                  </div>
                  <div 
                    className="context-box" 
                    style={{ background: "white", border: "none", fontStyle: "normal", padding: "0" }} 
                    dangerouslySetInnerHTML={{ __html: marked.parse(page.summary) }} 
                  />
                </div>
            )) : (
              <div className="card" style={{ textAlign: "center", fontStyle: "italic", padding: "40px" }}>
                No pages found {activeCategory !== "All" ? `in ${activeCategory}` : "yet"}.
              </div>
            )}
          
        </div>
      )}

      {/* TAB: SETTINGS & CONFIG */}
      {activeTab === "settings" && (
        <div className="section">
          
          <div className="card">
            <label>API Setup</label>
            <input type="text" placeholder="Gemini API Key" value={googleApiKey} onChange={(e) => setGoogleApiKey(e.target.value)} />
            <button className="btn-primary" onClick={() => { 
              chrome.storage.sync.set({ googleApiKey }, () => { 
                alert("Saved!"); 
                fetchModels(googleApiKey); 
              }); 
            }}>Save Key</button>
          </div>

          <div className="card">
            <label>Model Configuration</label>
            <select value={selectedModel} onChange={(e) => { 
              setSelectedModel(e.target.value); 
              chrome.storage.sync.set({ selectedModel: e.target.value }); 
            }}>
              {isLoadingModels ? (
                <option>Loading...</option>
              ) : models.length > 0 ? (
                models.map(m => (<option key={m.name} value={m.name.split("/").pop()}>{m.displayName || m.name}</option>))
              ) : (
                <option value="gemini-flash-latest">Gemini Flash Latest</option>
              )}
            </select>
          </div>

          <div className="card">
            <div className="label-row">
              <label>Free Tier Optimization</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.7rem", color: isFreePlan ? "#10b981" : "#94a3b8", fontWeight: "bold" }}>
                  {isFreePlan ? "ON" : "OFF"}
                </span>
                <input 
                  type="checkbox" 
                  checked={isFreePlan} 
                  onChange={(e) => { 
                    setIsFreePlan(e.target.checked); 
                    chrome.storage.sync.set({ isFreePlan: e.target.checked }); 
                  }} 
                  style={{ width: "auto", cursor: "pointer" }}
                />
              </div>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0 }}>
              Reduces context size and forces short responses to prevent API limit failures.
            </p>
          </div>

          <div className="card">
            <div className="label-row">
              <label>Save locally</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.7rem", color: !useAiSummaries ? "#10b981" : "#94a3b8", fontWeight: "bold" }}>
                  {!useAiSummaries ? "ON" : "OFF"}
                </span>
                <input 
                  type="checkbox" 
                  checked={!useAiSummaries} 
                  onChange={(e) => { 
                    setUseAiSummaries(!e.target.checked); 
                    chrome.storage.sync.set({ useAiSummaries: !e.target.checked }); 
                  }} 
                  style={{ width: "auto", cursor: "pointer" }}
                />
              </div>
            </div>
            <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0, marginBottom: "10px" }}>
              Instantly summarize and save pages without using Gemini tokens.
            </p>
          </div>

          <div className="card">
            <div className="label-row">
              <label>Auto-Copy to Clipboard</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.7rem", color: autoCopy ? "#10b981" : "#94a3b8", fontWeight: "bold" }}>
                  {autoCopy ? "ON" : "OFF"}
                </span>
                <input 
                  type="checkbox" 
                  checked={autoCopy} 
                  onChange={(e) => { 
                    setAutoCopy(e.target.checked); 
                    chrome.storage.sync.set({ autoCopy: e.target.checked }); 
                  }} 
                  style={{ width: "auto", cursor: "pointer" }}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="label-row">
              <label>Dark Mode</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "0.7rem", color: isDarkMode ? "#10b981" : "#94a3b8", fontWeight: "bold" }}>
                  {isDarkMode ? "ON" : "OFF"}
                </span>
                <input 
                  type="checkbox" 
                  checked={isDarkMode} 
                  onChange={(e) => { 
                    setIsDarkMode(e.target.checked); 
                    chrome.storage.sync.set({ isDarkMode: e.target.checked }); 
                  }} 
                  style={{ width: "auto", cursor: "pointer" }}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="label-row">
              <label>Data Management</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn-primary" style={{ background: "#f1f5f9", color: "#1e293b", width: "auto", padding: "8px 16px", fontSize: "0.8rem" }} onClick={handleExport}>
                  Export
                </button>
                <button className="btn-primary" style={{ background: "#f1f5f9", color: "#1e293b", width: "auto", padding: "8px 16px", fontSize: "0.8rem" }} onClick={() => document.getElementById('import-file').click()}>
                  Import
                </button>
                <input id="import-file" type="file" hidden accept=".json" onChange={handleImport} />
              </div>
            </div>
          </div>

          <div className="card">
            <label>Default Refine Rules</label>
            <textarea 
              placeholder="e.g. 'Fix grammar and style...'" 
              value={refineCustomPrompt} 
              onChange={(e) => setRefineCustomPrompt(e.target.value)} 
              style={{ minHeight: "60px" }} 
            />
            <button className="btn-primary" onClick={() => { 
              chrome.storage.sync.set({ refineCustomPrompt }, () => alert("Saved!")); 
            }}>Update Rules</button>
          </div>
          
        </div>
      )}

      <footer>Geminify by Hulmify &bull; Powered by Google Gemini &copy; 2026</footer>
    </div>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);

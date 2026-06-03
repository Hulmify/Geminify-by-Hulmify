import React, { useState, useEffect, useRef, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { marked } from "marked";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const NO_CONTEXT_TEXT = "The context is empty. Select some text on the page to provide context.";
const MAX_CONTEXT_CHARS_DEFAULT = 12000;
const MAX_CONTEXT_CHARS_FREE    = 4000;

/** Default prompt templates — IDs are stable so we can distinguish user-created ones. */
const DEFAULT_TEMPLATES = [
  { id: "tpl-explain",   label: "Explain",    icon: "explain",   prompt: "Explain this page clearly and simply, suitable for a general audience." },
  { id: "tpl-summarize", label: "Summarize",  icon: "summarize", prompt: "Provide a structured summary: 1) What is this, 2) Key Points, 3) My Takeaway." },
  { id: "tpl-keypoints", label: "Key Points", icon: "keypoints", prompt: "List the 5 most important points as concise bullet points." },
  { id: "tpl-timeline",  label: "Timeline",   icon: "timeline",  prompt: "Extract all dates, events, and deadlines. Format as a chronological list." },
  { id: "tpl-quiz",      label: "Quiz Me",    icon: "quiz",      prompt: "Generate 5 quiz questions based on this content to test my understanding." },
  { id: "tpl-critique",  label: "Critique",   icon: "critique",  prompt: "Provide a balanced critique: what are the strengths and weaknesses of the argument here?" },
];

const DEFAULT_TEMPLATE_IDS = new Set(DEFAULT_TEMPLATES.map(t => t.id));

// ─────────────────────────────────────────────
// SVG ICON COMPONENTS
// All icons are 14×14, stroke-based for consistency.
// ─────────────────────────────────────────────

const SZ = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };
const SZF = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "currentColor" }; // filled variant

const Icon = {
  /** Clipboard / copy */
  Copy:    () => <svg {...SZ}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  /** Checkmark — used for Copied confirmation */
  Check:   () => <svg {...SZ} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  /** Camera — screenshot */
  Camera:  () => <svg {...SZ}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  /** File — PDF attachment */
  File:    () => <svg {...SZ}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  /** X — close / clear */
  X:       () => <svg {...SZ} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  /** Square — stop streaming */
  Stop:    () => <svg {...SZF}><rect x="4" y="4" width="16" height="16" rx="2"/></svg>,
  /** Plus — add template */
  Plus:    () => <svg {...SZ} strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  /** Star — custom template */
  Star:    () => <svg {...SZ} strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  /** Warning triangle */
  Warn:    () => <svg {...SZ} strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  /** Sparkles — explain */
  Sparkle: () => <svg {...SZ} strokeWidth="1.8"><path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5Z"/></svg>,
  /** Pencil — fix / grammar */
  Pencil:  () => <svg {...SZ}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  /** List — summarize */
  List:    () => <svg {...SZ}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  /** Message bubble — chat */
  Chat:    () => <svg {...SZ}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  /** Clock — timeline */
  Clock:   () => <svg {...SZ}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  /** Brain / quiz (use grid) */
  Grid:    () => <svg {...SZ}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  /** Scale — critique */
  Scale:   () => <svg {...SZ}><line x1="12" y1="3" x2="12" y2="20"/><path d="M3 6l9-3 9 3"/><path d="M3 6c0 3.314 2.686 6 6 6s6-2.686 6-6"/><path d="M15 6c0 3.314 2.686 6 6 6s6-2.686 6-6"/></svg>,
  /** Book — reading mode */
  Book:    () => <svg {...SZ}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
};

/** Maps a template icon key to the right Icon component. */
const TemplateIcon = ({ icon }) => {
  const map = {
    explain: Icon.Sparkle, summarize: Icon.List, keypoints: Icon.List,
    timeline: Icon.Clock,  quiz: Icon.Grid,     critique: Icon.Scale,
    custom: Icon.Star,
  };
  const C = map[icon] || Icon.Star;
  return <C />;
};

// ─────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────

const App = () => {

  // ── Navigation ───────────────────────────────
  const [activeTab, setActiveTab]         = useState("chat");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm]       = useState("");

  // ── Chat content & input ─────────────────────
  const [selectedText, setSelectedText]   = useState(NO_CONTEXT_TEXT);
  const [userInput, setUserInput]         = useState("");
  const [response, setResponse]           = useState("No response yet.");
  const [copyStatus, setCopyStatus]       = useState("idle");
  const [isStreaming, setIsStreaming]     = useState(false);
  const [isEditMode, setIsEditMode]       = useState(false);
  const [chatHistory, setChatHistory]     = useState([]);
  const [contextStack, setContextStack]   = useState([]);

  // ── Multimodal attachments (Feature 4) ───────
  const [screenshotData, setScreenshotData] = useState(null);  // base64 PNG string
  const [attachedPdf, setAttachedPdf]       = useState(null);  // { name, base64, mimeType }
  const pdfInputRef = useRef(null);

  // ── Prompt templates (Feature 3) ─────────────
  const [promptTemplates, setPromptTemplates] = useState(DEFAULT_TEMPLATES);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName]   = useState("");

  // ── Configuration ────────────────────────────
  const [googleApiKey, setGoogleApiKey]         = useState("");
  const [openrouterApiKey, setOpenrouterApiKey] = useState("");
  const [aiProvider, setAiProvider]             = useState("gemini"); // "gemini" | "openrouter"
  const [openrouterModel, setOpenrouterModel]   = useState("");
  const [openrouterModels, setOpenrouterModels] = useState([]);   // fetched multimodal models
  const [modelsLoading, setModelsLoading]       = useState(false);
  const [refineCustomPrompt, setRefineCustomPrompt] = useState("");
  const [isFreePlan, setIsFreePlan]         = useState(false);
  const [useAiSummaries, setUseAiSummaries] = useState(false);
  const [autoCopy, setAutoCopy]             = useState(false);
  const [isDarkMode, setIsDarkMode]         = useState(false);
  const [customCategories, setCustomCategories] = useState([
    { name: "Dev",    keywords: ["github", "stackoverflow", "docs."] },
    { name: "Social", keywords: ["twitter", "linkedin", "facebook"] },
    { name: "News",   keywords: ["news.", "cnn.", "bbc."] },
    { name: "Media",  keywords: ["youtube", "netflix"] },
    { name: "Search", keywords: ["google.com/search"] }
  ]);

  // ── API & persistence ────────────────────────
  const [isSending, setIsSending]         = useState(false);
  const [savedPages, setSavedPages]       = useState([]);

  // ── Toast ─────────────────────────────────────
  const [toast, setToast] = useState(null); // { message, type }

  // ── Refs ──────────────────────────────────────
  const streamReaderRef = useRef(null);

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────

  /**
   * Shows a brief toast notification and auto-dismisses it.
   * @param {string} message
   * @param {"success"|"error"} type
   */
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  // ─────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────

  useEffect(() => {
    // Load all persisted settings
    chrome.storage.sync.get(
      ["selectedText", "googleApiKey", "openrouterApiKey", "aiProvider", "openrouterModel", "refineCustomPrompt",
       "response", "userInput", "isFreePlan", "useAiSummaries", "autoCopy",
       "isDarkMode", "customCategories", "contextStack", "promptTemplates"],
      (data) => {
        const maxChars = data.isFreePlan ? MAX_CONTEXT_CHARS_FREE : MAX_CONTEXT_CHARS_DEFAULT;
        if (data.selectedText)        setSelectedText(data.selectedText.substring(0, maxChars));
        if (data.googleApiKey)        setGoogleApiKey(data.googleApiKey);
        if (data.openrouterApiKey)    setOpenrouterApiKey(data.openrouterApiKey);
        if (data.aiProvider)          setAiProvider(data.aiProvider);
        if (data.openrouterModel)     setOpenrouterModel(data.openrouterModel);
        if (data.refineCustomPrompt)  setRefineCustomPrompt(data.refineCustomPrompt);
        if (data.response)            setResponse(data.response);
        if (data.userInput)           setUserInput(data.userInput);
        if (data.isFreePlan !== undefined) setIsFreePlan(data.isFreePlan);
        setUseAiSummaries(data.useAiSummaries ?? false);
        if (data.autoCopy !== undefined)   setAutoCopy(data.autoCopy);
        if (data.isDarkMode !== undefined) setIsDarkMode(data.isDarkMode);
        if (data.customCategories)    setCustomCategories(data.customCategories);
        if (data.contextStack)        setContextStack(data.contextStack);
        if (data.promptTemplates)     setPromptTemplates(data.promptTemplates);
      }
    );

    // Load local-only data
    chrome.storage.local.get({ savedPages: [], chatHistory: [] }, (data) => {
      setSavedPages(data.savedPages);
      if (data.chatHistory?.length) setChatHistory(data.chatHistory);
    });

    // Reactive storage listener
    const storageListener = (changes) => {
      if (changes.savedPages)         setSavedPages(changes.savedPages.newValue);
      if (changes.selectedText) {
        chrome.storage.sync.get(["isFreePlan"], (d) => {
          const max = d.isFreePlan ? MAX_CONTEXT_CHARS_FREE : MAX_CONTEXT_CHARS_DEFAULT;
          setSelectedText(changes.selectedText.newValue.substring(0, max));
        });
      }
      if (changes.isFreePlan)         setIsFreePlan(changes.isFreePlan.newValue);
      if (changes.useAiSummaries)     setUseAiSummaries(changes.useAiSummaries.newValue);
      if (changes.autoCopy)           setAutoCopy(changes.autoCopy.newValue);
      if (changes.isDarkMode)         setIsDarkMode(changes.isDarkMode.newValue);
      if (changes.customCategories)   setCustomCategories(changes.customCategories.newValue);
      if (changes.contextStack)       setContextStack(changes.contextStack.newValue);
      if (changes.promptTemplates)    setPromptTemplates(changes.promptTemplates.newValue);
      if (changes.openrouterApiKey)   setOpenrouterApiKey(changes.openrouterApiKey.newValue);
      if (changes.aiProvider)         setAiProvider(changes.aiProvider.newValue);
      if (changes.openrouterModel)    setOpenrouterModel(changes.openrouterModel.newValue);
    };

    chrome.storage.onChanged.addListener(storageListener);
    return () => chrome.storage.onChanged.removeListener(storageListener);
  }, []);

  // Fetch multimodal models from OpenRouter whenever the provider is switched to openrouter
  useEffect(() => {
    if (aiProvider !== "openrouter" || openrouterModels.length > 0) return;
    setModelsLoading(true);
    fetch("https://openrouter.ai/api/v1/models")
      .then(r => r.json())
      .then(data => {
        const multimodal = (data?.data || [])
          .filter(m => {
            const mods = m.architecture?.input_modalities || [];
            // Require image support, but allow models without file support
            return mods.includes("image");
          })
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(m => ({
            id: m.id,
            label: m.name,
            supportsFile: m.architecture?.input_modalities?.includes("file") || false
          }));
        setOpenrouterModels(multimodal);
      })
      .catch(() => showToast("Could not load OpenRouter models.", "error"))
      .finally(() => setModelsLoading(false));
  }, [aiProvider]);

  // ─────────────────────────────────────────────
  // MULTIMODAL HELPERS (Feature 4)
  // ─────────────────────────────────────────────

  /**
   * Requests a screenshot of the current tab from the background script.
   */
  const captureScreenshot = async () => {
    try {
      const res = await chrome.runtime.sendMessage({ action: "captureTab" });
      if (res?.dataUrl) {
        setScreenshotData(res.dataUrl.split(",")[1]);
        showToast("Screenshot captured!");
      } else {
        throw new Error(res?.error || "Unknown error");
      }
    } catch (err) {
      showToast("Could not capture screenshot.", "error");
      console.error(err);
    }
  };

  /**
   * Reads an attached PDF file as base64.
   */
  const handlePdfAttach = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result.split(",")[1];
      setAttachedPdf({ name: file.name, base64, mimeType: file.type || "application/pdf" });
      showToast(`${file.name} attached!`);
    };
    reader.readAsDataURL(file);
  };

  /** Clears all multimodal attachments. */
  const clearAttachments = () => {
    setScreenshotData(null);
    setAttachedPdf(null);
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };

  /** Cancels an active stream. */
  const handleStop = () => {
    streamReaderRef.current?.cancel();
    streamReaderRef.current = null;
    setIsStreaming(false);
    setIsSending(false);
  };

  // ─────────────────────────────────────────────
  // API — SEND (Streaming + Multi-turn, Feature 1)
  // ─────────────────────────────────────────────

  /**
   * Sends the current message to Gemini using SSE streaming.
   * Builds a multi-turn conversation from chatHistory.
   */
  const handleSend = async () => {
    const hasContent = userInput.trim() || screenshotData || attachedPdf ||
      (selectedText && selectedText !== NO_CONTEXT_TEXT);
    const activeKey = aiProvider === "openrouter" ? openrouterApiKey.trim() : googleApiKey.trim();
    if (!hasContent || isSending || !activeKey || (aiProvider === "openrouter" && !openrouterModel)) {
      if (!activeKey) showToast(aiProvider === "openrouter" ? "Enter & save your OpenRouter API key in Settings." : "Enter & save your Gemini API key in Settings.", "error");
      else if (aiProvider === "openrouter" && !openrouterModel) showToast("Please select a model in Settings.", "error");
      return;
    }

    setIsSending(true);
    setIsStreaming(true);
    setResponse("");

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs?.length) { setResponse("**Error:** Could not find active tab."); return; }
      const tab = tabs[0];

      const currentText = selectedText === NO_CONTEXT_TEXT ? "" : selectedText;
      const fullContext = [...contextStack, currentText].filter(t => t.trim()).join("\n---\n");

      // System instruction with page context
      const freeTierNote = isFreePlan ? " Be extremely concise." : "";
      const systemText = `Act as Geminify by Hulmify. Efficiently summarize/answer using the provided context.${freeTierNote}
Supported actions: [SEARCH: "query"], [GOTO: "url"], [SCROLL: "up/down"], [CLICK: "selector"], [TYPE: "selector|text"], [NOTIFY: "message"].
URL: ${tab.url}
Page: ${tab.title}
Context: ${fullContext || "No context provided."}`;

      // Build multi-turn history
      const historyTurns = chatHistory.map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }]
      }));

      // New user message — supports multimodal parts
      const userParts = [{ text: userInput.trim() || "Please summarize neatly." }];
      if (screenshotData) userParts.push({ inlineData: { mimeType: "image/png",            data: screenshotData } });
      if (attachedPdf)    userParts.push({ inlineData: { mimeType: attachedPdf.mimeType,   data: attachedPdf.base64 } });

      const contents = [...historyTurns, { role: "user", parts: userParts }];

      let res;

      if (aiProvider === "openrouter") {
        // ── OpenRouter (OpenAI-compatible streaming) ──────────────────────
        // Some providers (incl. Google via OpenRouter) reject a standalone
        // system message, so we prepend the system prompt to the first user
        // message instead, which is universally supported.
        const historyMessages = chatHistory.map(msg => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.text,
        }));

        // Assemble user content parts (text + optional images)
        const userContentParts = [];
        const userText = userInput.trim() || "Please summarize neatly.";
        // Prefix system context into the user text for broad model compatibility
        userContentParts.push({ type: "text", text: `${systemText}\n\n---\n\n${userText}` });
        if (screenshotData) userContentParts.push({ type: "image_url", image_url: { url: `data:image/png;base64,${screenshotData}` } });
        if (attachedPdf)    userContentParts.push({ type: "text", text: `[PDF attached: ${attachedPdf.name} — please analyse it]` });

        const openAiMessages = [
          ...historyMessages,
          // Use plain string when no attachments; array only when multimodal
          { role: "user", content: userContentParts.length === 1 ? userContentParts[0].text : userContentParts },
        ];

        res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${activeKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://hulmify.com",
            "X-Title": "Geminify by Hulmify",
          },
          body: JSON.stringify({
            model: openrouterModel,
            messages: openAiMessages,
            stream: true,
          }),
        });
      } else {
        // ── Google Gemini (native SSE) ────────────────────────────────────
        res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:streamGenerateContent?alt=sse`,
          {
            method: "POST",
            headers: { "x-goog-api-key": googleApiKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemText }] },
              contents
            }),
          }
        );
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        // Surface the provider's raw error detail when available
        const detail = errData?.error?.metadata?.raw || errData?.error?.message || `API error: ${res.status}`;
        throw new Error(detail);
      }

      // Stream tokens
      const reader = res.body.getReader();
      streamReaderRef.current = reader;
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr || jsonStr === "[DONE]") continue;
          try {
            const json = JSON.parse(jsonStr);
            // OpenRouter uses OpenAI delta format; Gemini uses candidates
            const token = aiProvider === "openrouter"
              ? (json?.choices?.[0]?.delta?.content || "")
              : (json?.candidates?.[0]?.content?.parts?.[0]?.text || "");
            accumulated += token;
            setResponse(accumulated);
          } catch { /* partial chunk — continue */ }
        }
      }
      streamReaderRef.current = null;

      // Detect and execute any built-in action commands after streaming completes
      const match = accumulated.match(/\[([A-Z]+): "(.*?)"\]/);
      if (match) {
        const [, action, val] = match;
        switch (action) {
          case "SEARCH": chrome.tabs.create({ url: `https://www.google.com/search?q=${encodeURIComponent(val)}` }); break;
          case "GOTO":   chrome.tabs.update(tab.id, { url: val }); break;
          case "SCROLL":
          case "CLICK":
          case "TYPE":   chrome.tabs.sendMessage(tab.id, { action: "performAction", type: action, value: val }); break;
          case "NOTIFY": chrome.notifications.create({ type: "basic", iconUrl: "/icons/icon128.png", title: "Geminify", message: val }); break;
        }
      }

      chrome.storage.sync.set({ response: accumulated });

      // Update conversation history (keep last 20 messages = 10 turns)
      const newHistory = [
        ...chatHistory,
        { role: "user",      text: userInput.trim() || "Please summarize neatly.", timestamp: Date.now() },
        { role: "assistant", text: accumulated, timestamp: Date.now() }
      ].slice(-20);
      setChatHistory(newHistory);
      chrome.storage.local.set({ chatHistory: newHistory });

      // Auto-copy
      if (autoCopy) {
        navigator.clipboard.writeText(accumulated);
        setCopyStatus("Auto-Copied!");
        setTimeout(() => setCopyStatus("Copy"), 2000);
      }

      clearAttachments();
      setCopyStatus("Copy");

    } catch (err) {
      if (err.name !== "AbortError") {
        setResponse(`**Error:** ${err.message}`);
        console.error("Geminify send error:", err);
      }
    } finally {
      setIsStreaming(false);
      setIsSending(false);
      streamReaderRef.current = null;
    }
  };

  // ─────────────────────────────────────────────
  // PROMPT TEMPLATES (Feature 3)
  // ─────────────────────────────────────────────

  /** Saves the current userInput as a new named template. */
  const handleSaveTemplate = () => {
    if (!newTemplateName.trim() || !userInput.trim()) return;
    const newTpl = { id: `custom-${Date.now()}`, label: newTemplateName.trim(), icon: "custom", prompt: userInput };
    const updated = [...promptTemplates, newTpl];
    setPromptTemplates(updated);
    chrome.storage.sync.set({ promptTemplates: updated });
    setShowSaveTemplate(false);
    setNewTemplateName("");
    showToast("Template saved!");
  };

  /** Deletes a user-created template (default templates cannot be deleted). */
  const handleDeleteTemplate = (id) => {
    const updated = promptTemplates.filter(t => t.id !== id);
    setPromptTemplates(updated);
    chrome.storage.sync.set({ promptTemplates: updated });
    showToast("Template deleted.");
  };

  // ─────────────────────────────────────────────
  // LIBRARY
  // ─────────────────────────────────────────────

  const handleDeletePage = (timestamp) => {
    chrome.storage.local.set({ savedPages: savedPages.filter(p => p.timestamp !== timestamp) });
  };

  const handleUpdateCategory = (timestamp, newCategory) => {
    chrome.storage.local.set({
      savedPages: savedPages.map(p => p.timestamp === timestamp ? { ...p, category: newCategory } : p)
    });
  };

  // ─────────────────────────────────────────────
  // CONTEXT
  // ─────────────────────────────────────────────

  /**
   * Scrapes the current page for text and form inputs to use as context.
   */
  const selectAll = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        const documentText = document.body.innerText;
        let allValues = "";
        document.querySelectorAll("input, textarea, select").forEach((el) => {
          if (["password", "email", "hidden", "file"].includes(el.type)) return;
          let name = el.name || "";
          let value = el.value || "";
          if (!name) {
            let i = 0, parent = el;
            while (i++ < 10) {
              parent = parent?.parentElement;
              if (!parent) break;
              const lbl = parent.querySelector("label");
              if (lbl) { name = lbl.innerText; break; }
            }
          }
          if (el.tagName === "SELECT") value = el.options[el.selectedIndex]?.innerText || "";
          allValues += `Name: ${name || el.id || "Unknown"}, Value: ${value || "Empty"}\n`;
        });
        return `${documentText}${allValues ? "\n\n===== Form Values =====\n\n" + allValues : ""}`;
      },
    }, (results) => {
      const text = results?.[0]?.result || "";
      if (text) {
        const maxChars = isFreePlan ? MAX_CONTEXT_CHARS_FREE : MAX_CONTEXT_CHARS_DEFAULT;
        setSelectedText(text.substring(0, maxChars));
        chrome.storage.sync.set({ selectedText: text });
      }
    });
  };

  const handleAddToStack = () => {
    if (selectedText === NO_CONTEXT_TEXT) return;
    const newStack = [...contextStack, selectedText].slice(-5);
    setContextStack(newStack);
    chrome.storage.sync.set({ contextStack: newStack });
    setSelectedText(NO_CONTEXT_TEXT);
    chrome.storage.sync.set({ selectedText: NO_CONTEXT_TEXT });
  };

  const handleClearAll = () => {
    setSelectedText(NO_CONTEXT_TEXT);
    setUserInput("");
    setResponse("No response yet.");
    setChatHistory([]);
    setContextStack([]);
    clearAttachments();
    chrome.storage.sync.set({ selectedText: NO_CONTEXT_TEXT, userInput: "", response: "No response yet.", contextStack: [] });
    chrome.storage.local.set({ chatHistory: [] });
  };

  // ─────────────────────────────────────────────
  // DATA MANAGEMENT
  // ─────────────────────────────────────────────

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(savedPages, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `geminify_library_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (Array.isArray(data)) {
          chrome.storage.local.set({ savedPages: data }, () => {
            setSavedPages(data);
            showToast("Library imported successfully!");
          });
        }
      } catch { showToast("Invalid file format.", "error"); }
    };
    reader.readAsText(file);
  };

  // ─────────────────────────────────────────────
  // COMPUTED
  // ─────────────────────────────────────────────

  const filteredPages = useMemo(() =>
    savedPages.filter(p => {
      const matchCat  = activeCategory === "All" || p.category === activeCategory;
      const matchText = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.summary.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchText;
    }),
    [savedPages, activeCategory, searchTerm]
  );

  const hasAttachment = !!(screenshotData || attachedPdf);
  const supportsPdf = aiProvider === "gemini" || (aiProvider === "openrouter" && openrouterModels.find(m => m.id === openrouterModel)?.supportsFile);
  
  // Clear PDF attachment if model doesn't support it
  useEffect(() => {
    if (!supportsPdf && attachedPdf) {
      setAttachedPdf(null);
    }
  }, [supportsPdf, attachedPdf]);

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <div className={`app-container ${isDarkMode ? "dark-theme" : ""}`}>

      {/* ── TOAST ── */}
      {toast && (
        <div className={`toast ${toast.type === "error" ? "toast--error" : "toast--success"}`}>
          <span className="toast-icon">
            {toast.type === "error" ? <Icon.Warn /> : <Icon.Check />}
          </span>
          {toast.message}
        </div>
      )}

      {/* ── HEADER ── */}
      <header>
        <div className="header-top">
          <div className="logo-text">GEMINI<span>FY</span></div>
          <span className={`status-dot ${(aiProvider === "openrouter" ? openrouterApiKey : googleApiKey) ? "status-dot--online" : "status-dot--offline"}`} />
        </div>
        <div className="tabs-nav">
          <button className={`tab-btn ${activeTab === "chat"     ? "active" : ""}`} onClick={() => setActiveTab("chat")}>Chat</button>
          <button className={`tab-btn ${activeTab === "pages"    ? "active" : ""}`} onClick={() => setActiveTab("pages")}>My Pages</button>
          <button className={`tab-btn ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}>Settings</button>
        </div>
      </header>

      {/* ══════════════════════════════════════
          TAB: CHAT
      ══════════════════════════════════════ */}
      {activeTab === "chat" && (
        <div className="section">

          {/* Page Context */}
          <div className="card">
            <div className="label-row">
              <label>Page Context</label>
              <div style={{ display: "flex", gap: "10px" }}>
                <a href="#" className="small-link" onClick={selectAll}        title="Extract text from current page">Read Page</a>
                <a href="#" className="small-link" onClick={handleAddToStack} title="Add to multi-page collection">+ Collect</a>
                <a href="#" className="small-link" style={{ color: "#f43f5e" }} onClick={handleClearAll}>Clear All</a>
              </div>
            </div>
            <div className="context-box">{selectedText}</div>
            {contextStack.length > 0 && (
              <div style={{ fontSize: "0.65rem", color: "#4896bf", fontWeight: "600" }}>
                &bull; {contextStack.length} other page(s) in collection
              </div>
            )}
          </div>

          {/* Ask Gemini */}
          <div className="card">
            <label>Ask Gemini</label>

            {/* ── Prompt Templates (Feature 3) ── */}
            <div className="template-row">
              {promptTemplates.map(t => (
                <button
                  key={t.id}
                  className="template-pill"
                  title={t.prompt}
                  onClick={() => {
                    setUserInput(t.prompt);
                    chrome.storage.sync.set({ userInput: t.prompt });
                  }}
                >
                  <TemplateIcon icon={t.icon} />
                  {t.label}
                </button>
              ))}
              {userInput.trim() && (
                <button
                  className="template-pill template-pill--add"
                  title="Save as template"
                  onClick={() => setShowSaveTemplate(s => !s)}
                >
                  ＋ Save
                </button>
              )}
            </div>

            {/* Save-template inline form */}
            {showSaveTemplate && (
              <div className="template-save-row">
                <input
                  type="text"
                  placeholder="Template name..."
                  value={newTemplateName}
                  onChange={e => setNewTemplateName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSaveTemplate()}
                  style={{ flex: 1, padding: "8px 12px", fontSize: "0.82rem" }}
                />
                <button className="btn-primary" style={{ width: "auto", padding: "8px 14px", fontSize: "0.82rem" }} onClick={handleSaveTemplate}>Save</button>
                <button className="btn-primary" style={{ background: "#f1f5f9", color: "#64748b", boxShadow: "none", width: "auto", padding: "8px 14px", fontSize: "0.82rem" }} onClick={() => setShowSaveTemplate(false)}>
                  <Icon.X />
                </button>
              </div>
            )}

            {/* Textarea */}
            <textarea
              placeholder="Ask about this page… or use a template above"
              value={userInput}
              onChange={e => { setUserInput(e.target.value); chrome.storage.sync.set({ userInput: e.target.value }); }}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
            />

            {/* ── Multimodal Attachment Bar (Feature 4) ── */}
            <div className="attachment-bar">
              <button
                className={`attach-btn ${screenshotData ? "attach-btn--active" : ""}`}
                onClick={screenshotData ? clearAttachments : captureScreenshot}
                title="Capture screenshot of current page"
              >
                <Icon.Camera />
                {screenshotData ? "Screenshot" : "Screenshot"}
                {screenshotData && <Icon.Check />}
              </button>

              {supportsPdf && (
                <>
                  <button
                    className={`attach-btn ${attachedPdf ? "attach-btn--active" : ""}`}
                    onClick={() => attachedPdf ? clearAttachments() : pdfInputRef.current?.click()}
                    title="Attach a PDF for analysis"
                  >
                    <Icon.File />
                    {attachedPdf ? `${attachedPdf.name.substring(0, 12)}…` : "PDF"}
                    {attachedPdf && <Icon.Check />}
                  </button>
                  <input ref={pdfInputRef} type="file" hidden accept=".pdf,application/pdf" onChange={handlePdfAttach} />
                </>
              )}

              {hasAttachment && (
                <button className="attach-btn attach-btn--clear" onClick={clearAttachments}>
                  <Icon.X /> Clear
                </button>
              )}
            </div>

            {/* Send / Stop */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                disabled={!isStreaming && (isSending || !(aiProvider === "openrouter" ? openrouterApiKey : googleApiKey))}
                onClick={isStreaming ? handleStop : handleSend}
              >
                {isStreaming
                  ? <><Icon.Stop /> Stop</>
                  : isSending ? "Thinking…" : "Send"
                }
              </button>
              <button
                className="btn-primary"
                style={{ background: "#f1f5f9", color: "#64748b", boxShadow: "none", width: "auto", padding: "14px 20px" }}
                onClick={handleClearAll}
              >
                Clear
              </button>
            </div>
          </div>

          {/* ── AI Response (Feature 1 — streams live) ── */}
          {response && response !== "No response yet." && (
            <div className="response-card">
              <div className="response-header">
                <label>
                  AI Response
                  {isStreaming && <span className="streaming-cursor" aria-label="Streaming" />}
                </label>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <a href="#" className="small-link" onClick={() => setIsEditMode(m => !m)}>
                    {isEditMode ? "View" : "Code"}
                  </a>
                  <button
                    className="copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(response);
                      setCopyStatus("copied");
                      setTimeout(() => setCopyStatus("idle"), 2000);
                    }}
                    title="Copy response"
                  >
                    {copyStatus === "copied" ? <Icon.Check /> : <Icon.Copy />}
                    {copyStatus === "copied" ? "Copied" : "Copy"}
                  </button>
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

          {/* Chat history */}
          {chatHistory.length > 0 && (
            <div className="chat-history-container">
              <label style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", margin: "10px 0 5px 5px", display: "block" }}>
                Session History
              </label>
              {chatHistory.map((msg, i) => (
                <div key={i} className={`chat-bubble ${msg.role}`}>
                  {msg.role === "assistant" ? (
                    <div className="bubble-text" dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) }} />
                  ) : (
                    <div className="bubble-text" style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
                  )}
                  <div className="bubble-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          TAB: MY PAGES
      ══════════════════════════════════════ */}
      {activeTab === "pages" && (
        <div className="section">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search in library..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="category-tabs">
            {["All", "Insight", "Dev", "News", "Social", "Media", "Search"].map(cat => (
              <button
                key={cat}
                className={`category-tag ${activeCategory === cat ? "active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >{cat}</button>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
            <label>Library (Last 40 Pages)</label>
            <span style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: "600" }}>{savedPages.length}/40</span>
          </div>

          {filteredPages.length > 0 ? filteredPages.map(page => (
            <div className="card" key={page.timestamp} style={{ gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", maxWidth: "80%" }}>
                  <select
                    className="badge-category-select"
                    value={page.category || "Insight"}
                    onChange={e => handleUpdateCategory(page.timestamp, e.target.value)}
                  >
                    {["Insight", "Dev", "News", "Social", "Media", "Search"].map(cat => (
                      <option key={cat} value={cat}>{cat.toUpperCase()}</option>
                    ))}
                  </select>
                  <a href={page.url} target="_blank" className="small-link" style={{ fontSize: "0.9rem", color: "#1e293b" }}>
                    {page.title}
                  </a>
                </div>
                <a href="#" className="small-link" style={{ color: "#f43f5e" }} onClick={() => handleDeletePage(page.timestamp)}>Delete</a>
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

      {/* ══════════════════════════════════════
          TAB: SETTINGS
      ══════════════════════════════════════ */}
      {activeTab === "settings" && (
        <div className="section">

          <div className="card">
            <label>AI Provider</label>
            <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0 0 8px" }}>
              Both providers use the latest Gemini Flash model. OpenRouter routes via its API gateway.
            </p>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              {[{ id: "gemini", label: "Google Gemini" }, { id: "openrouter", label: "OpenRouter" }].map(p => (
                <button
                  key={p.id}
                  className="btn-primary"
                  style={{
                    flex: 1,
                    padding: "10px",
                    fontSize: "0.82rem",
                    background: aiProvider === p.id ? undefined : "#f1f5f9",
                    color: aiProvider === p.id ? undefined : "#64748b",
                    boxShadow: aiProvider === p.id ? undefined : "none",
                  }}
                  onClick={() => {
                    setAiProvider(p.id);
                    chrome.storage.sync.set({ aiProvider: p.id });
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {aiProvider === "gemini" ? (
              <>
                <input
                  type="text"
                  placeholder="Gemini API Key (from Google AI Studio)"
                  value={googleApiKey}
                  onChange={e => setGoogleApiKey(e.target.value)}
                />
                <button className="btn-primary" onClick={() => {
                  chrome.storage.sync.set({ googleApiKey }, () => showToast("Gemini API key saved!"));
                }}>Save Gemini Key</button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="OpenRouter API Key (from openrouter.ai)"
                  value={openrouterApiKey}
                  onChange={e => setOpenrouterApiKey(e.target.value)}
                />
                <button className="btn-primary" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }} onClick={() => {
                  chrome.storage.sync.set({ openrouterApiKey }, () => showToast("OpenRouter key saved!"));
                }}>Save OpenRouter Key</button>

                {/* Multimodal model selector */}
                <div style={{ marginTop: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "0.75rem", color: "#475569", fontWeight: "600" }}>Multimodal Model</label>
                    {modelsLoading && <span style={{ fontSize: "0.68rem", color: "#a855f7" }}>Fetching…</span>}
                    {!modelsLoading && openrouterModels.length > 0 && (
                      <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>{openrouterModels.length} models</span>
                    )}
                  </div>
                  {openrouterModels.length > 0 ? (
                    <select
                      value={openrouterModel || ""}
                      onChange={e => {
                        setOpenrouterModel(e.target.value);
                        chrome.storage.sync.set({ openrouterModel: e.target.value });
                      }}
                      style={{
                        width: "100%", padding: "9px 12px", borderRadius: "10px",
                        border: "1px solid #e2e8f0", fontSize: "0.82rem",
                        background: "#f8fafc", color: "#1e293b", cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      <option value="" disabled>Select a model...</option>
                      {openrouterModels.map(m => (
                        <option key={m.id} value={m.id}>{m.label}</option>
                      ))}
                    </select>
                  ) : !modelsLoading ? (
                    <button
                      className="btn-primary"
                      style={{ background: "#f1f5f9", color: "#7c3aed", boxShadow: "none", fontSize: "0.8rem", padding: "8px" }}
                      onClick={() => setOpenrouterModels([])}
                    >
                      Retry Loading Models
                    </button>
                  ) : null}
                  {openrouterModel && (
                    <p style={{ fontSize: "0.68rem", color: "#94a3b8", margin: "5px 0 0", wordBreak: "break-all" }}>
                      Active: <strong style={{ color: "#7c3aed" }}>{openrouterModel}</strong>
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Toggle settings */}
          {[
            { label: "Free Tier Optimization",  key: "isFreePlan",     value: isFreePlan,     setter: setIsFreePlan,    desc: "Reduces context size and forces short responses." },
            { label: "Save Locally (No AI)",     key: "useAiSummaries", value: !useAiSummaries, setter: v => { setUseAiSummaries(!v); chrome.storage.sync.set({ useAiSummaries: !v }); return; }, invertedKey: true, desc: "Save pages without using Gemini tokens." },
            { label: "Auto-Copy to Clipboard",   key: "autoCopy",       value: autoCopy,       setter: setAutoCopy },
            { label: "Dark Mode",                key: "isDarkMode",     value: isDarkMode,     setter: setIsDarkMode },
          ].map(({ label, key, value, setter, invertedKey, desc }) => (
            <div className="card" key={key}>
              <div className="label-row">
                <label>{label}</label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "0.7rem", color: value ? "#10b981" : "#94a3b8", fontWeight: "bold" }}>{value ? "ON" : "OFF"}</span>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={e => {
                      if (invertedKey) { setter(e.target.checked); }
                      else { setter(e.target.checked); chrome.storage.sync.set({ [key]: e.target.checked }); }
                    }}
                    style={{ width: "auto", cursor: "pointer" }}
                  />
                </div>
              </div>
              {desc && <p style={{ fontSize: "0.75rem", color: "#64748b", margin: 0 }}>{desc}</p>}
            </div>
          ))}

          <div className="card">
            <div className="label-row">
              <label>Data Management</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn-primary" style={{ background: "#f1f5f9", color: "#1e293b", width: "auto", padding: "8px 16px", fontSize: "0.8rem" }} onClick={handleExport}>Export</button>
                <button className="btn-primary" style={{ background: "#f1f5f9", color: "#1e293b", width: "auto", padding: "8px 16px", fontSize: "0.8rem" }} onClick={() => document.getElementById("import-file").click()}>Import</button>
                <input id="import-file" type="file" hidden accept=".json" onChange={handleImport} />
              </div>
            </div>
          </div>

          <div className="card">
            <label>Default Refine Rules</label>
            <textarea
              placeholder="e.g. 'Fix grammar and improve style...'"
              value={refineCustomPrompt}
              onChange={e => setRefineCustomPrompt(e.target.value)}
              style={{ minHeight: "60px" }}
            />
            <button className="btn-primary" onClick={() => chrome.storage.sync.set({ refineCustomPrompt }, () => showToast("Rules saved!"))}>
              Update Rules
            </button>
          </div>

          {/* Prompt Templates manager */}
          <div className="card">
            <label>Prompt Templates</label>
            <p style={{ fontSize: "0.75rem", color: "#64748b", margin: "0 0 8px" }}>
              Click a template in the Chat tab to pre-fill your question. Custom templates can be deleted.
            </p>
            {promptTemplates.map(t => (
              <div key={t.id} className="template-manager-row">
                <span style={{ fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "6px" }}><TemplateIcon icon={t.icon} /><strong>{t.label}</strong></span>
                {!DEFAULT_TEMPLATE_IDS.has(t.id) && (
                  <a href="#" className="small-link" style={{ color: "#f43f5e", fontSize: "0.75rem" }} onClick={() => handleDeleteTemplate(t.id)}>
                    Delete
                  </a>
                )}
              </div>
            ))}
          </div>

          {/* Reading Mode hint */}
          <div className="card" style={{ background: "linear-gradient(135deg, #eff6ff, #f0f9ff)", border: "1px solid #bae6fd" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Icon.Book />
              <label style={{ color: "#0369a1" }}>Reading Mode</label>
            </div>
            <p style={{ fontSize: "0.8rem", color: "#0369a1", margin: 0 }}>
              Activate Reading Mode — an AI-generated summary sidebar with paragraph-level Q&A — via right-click → Geminify Actions.
            </p>
          </div>

        </div>
      )}

      <footer>
        Geminify by Hulmify &bull; Powered by {aiProvider === "openrouter" ? "OpenRouter + Gemini Flash" : "Google Gemini"} &copy; 2026
      </footer>
    </div>
  );
};

const root = createRoot(document.getElementById("root"));
root.render(<App />);

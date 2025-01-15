const NO_CONTEXT_TEXT =
  "The context is empty. Select some text on the page to provide context.";

// This script is responsible for the popup UI of the extension.
document.addEventListener("DOMContentLoaded", () => {
  const mainTab = document.getElementById("mainTab");
  const settingsTab = document.getElementById("settingsTab");
  const mainSection = document.getElementById("mainSection");
  const settingsSection = document.getElementById("settingsSection");

  const selectedTextEl = document.getElementById("selectedText");
  const userInputEl = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const responseOutputEl = document.getElementById("responseOutput");

  const apiKeyInput = document.getElementById("apiKeyInput");
  const saveApiKeyBtn = document.getElementById("saveApiKeyBtn");

  // ============================
  // 1. Tab toggling
  // ============================
  mainTab.addEventListener("click", () => {
    mainTab.classList.add("active");
    settingsTab.classList.remove("active");
    mainSection.classList.add("active");
    settingsSection.classList.remove("active");
  });

  settingsTab.addEventListener("click", () => {
    settingsTab.classList.add("active");
    mainTab.classList.remove("active");
    settingsSection.classList.add("active");
    mainSection.classList.remove("active");
  });

  // ============================
  // 2. Retrieve stored text
  // ============================
  chrome.storage.sync.get(["selectedText"], ({ selectedText }) => {
    if (selectedText) {
      selectedTextEl.textContent = selectedText;
    } else {
      selectedTextEl.textContent = NO_CONTEXT_TEXT;
    }
  });

  // ============================
  // 3. Retrieve saved API key
  // ============================
  chrome.storage.sync.get(["googleApiKey"], ({ googleApiKey }) => {
    if (googleApiKey) {
      apiKeyInput.value = googleApiKey;
    }
  });

  // ============================
  // 4. Sending request to ChatGPT
  // ============================

  const handler = async () => {
    // Retrieve the selected text and user input
    const selectedText = selectedTextEl.textContent.trim();
    const userInput = userInputEl.value.trim();

    // If no context or user input
    if (!selectedText && !userInput) {
      responseOutputEl.innerText = "No context or user input provided.";
      responseOutputEl.setAttribute("data-response", "");
      return;
    }

    // If button is disabled
    if (sendBtn.disabled) {
      return;
    }

    // Retrieve the key from storage
    chrome.storage.sync.get(["googleApiKey"], async ({ googleApiKey }) => {
      // If no key found
      if (!googleApiKey) {
        responseOutputEl.innerText =
          "No API key found. Please set it in Settings.";
        responseOutputEl.setAttribute("data-response", "");
        return;
      }

      // Get tab URL
      const tab = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // Call the OpenAI API
      try {
        // Disable the button to prevent multiple requests
        sendBtn.disabled = true;

        // Construct the final prompt from the selected text + user input
        const prompt = `
          System Prompt:
          You are a Geminify a Chrome extension assistance built by Hulmify, you reply to a user's query use the context provided if provided.

          Webpage URL:
          ${tab[0].url}

          Webpage Title:
          ${tab[0].title}
          
          Context:
          ${selectedText || "No context provided."}

          User's request:
          ${userInput || "Summarize the text."}
        `;

        // We must append "?key=YOUR_API_KEY" to the endpoint
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleApiKey}`;

        // Body must match the structure for PaLM/Gemini
        const requestBody = {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        };

        // Fetch from the Google endpoint
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        // Parse the response
        const data = await response.json();

        // Extract the response from the data
        const responseText =
          data?.candidates[0]?.content?.parts[0]?.text ||
          "No response from the Gemini model.";

        // Save the response to storage
        chrome.storage.sync.set({ response: responseText }, () => {
          console.log("Response saved to storage:", responseText);
        });

        // Parse the response as Markdown
        const markdown = window.marked.parse(responseText);

        // Update the UI with the response
        responseOutputEl.innerHTML = markdown;
        responseOutputEl.setAttribute("data-response", responseText);
      } catch (error) {
        // Log the error and update the UI
        console.error("Error:", error);

        // Update the UI with the error message
        responseOutputEl.innerText =
          "An error occurred. Check console for details.";
        responseOutputEl.setAttribute("data-response", "");
      } finally {
        // Re-enable the button
        sendBtn.disabled = false;
      }
    });
  };

  // Handle Enter key press
  userInputEl.addEventListener("keydown", (event) => {
    // If button is disabled, don't do anything
    if (sendBtn.disabled) {
      return;
    }

    // If Enter key is pressed and the control key is not held down
    if (event.key === "Enter" && !event.shiftKey) {
      handler();
    }
  });

  // Attach the handler to the button
  sendBtn.addEventListener("click", handler);

  // ============================
  // 5. Save API Key
  // ============================
  saveApiKeyBtn.addEventListener("click", () => {
    const newKey = apiKeyInput.value.trim();
    if (newKey) {
      chrome.storage.sync.set({ googleApiKey: newKey }, () => {
        alert("API Key saved successfully!");
      });
    } else {
      alert("Please enter a valid API key.");
    }
  });

  // ============================
  // 6. Clear selected text
  // ============================
  const clearTextBtn = document.getElementById("clearSelection");
  clearTextBtn.addEventListener("click", () => {
    // Remove the selected text from storage
    chrome.storage.sync.remove(["selectedText", "response"], () => {
      selectedTextEl.textContent = NO_CONTEXT_TEXT;
      responseOutputEl.innerHTML = "No response yet.";
      responseOutputEl.setAttribute("data-response", "");
    });
  });

  // ============================
  // 7. Select all text
  // ============================
  const selectAllBtn = document.getElementById("selectAll");

  selectAllBtn.addEventListener("click", async () => {
    // Get the active tab
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Get page text
    await chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        function: () => {
          // Get all text from the page
          const documentText = document.body.innerText;

          // Get all values from input, textarea, select
          let allValues = "";
          const getAllValueElements = document.querySelectorAll(
            "input, textarea, select"
          );
          getAllValueElements.forEach((element) => {
            // Get the name
            let name = element.name;

            // Get the value
            let value = element.value;

            // If the name is empty, find the closest label
            if (!name) {
              // Init the index
              let parentLoopIndex = 0;

              // Get the parent element
              let parentElement = element;

              // Loop through the parents
              while (parentLoopIndex < 10) {
                // Get the parent element
                parentElement = parentElement?.parentElement;

                // If no parent element, break the loop
                if (!parentElement) {
                  break;
                }

                // Query the label
                const labelElement = parentElement.querySelector("label");

                // If the labelElement is found?
                if (labelElement) {
                  // Get the name from the label
                  name = labelElement.innerText;

                  // Break the loop
                  break;
                }

                // Increment the index
                parentLoopIndex++;
              }
            }

            // If Select Element? Get the selected option for value
            if (element.tagName === "SELECT") {
              // Get the selected option
              const selectedOption = element.options[element.selectedIndex];

              // Get the value
              value = selectedOption.innerText;
            }

            // Add the value to the list
            allValues += `Name: ${name || element.id || "Unkown"}, Value: ${
              value || "Empty"
            }\n`;
            // End the add the value to the list
          });

          // Return the text
          return `${documentText}${
            allValues ? "\n\n===== Form Values =====\n\n" + allValues : ""
          }`;
        },
      },
      (results) => {
        // Save the selected text
        const text = results[0].result;

        // Save the selected text
        chrome.storage.sync.set({ selectedText: text }, () => {
          console.log("Selected text saved to storage:", text);
        });

        // Set the selected text in the UI
        selectedTextEl.innerText = text;
      }
    );
  });

  // ============================
  // 8. Retrieve stored response
  // ============================
  chrome.storage.sync.get(["response"], ({ response }) => {
    if (response) {
      const markdown = window.marked.parse(response);
      responseOutputEl.innerHTML = markdown;
      responseOutputEl.setAttribute("data-response", response);
    }
  });

  // ============================
  // 9. Copy response to clipboard
  // ============================
  const copyBtn = document.getElementById("copyResponse");

  copyBtn.addEventListener("click", () => {
    const response = responseOutputEl.getAttribute("data-response");
    if (response) {
      navigator.clipboard.writeText(response).then(() => {
        // Store the button text
        const originalText = copyBtn.innerText;

        // Update the UI to show that the text has been copied
        copyBtn.innerText = "Copied!";

        // Reset the text after 2 seconds
        setTimeout(() => {
          copyBtn.innerText = originalText;
        }, 2000);
      });
    }
  });
});

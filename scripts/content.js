// Get background.js messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "refineText") {
    // Get current focussed element
    const element = document.activeElement;

    // Get bounding client rect
    const rect = element.getBoundingClientRect();

    // Add a box after the element
    const box = document.createElement("div");
    box.id = "geminify-box";

    // Position the box
    box.style.position = "absolute";
    box.style.top = `${
      // Add 16px to the top of the element
      rect.top + window.scrollY + element.clientHeight + 16
    }px`;
    box.style.left = `${rect.left + window.scrollX}px`;
    box.style.width = `${element.clientWidth}px`;

    // Light theme styling
    box.style.backgroundColor = "#ffffff"; // Clean white background
    box.style.color = "#333333"; // Dark grey text for readability
    box.style.padding = "12px 16px"; // Balanced spacing
    box.style.borderRadius = "12px"; // Smooth rounded edges
    box.style.zIndex = "9999"; // Ensuring it stays on top
    box.style.boxShadow = "0px 4px 12px rgba(0, 0, 0, 0.1)"; // Soft shadow for depth
    box.style.fontSize = "16px"; // Readable text size
    box.style.lineHeight = "1.5"; // Better readability
    box.style.border = "1px solid #dddddd"; // Light border for structure

    // Append the box to the parent of the element
    document.body.appendChild(box);

    // Add loading text to the box
    box.innerHTML = `<p style="margin: 2px !important;">Refining the text...</p>`;

    // Get the API key from storage
    chrome.storage.sync.get("googleApiKey", ({ googleApiKey }) => {
      // If the API key is not set
      if (!googleApiKey) {
        // Replace the text in the element
        box.innerText =
          "Please set your Geminify API key in the extension options.";
        return;
      }

      // Prompt
      const prompt = `
        You're a Grammer Wizard! You will refine the text provided below.
        Don't change the text, tone or meaning. Just make it better and grammatically correct.
        If you're unsure, you can leave it as it is.

        Text:
        ${message.text.trim()}
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

      // Fetch the API
      fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })
        .then((response) => response.json())
        .then((data) => {
          // Clear the box
          box.innerHTML = "";

          // Extract the response from the data
          let refinedText =
            data?.candidates[0]?.content?.parts[0]?.text ||
            "No response from the Gemini model.";

          // Create a paragraph element
          const paragraph = document.createElement("p");

          // Set the margin of the paragraph
          paragraph.style.margin = "2px 0 !important";

          // Set the text of the paragraph
          paragraph.innerText = refinedText;

          // Replace the text in the element
          box.appendChild(paragraph);

          // Add a copy button
          const copyButton = document.createElement("button");

          // Set the button properties
          copyButton.innerText = "Copy";
          copyButton.style.marginTop = "4px";
          copyButton.style.padding = "4px 8px";
          copyButton.style.color = "#333333";
          copyButton.style.backgroundColor = "#FFFFFF";
          copyButton.style.border = "1px solid #333333";
          copyButton.style.borderRadius = "8px";
          copyButton.style.cursor = "pointer";
          copyButton.style.fontSize = "16px";
          copyButton.style.lineHeight = "1.5";
          copyButton.style.transition = "background-color 0.2s";
          copyButton.style.width = "100%";

          // Add the button to the box
          box.appendChild(copyButton);

          // Add a click event listener to the button
          copyButton.addEventListener("click", () => {
            // Copy the text to the clipboard
            navigator.clipboard.writeText(refinedText);

            // Change button text
            copyButton.innerText = "Copied!";
          });
        })
        .catch((error) => {
          // Replace the text in the element
          box.innerText = "An error occurred while refining the text.";
        });
      // End of fetch
    });

    // Focus the box
    box.focus();
  }
});

// Remove the box when the user clicks outside
document.addEventListener("click", (event) => {
  // Get the box
  const box = document.getElementById("geminify-box");

  // If the box exists and the click is outside the box
  if (box && !box.contains(event.target)) {
    // Remove the box
    box.remove();
  }
});

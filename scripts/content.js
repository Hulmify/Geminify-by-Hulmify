import * as marked from "../ui/marked.min.js";

function addBox(element, text, options = {}) {
  // Remove existing box
  document.getElementById("geminify-box")?.remove();

  // Initialize params
  const SPACING = 16;
  const MAX_HEIGHT = 224;

  // Get bounding client rect
  const rect = element.getBoundingClientRect();

  // Calculate the maximum top position
  const topPosition = rect.top + element.clientHeight + SPACING;

  // Add a box after the element
  const box = document.createElement("div");
  box.id = "geminify-box";

  // Position the box
  box.style.position = "fixed";
  box.style.left = `${rect.left + window.scrollX}px`;
  box.style.width = `${element.clientWidth}px`;

  // If the box fits in the viewport?
  if (topPosition + MAX_HEIGHT < window.innerHeight) {
    // Position the box below the element
    box.style.top = `${topPosition}px`;
  } else {
    // Else, position the bottom of window
    box.style.bottom = `${SPACING}px`;
  }

  // Limit the height of the box
  box.style.maxHeight = `${MAX_HEIGHT}px`;

  // Close button
  const closeButton = document.createElement("button");

  // Set the button ID
  closeButton.id = "geminify-close-button";

  // Set the button properties
  closeButton.innerText = "X";

  // Add a click event listener to the button
  closeButton.addEventListener("click", () => {
    // Remove the box
    box.remove();
  });

  // Add the button to the box
  box.appendChild(closeButton);

  // Add heading element
  const heading = document.createElement("h6");

  // Set heading text
  heading.innerText = "Geminify's Response";

  // Append the heading to the box
  box.appendChild(heading);

  // Add content element
  const contentElement = document.createElement("div");
  contentElement.className = "geminify-content";

  // Set the margin of the content element
  contentElement.style.margin = "0px 8px";

  // Set the text of the content element
  contentElement.innerHTML = marked.parse(text);

  // Replace the text in the element
  box.appendChild(contentElement);

  // Add copy button
  if (options.onCopy) {
    // Add inner div for copy button
    const innerDiv = document.createElement("div");
    innerDiv.className = "geminify-footer";

    // Add the inner div to the box
    box.appendChild(innerDiv);

    // Add a copy button
    const copyButton = document.createElement("button");

    // Set the button ID
    copyButton.id = "geminify-copy-button";

    // Set the button properties
    copyButton.innerText = "Copy";

    // Add the button to the box
    innerDiv.appendChild(copyButton);

    // Add a click event listener to the button
    copyButton.addEventListener("click", () => {
      // Copy the text to the clipboard
      navigator.clipboard.writeText(text);

      // Change button text
      copyButton.innerText = "Copied!";
    });
  }

  // Append the box to the body
  document.body.appendChild(box);

  // Focus the box
  box.focus();
}

function addStyles() {
  // If the styles are already added
  if (document.getElementById("geminify-styles")) {
    return;
  }

  // Add styles to the page
  const style = document.createElement("style");

  // Set the ID of the style
  style.id = "geminify-styles";

  // Set the inner HTML of the style
  style.innerHTML = `
    #geminify-box {
      color: #333333;
      background-color: #FFFFFF;
      border: 1px solid #DDDDDD;
      border-radius: 12px;
      box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
      font-size: 16px;
      line-height: 1.5;
      padding: 12px 16px;
      position: absolute;
      z-index: 2147483647;
      overflow: auto;
    }

    #geminify-box h6 {
      color: #4896bf;
      margin: 0 0 8px;
    }

    #geminify-box p {
      color: inherit;
      margin: 0 !important;
    }

    #geminify-box button#geminify-copy-button {
      margin-top: 4px;
      padding: 4px 8px;
      color: #4896bf;
      background-color: #FFFFFF;
      border: 1px solid #4896bf;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      line-height: 1.5;
      transition: background-color 0.2s;
    }

    #geminify-box button#geminify-copy-button:hover {
      color: #ac48bf;
      border-color: #ac48bf;
    }

    #geminify-box button#geminify-copy-button:active {
      color: #ac48bf;
      border-color: #ac48bf;
    }

    #geminify-box button#geminify-copy-button:focus {
      outline: none;
    }

    #geminify-box button#geminify-close-button {
      background-color: transparent;
      border: none;
      color: #333333;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      position: absolute;
      right: 8px;
      top: 8px;
      border-radius: 50%;
      height: 24px;
      width: 24px;
      transition: background-color 0.3s ease-in-out;
    }

    #geminify-box button#geminify-close-button:hover {
      background-color: #DDDDDD;
    }

    #geminify-box > div.geminify-footer {
      margin-top: 8px;
      text-align: right;
    }
  `
    .replace(/([\r\n]+|\s{2,})/g, " ")
    .trim();

  // Append the styles to the head
  document.head.appendChild(style);
}

// Get background.js messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "refineText") {
    // Get current focussed element
    const element = document.activeElement;

    // Add styles
    addStyles();

    // Add loading text
    addBox(element, "Refining the text...");

    // Get the API key from storage
    chrome.storage.sync.get(
      ["googleApiKey", "refineCustomPrompt"],
      ({ googleApiKey, refineCustomPrompt }) => {
        // If the API key is not set
        if (!googleApiKey) {
          // Replace the text in the element
          box.innerText =
            "Please set your Geminify API key in the extension options.";
          return;
        }

        // Default system prompt
        const systemPrompt = `You're a Grammer Wizard! You will refine the text provided below.
        Don't change the text, tone or meaning. Just make it better and grammatically correct.
        If you're unsure or can't improve it, return the same text.`;

        // Prompt
        const prompt = `${refineCustomPrompt || systemPrompt}

        Text:
        ${message.text.trim()}`;

        // API endpoint
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

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
            "x-goog-api-key": googleApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })
          .then((response) => response.json())
          .then((data) => {
            // Extract the response from the data
            let refinedText =
              data?.candidates[0]?.content?.parts[0]?.text ||
              "No response from the Gemini model.";

            // Replace the text in the element
            addBox(element, refinedText, { onCopy: true });
          })
          .catch((error) => {
            // Replace the text in the element
            addBox(element, "Error occurred while refining the text.");
          });
        // End of fetch
      }
    );
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

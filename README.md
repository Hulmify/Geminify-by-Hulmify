# Gemini by Hulmify

Geminify is a browser extension that helps you summarize or query the content of a webpage using the Google's Gemini API.

## Installation

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" using the toggle switch in the top-right corner.
4. Click "Load unpacked" and select the folder containing this project.

## Permissions

This extension requires the following permissions:

- **contextMenus**: To add custom context menu options.
- **activeTab**: To interact with the currently active browser tab.
- **scripting**: To execute scripts on the webpage.
- **storage**: To store and retrieve extension settings.

## File Structure

- **manifest.json**: Contains extension configuration.
- **service/background.js**: Background service worker for managing events and logic.
- **ui/popup.html**: The HTML file for the popup interface.
- **scripts/content.js**: Scripts that interact with webpage content.
- **icons/**: Directory containing the extension icons in various sizes.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request to suggest changes or report bugs.

## Disclaimer

This is an **unofficial** extension and is not affiliated with or endorsed by Google or the Gemini LLM team.

## License

This project is licensed under the [MIT License](LICENSE).

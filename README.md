# Geminify ✨

**Geminify** is a powerful AI browser assistant that brings intelligent summarization, contextual chat, and multimodal analysis directly to your browser. Use Chrome's new local **Built-in AI** for private, on-device processing, or connect to **Google Gemini** and **OpenRouter** for advanced cloud capabilities!

<img width="1280" height="800" alt="Banner Geminify" src="https://github.com/user-attachments/assets/7f9f43f2-78da-42d0-932e-919d5629faff" />


## 🚀 Key Features

- **Multi-Provider Support**: Choose between local on-device processing (Chrome Built-in AI), Google Gemini (API), or OpenRouter models.
- **Instant Summarization**: Get the gist of any webpage in seconds using the Reading Mode sidebar.
- **Contextual Chat**: Ask questions about the current page and get real-time AI responses directly in the popup.
- **Multimodal Analysis**: Capture page screenshots or attach PDFs for advanced visual and document analysis. (Image support now available for Built-in AI!)
- **Text Refinement**: Use the right-click context menu to fix grammar, make text professional, or change tone in editable fields.
- **Web Insights**: Organize, extract, and save key insights from your browsing with ease.
- **Modern UI**: A clean, React-powered, responsive popup interface with dark mode support and sleek animations.

## 🛠️ Installation (Developer Mode)

To run Geminify from the source:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Hulmify/Geminify-by-Hulmify.git
   cd Geminify-by-Hulmify
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Build the Extension**:
   ```bash
   npm run build
   ```
   *This will create a `dist` folder containing the compiled extension.*

4. **Load into Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable **"Developer mode"** (top-right toggle).
   - Click **"Load unpacked"**.
   - Select the `dist` folder generated in step 3.

## 🔑 AI Providers & Configuration

Geminify supports three different ways to run AI models. Open the extension settings to choose your preferred provider:

### 1. Chrome Built-in AI (Local, On-Device)
Runs locally on your machine using Chrome's integrated Gemini Nano model for maximum privacy and zero API costs.
*Requirements:*
- **Chrome Version**: 131+ (Canary or Dev channel recommended).
- **Setup Flags**: Navigate to `chrome://flags` and configure:
  1. `#optimization-guide-on-device-model` -> **Enabled BypassPerfRequirement**
  2. `#prompt-api-for-gemini-nano` -> **Enabled**
- Restart Chrome and follow the in-app setup guide to download the model if prompted.

### 2. Google Gemini API (Cloud)
Access Google's powerful cloud models like Gemini 1.5 Flash and Pro.
- Head over to [Google AI Studio](https://aistudio.google.com/) to create a free API key.
- Paste the API key into the Geminify settings.

### 3. OpenRouter (Cloud)
Access hundreds of different open-source and proprietary models (Claude, Llama, etc.).
- Get your API key from [OpenRouter](https://openrouter.ai/).
- Select your desired model directly within the Geminify UI.

## 🏗️ Project Structure

- `src/ui/`: React components (JSX) and styles for the extension popup.
- `src/background/`: Service worker for background events, AI downloads, and API handling.
- `src/content/`: Content scripts that interact with webpage content.
- `assets/`: Static assets like icons.
- `webpack.config.js`: Module bundler configuration.

## 💻 Tech Stack

- **Framework**: [React](https://reactjs.org/) (v19)
- **Bundler**: [Webpack](https://webpack.js.org/)
- **Parser**: [Babel](https://babeljs.io/)
- **AI Integration**: Chrome Prompt API, Google Generative AI SDK, OpenRouter API

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

*Disclaimer: This is an **unofficial** extension and is not affiliated with or endorsed by Google.*

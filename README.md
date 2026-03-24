# Geminify ✨

**Geminify** is a powerful AI browser assistant built on Google's Gemini Flash model. Summarize pages, chat with context, and organize web insights instantly—directly within your browser.

![geminify_ss](https://lh3.googleusercontent.com/iyzcDJuomO8rKjnIgG4cBcHBb3-dc6dM0F7v_3anYJELJwQrFwVJF6fE-WenzcKfatTtm4IArifrvZKRp_S08Hwi=s1280-w1280-h800)

## 🚀 Key Features

- **Instant Summarization**: Get the gist of any webpage in seconds.
- **Contextual Chat**: Ask questions about the current page and get real-time AI responses.
- **Web Insights**: Organize and extract key insights from your browsing with ease.
- **Context Menu Integration**: Right-click to trigger actions on selected text.
- **Modern UI**: A clean, React-powered, responsive popup interface.

## 🛠️ Installation (Developer Mode)

To run Geminify from the source:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/Zoeb-Chatriwala/ext.geminify.git
   cd ext.geminify
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

## 🔑 Configuration

To use Geminify, you'll need a Google Gemini API Key:
1. Head over to [Google AI Studio](https://aistudio.google.com/).
2. Create your API key.
3. Open the Geminify popup in your browser and enter the key in the settings.

## 🏗️ Project Structure

- `src/ui/`: React components (JSX) and styles for the extension popup.
- `src/background/`: Service worker for background events and API handling.
- `src/content/`: Content scripts that interact with webpage content.
- `assets/`: Static assets like icons.
- `webpack.config.js`: Module bundler configuration.

## 💻 Tech Stack

- **Framework**: [React](https://reactjs.org/) (v19)
- **Bundler**: [Webpack](https://webpack.js.org/)
- **Parser**: [Babel](https://babeljs.io/)
- **AI Model**: [Google Gemini Flash](https://deepmind.google/technologies/gemini/)

## 📜 License

This project is licensed under the [MIT License](LICENSE).

---

*Disclaimer: This is an **unofficial** extension and is not affiliated with or endorsed by Google.*


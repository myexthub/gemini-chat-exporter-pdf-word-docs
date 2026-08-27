<div align="center">

# AI Chat Export for Gemini – Word, PDF, Google Docs & Markdown Exporter

**The ultimate Google Chrome extension to export, save, and backup your Google Gemini AI conversations into Microsoft Word (.docx), formatted PDF, Google Docs, Markdown (.md), and Plain Text (.txt) with one click!**

[![Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-AI_Chat_Export_for_Gemini-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/ai-chat-export-for-gemini/kajakpocmgpgbgflfkfmiagjmnbjlmjd)
[![MyExtHub](https://img.shields.io/badge/MyExtHub-Official_Extension_Hub-FF4757?style=for-the-badge&logo=hubspot&logoColor=white)](https://myexthub.com/extensions/kajakpocmgpgbgflfkfmiagjmnbjlmjd)
[![Manifest V3](https://img.shields.io/badge/Manifest_V3-Ready-00B894?style=for-the-badge)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: MIT](https://img.shields.io/badge/License-MIT-FDCB6E?style=for-the-badge)](LICENSE)

<br/>

[🚀 Install from Chrome Web Store](https://chromewebstore.google.com/detail/ai-chat-export-for-gemini/kajakpocmgpgbgflfkfmiagjmnbjlmjd) • [⚡ View on MyExtHub](https://myexthub.com/extensions/kajakpocmgpgbgflfkfmiagjmnbjlmjd) • [🐛 Report Issue / Request Feature](https://github.com/myexthub/gemini-chat-exporter-pdf-word-docs/issues)

</div>

---

## 🌟 What is AI Chat Export for Gemini?

**AI Chat Export for Gemini** is a feature-rich, high-performance browser extension designed for students, researchers, developers, copywriters, and professionals who use **Google Gemini** (formerly Bard).

Easily archive, share, and organize your AI conversations without losing formatting. Preserve code syntax highlighting, markdown tables, math equations, and prompt history with seamless 1-click export to all major file formats.

---

## ✨ Key Features & Export Formats

| Format | Output Type | Best For |
| :--- | :---: | :--- |
| 📄 **Microsoft Word (`.docx`)** | Formatted Document | Reports, business proposals, academic essays, and client deliverables |
| 📑 **PDF Document (`.pdf`)** | High-Quality Styled PDF | Clean sharing, printing, archiving, and presentation |
| ☁️ **Google Docs (`.gdoc`)** | Direct Cloud Export | 1-click export directly to your Google Drive |
| 📝 **Markdown (`.md`)** | Clean Markdown | Developers, Obsidian, Notion, Logseq, Roam Research, GitHub |
| 📋 **Plain Text (`.txt`)** | Lightweight Text | Raw conversation logs, notes, and quick indexing |
| ⚡ **Copy to Clipboard** | Formatted / Markdown | Quick pasting into Slack, Discord, Email, or IDEs |

---

## 🚀 Advanced Capabilities

- 🎨 **Preserves Rich Formatting**: Flawlessly retains code blocks with syntax highlighting, mathematical formulas (LaTeX), headers, lists, links, and markdown tables.
- 🔘 **Floating Quick-Action Widget (FAB)**: Sleek on-screen export menu seamlessly integrated into the bottom-right corner of `gemini.google.com`.
- 💬 **Full Chat & Single Response Export**: Export the entire conversation thread or save specific prompt-response pairs.
- ⚡ **Direct Google Drive Integration**: Secure OAuth2 connection for instant 1-click creation of Google Docs directly inside your Google Drive.
- 🔒 **100% Privacy-First & Secure**: Client-side processing. Your private chats, prompts, and personal data never pass through third-party servers.

---

## 🎯 Ideal For & Use Cases

- 👨‍💻 **Software Developers & Engineers**: Save debugging sessions, code snippets, architectural explanations, and technical docs directly into Markdown or Word.
- 🎓 **Students & Academic Researchers**: Export research summaries, literature reviews, citations, and study guides into formatted PDFs.
- ✍️ **Content Creators & Copywriters**: Transfer AI-generated articles, marketing copy, outlines, and video scripts directly to Google Docs or Word.
- 💼 **Business & Product Teams**: Document brainstorms, strategy roadmaps, meeting notes, and analysis reports for easy sharing.

---

## 🚀 Installation & Quick Start

### Option 1: Install from Chrome Web Store (Recommended)
1. Visit the [AI Chat Export for Gemini Chrome Web Store Page](https://chromewebstore.google.com/detail/ai-chat-export-for-gemini/kajakpocmgpgbgflfkfmiagjmnbjlmjd).
2. Click **Add to Chrome**.
3. Open [Google Gemini](https://gemini.google.com) and start chatting — the export widget will automatically appear!

### Option 2: Install from Source (Developer Mode)
1. Clone this repository:
   ```bash
   git clone https://github.com/myexthub/gemini-chat-exporter-pdf-word-docs.git
   ```
2. Open Google Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the `aigeminiexporter` directory containing `manifest.json`.
5. Navigate to [Google Gemini](https://gemini.google.com) and test the export tools.

---

## 📖 How to Use

1. Go to [gemini.google.com](https://gemini.google.com) and open any conversation.
2. Hover over the floating export button in the bottom-right corner.
3. Click your desired export format:
   - **Google Doc / Drive PDF**: Creates document instantly in your Drive.
   - **Word (`.docx`)**: Downloads formatted docx file.
   - **PDF (`.pdf`)**: Generates styled PDF download.
   - **Markdown (`.md`)**: Downloads clean Markdown file.
   - **Copy**: Copies clean text/markdown to clipboard.

---

## 🛠️ Technical Architecture

- **Manifest Version**: Manifest V3 compliant.
- **Engines & Libraries**:
  - `html2pdf.js` & `pdfobject.min.js`: Client-side pixel-perfect DOM-to-PDF rendering.
  - Custom DOCX XML Builder: Clean Microsoft Word document generation.
  - Google Drive REST API v3: Secure OAuth2 authentication for direct Google Docs creation.
- **Content Injection**: Reactive MutationObserver DOM engine designed specifically for Gemini’s Single Page Application (SPA) architecture.

---

## ❓ Frequently Asked Questions (FAQ)

<details>
<summary><b>Does this extension work with Gemini Advanced and Workspace?</b></summary>
<p>Yes! It is fully compatible with both free Google Gemini and Gemini Advanced (Ultra/Pro models).</p>
</details>

<details>
<summary><b>Are code blocks and syntax highlighting preserved in exported files?</b></summary>
<p>Yes. Code blocks retain syntax colors, monospace fonts, and indentation across Word, PDF, and Markdown exports.</p>
</details>

<details>
<summary><b>Is my chat data private and secure?</b></summary>
<p>Absolutely. All document generation is performed 100% locally inside your browser. Files sent to Google Docs are uploaded directly to your own Google Drive account via official Google OAuth2 APIs.</p>
</details>

<details>
<summary><b>How do I manage my Pro account?</b></summary>
<p>You can manage your account and subscription anytime via the <a href="https://myexthub.com/dashboard">MyExtHub Dashboard</a>.</p>
</details>

---

## 🔗 Official Links

- 🛒 **Chrome Web Store**: [AI Chat Export for Gemini](https://chromewebstore.google.com/detail/ai-chat-export-for-gemini/kajakpocmgpgbgflfkfmiagjmnbjlmjd)
- 🌐 **MyExtHub Page**: [Product Details](https://myexthub.com/extensions/kajakpocmgpgbgflfkfmiagjmnbjlmjd)
- 👤 **Account Dashboard**: [MyExtHub Dashboard](https://myexthub.com/dashboard)

---

## 🏷️ GitHub Repository Topics (SEO Tags)

Add these topics in the **About** section of your GitHub repository for maximum search visibility:

`gemini` • `google-gemini` • `gemini-export` • `gemini-to-pdf` • `gemini-to-word` • `gemini-to-docs` • `ai-chat-export` • `chrome-extension` • `manifest-v3` • `pdf-exporter` • `markdown-export` • `productivity` • `myexthub`

---

<div align="center">
  <sub>Built with ❤️ for AI Enthusiasts & Researchers. Powered by <a href="https://myexthub.com">MyExtHub</a>.</sub>
</div>

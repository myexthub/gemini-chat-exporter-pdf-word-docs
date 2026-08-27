/**
 * AI Chat Export for Gemini - Content Script
 * Injects Google G brand logo icon with Docs/PDF submenu & pixel-perfect DOM rendering.
 */

(function () {
  'use strict';

  let isExporting = false; // Debounce flag

  const ICONS = {
    export: `<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`,
    g: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>`,
    gdocs: `<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`,
    gdrive_pdf: `<svg viewBox="0 0 24 24"><path fill="#EA4335" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 8.5c0 .83-.67 1.5-1.5 1.5H7V7h2.5c.83 0 1.5.67 1.5 1.5v3zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H14.5c.83 0 1.5.67 1.5 1.5v5zm3.5-3.5h-2v1h2v1.5h-2v2H16V7h3.5v1.5z"/></svg>`,
    word: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`,
    pdf: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v1.5H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v4zm-7-3H9v1.5h.5V8.5zm3.5 0h-1v3h1v-3zm7.5 5.5h-3.5V7H20v1.5h-2v1h2v1.5h-2v2Z M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/></svg>`,
    md: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M20.56 18H3.44C2.65 18 2 17.37 2 16.59V7.41C2 6.63 2.65 6 3.44 6h17.12c.79 0 1.44.63 1.44 1.41v9.18c0 .78-.65 1.41-1.44 1.41zM4 8v8h2.5v-3.5L8 14.5l1.5-2V16H12V8H9.5L8 10 6.5 8H4zm12.5 8l3-4h-2V8h-2v4h-2l3 4z"/></svg>`,
    txt: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`,
    copy: `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`,
    check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
    external: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>`
  };

  /**
   * Main Controller Init
   */
  function init() {
    console.log('AI Chat Export for Gemini initialized');

    createToastContainer();
    injectBottomRightWidget();

    // Observer for dynamic Gemini response containers
    const observer = new MutationObserver(() => {
      ensureBottomWidgetVisible();
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Inject Bottom Right Floating Export Widget for full chat export
   */
  function injectBottomRightWidget() {
    if (document.querySelector('.gemini-bottom-export-widget')) return;

    const widget = document.createElement('div');
    widget.className = 'gemini-bottom-export-widget';
    
    // Use the extension's actual logo for the FAB
    const iconUrl = chrome.runtime.getURL('icons/icon48.png');

    widget.innerHTML = `
      <div class="gemini-fab-menu">
        <div class="gemini-g-wrapper gemini-fab-item item-1">
          <button class="gemini-widget-btn btn-g" data-tooltip="Google Export">${ICONS.g}</button>
          <div class="gemini-g-menu">
            <div class="gemini-g-menu-item" data-action="gdocs">
              ${ICONS.gdocs} <span>Google Doc</span>
            </div>
            <div class="gemini-g-menu-item" data-action="gdrive_pdf">
              ${ICONS.pdf} <span>PDF Document</span>
            </div>
          </div>
        </div>
        <div class="gemini-fab-item item-2">
          <button class="gemini-widget-btn btn-pdf" data-format="pdf" data-tooltip="PDF">${ICONS.pdf}</button>
        </div>
        <div class="gemini-fab-item item-3">
          <button class="gemini-widget-btn btn-word" data-format="docx" data-tooltip="Word">${ICONS.word}</button>
        </div>
        <div class="gemini-fab-item item-4">
          <button class="gemini-widget-btn btn-md" data-format="md" data-tooltip="Markdown">${ICONS.md}</button>
        </div>
        <div class="gemini-fab-item item-5">
          <button class="gemini-widget-btn btn-txt" data-format="txt" data-tooltip="Text">${ICONS.txt}</button>
        </div>
        <div class="gemini-fab-item item-6">
          <button class="gemini-widget-btn btn-copy" data-format="copy" data-tooltip="Copy">${ICONS.copy}</button>
        </div>
      </div>
      <div class="gemini-fab-main">
        <img src="${iconUrl}" class="gemini-fab-icon" alt="Export" />
      </div>
    `;

    widget.querySelectorAll('.gemini-g-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const act = item.getAttribute('data-action');
        exportFullConversation(act);
      });
    });

    widget.querySelectorAll('.gemini-widget-btn:not(.btn-g)').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const format = e.currentTarget.getAttribute('data-format');
        exportFullConversation(format);
      });
    });

    document.body.appendChild(widget);
  }

  function ensureBottomWidgetVisible() {
    const widget = document.querySelector('.gemini-bottom-export-widget');
    if (!widget) {
      injectBottomRightWidget();
    }
  }

  /**
   * Export Full Chat Conversation
   */
  function exportFullConversation(format) {
    if (isExporting) return;
    isExporting = true;

    chrome.runtime.sendMessage({ action: 'checkStatus' }, (status) => {
      if (chrome.runtime.lastError) {
        console.error('Check status error:', chrome.runtime.lastError);
      }

      if (status && !status.access) {
        showToast('Your free trial has ended. Please upgrade to Pro in the extension popup.', 'error');
        isExporting = false;
        return;
      }

      if (status && status.isTrial) {
        chrome.runtime.sendMessage({ action: 'incrementUsage' });
      }

      const chatTitle = getChatTitle();
      const items = [];

      const rawNodes = document.querySelectorAll('user-query, .user-query-container, [data-test-id="user-query"], model-response, .model-response-text, [data-test-id="model-response"]');

      // Filter out hidden nodes (e.g. hidden drafts) and deduplicate
      const visibleNodes = Array.from(rawNodes).filter(node => {
        const rect = node.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return false;
        if (node.closest('[aria-hidden="true"], .hidden, message-drafts')) return false;
        const style = window.getComputedStyle(node);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        return true;
      });

      const filterNested = (nodeList) => {
        const nodes = Array.from(nodeList);
        return nodes.filter(node => !nodes.some(other => other !== node && other.contains(node)));
      };

      const chatNodes = filterNested(visibleNodes);

      if (chatNodes.length === 0) {
        showToast('No Gemini conversation found on this page.', 'error');
        isExporting = false;
        return;
      }

      for (const node of chatNodes) {
        const isUser = node.matches('user-query, .user-query-container, [data-test-id="user-query"]');
        
        if (isUser) {
          const clone = node.cloneNode(true);
          clone.querySelectorAll('.visually-hidden, .hidden-visually, [aria-hidden="true"]').forEach(el => el.remove());
          const uText = (clone.innerText || clone.textContent).trim().replace(/Treść Twojej wiadomości[:\s]*/gi, '').replace(/User Query[:\s]*/gi, '');
          items.push({
            role: 'user',
            contentHtml: `<span>${escapeXml(uText).replace(/\n/g, '<br>')}</span>`,
            contentText: uText
          });
        } else {
          const mContentNode = node.querySelector('.message-content, .markdown, .response-container-content, div.markdown-main-panel') || node;
          const clone = mContentNode.cloneNode(true);
          clone.querySelectorAll('.visually-hidden, .hidden-visually, [aria-hidden="true"]').forEach(el => el.remove());
          
          let mText = (clone.innerText || clone.textContent).trim();
          mText = mText.replace(/Treść wiadomości Gemini[:\s]*/gi, '').replace(/Gemini Response[:\s]*/gi, '');

          items.push({
            role: 'model',
            contentHtml: clone.innerHTML,
            contentNode: clone,
            contentText: mText
          });
        }
      }

      executeExport(chatTitle, items, format);
    });
  }

  /**
   * Execute Export based on format
   */
  async function executeExport(title, items, format) {
    const sanitizedTitle = sanitizeFilename(title);

    const unlockExport = (delay = 2000) => {
      setTimeout(() => { isExporting = false; }, delay);
    };

    const Exporter = window.DocExporter || DocExporter;

    switch (format) {
      case 'docx':
      case 'word':
        showToast('Generating Microsoft Word document...', 'info');
        try {
          const gdocsHtmlForLocalDocx = Exporter.generateGoogleDocsHtml(title, items);
          chrome.runtime.sendMessage(
            { action: 'DOWNLOAD_DOCX_VIA_GOOGLE_DRIVE_API', title: title, htmlContent: gdocsHtmlForLocalDocx },
            (response) => {
              unlockExport();
              if (response && response.success) {
                showToast('Word document downloaded!', 'success');
              } else {
                showToast(response?.error || 'Failed to download Word document.', 'error');
              }
            }
          );
        } catch (e) {
          console.error('Word error:', e);
          showToast('Word rendering error: ' + e.message, 'error');
          unlockExport();
        }
        break;

      case 'pdf':
        showToast('Rendering high-quality PDF via Google...', 'info');
        try {
          const gdocsHtmlForLocalPdf = Exporter.generateGoogleDocsHtml(title, items);
          chrome.runtime.sendMessage(
            { action: 'DOWNLOAD_PDF_VIA_GOOGLE_DRIVE_API', title: title, htmlContent: gdocsHtmlForLocalPdf },
            (response) => {
              unlockExport();
              if (response && response.success) {
                showToast('PDF downloaded successfully!', 'success');
              } else {
                showToast(response?.error || 'Failed to download PDF.', 'error');
              }
            }
          );
        } catch (e) {
          console.error('PDF error:', e);
          showToast('PDF rendering error: ' + e.message, 'error');
          unlockExport();
        }
        break;

      case 'gdocs':
        showToast('Creating Google Doc in your Drive...', 'info');
        const gdocsHtml = Exporter.generateGoogleDocsHtml(title, items);
        chrome.runtime.sendMessage(
          { action: 'CREATE_GOOGLE_DOC', title: title, htmlContent: gdocsHtml },
          (response) => {
            unlockExport(1000);
            if (response && response.success) {
              showToast('Google Doc created & opened successfully!', 'success');
            } else {
              showToast(response?.error || 'Failed to create Google Doc.', 'error');
            }
          }
        );
        break;

      case 'gdrive_pdf':
        showToast('Creating PDF on Google Drive...', 'info');
        try {
          const gdocsHtmlForPdf = Exporter.generateGoogleDocsHtml(title, items);
          chrome.runtime.sendMessage(
            { action: 'CREATE_GOOGLE_DRIVE_PDF', title: title, htmlContent: gdocsHtmlForPdf },
            (response) => {
              unlockExport(1000);
              if (response && response.success) {
                showToast('Google Drive PDF created & opened successfully!', 'success');
              } else {
                showToast(response?.error || 'Failed to upload PDF to Drive.', 'error');
              }
            }
          );
        } catch (e) {
          console.error('Drive PDF error:', e);
          showToast('Drive PDF error: ' + e.message, 'error');
          unlockExport();
        }
        break;

      case 'md':
        showToast('Generating Markdown file...', 'info');
        const mdText = Exporter.generateMarkdown(title, items);
        const mdBlob = new Blob([mdText], { type: 'text/markdown;charset=utf-8' });
        downloadBlob(mdBlob, `${sanitizedTitle}.md`);
        showToast('Markdown file downloaded!', 'success');
        unlockExport();
        break;

      case 'txt':
        showToast('Generating Text file...', 'info');
        const plainText = Exporter.generatePlainText(title, items);
        const txtBlob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
        downloadBlob(txtBlob, `${sanitizedTitle}.txt`);
        showToast('Text file downloaded!', 'success');
        unlockExport();
        break;

      case 'copy':
        const copyText = Exporter.generateMarkdown(title, items);
        navigator.clipboard.writeText(copyText).then(() => {
          showToast('Copied content to clipboard!', 'success');
        }).catch(err => {
          showToast('Failed to copy: ' + err.message, 'error');
        });
        unlockExport();
        break;

      default:
        console.warn('Unknown format:', format);
        unlockExport(100);
    }
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result.split(',')[1];
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Helper: Download Blob
   */
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    chrome.runtime.sendMessage(
      { action: 'DOWNLOAD_FILE', url: url, filename: filename },
      (response) => {
        if (!response || !response.success) {
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    );
  }

  /**
   * Toast Container & Notifications
   */
  function createToastContainer() {
    if (document.querySelector('.gemini-export-toast-container')) return;
    const container = document.createElement('div');
    container.className = 'gemini-export-toast-container';
    document.body.appendChild(container);
  }

  function showToast(message, type = 'info') {
    const container = document.querySelector('.gemini-export-toast-container') || document.body;

    const toast = document.createElement('div');
    toast.className = `gemini-export-toast toast-${type}`;

    let iconHtml = `<div class="gemini-toast-spinner"></div>`;
    if (type === 'success') iconHtml = `<div class="gemini-toast-icon">${ICONS.check}</div>`;

    toast.innerHTML = `${iconHtml}<span>${escapeXml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    }, 3800);
  }

  function showToastWithLink(message, url, linkText) {
    const container = document.querySelector('.gemini-export-toast-container') || document.body;

    const toast = document.createElement('div');
    toast.className = `gemini-export-toast toast-success`;

    toast.innerHTML = `
      <div class="gemini-toast-icon">${ICONS.check}</div>
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <span>${escapeXml(message)}</span>
        <a href="${escapeXml(url)}" target="_blank" style="color: #8ab4f8; text-decoration: underline; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;">
          ${escapeXml(linkText)} ${ICONS.external}
        </a>
      </div>
    `;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    }, 6000);
  }

  function getChatTitle() {
    const titleEl = document.querySelector('.conversation-title, h1, [data-test-id="chat-title"]');
    if (titleEl && titleEl.textContent.trim()) {
      return titleEl.textContent.trim();
    }
    return document.title.replace(/- Gemini.*$/i, '').trim() || 'Gemini Export';
  }

  function sanitizeFilename(name) {
    return (name || 'Gemini_Export').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_');
  }

  function escapeXml(unsafe) {
    return (unsafe || '').replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
    });
  }

  // Run initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

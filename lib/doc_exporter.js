/**
 * Document Exporter Library for Gemini Chat Export
 * Uses html2pdf.js / html2canvas to render pixel-perfect, HD PDF documents directly from rendered DOM.
 */

class DocExporter {
  /**
   * Convert Gemini conversation to Microsoft Word DOCX Blob
   */
  static generateDocxBlob(title, items) {
    const bodyContent = items.map(item => {
      const isUser = item.role === 'user';
      const roleTitle = isUser ? 'User Query:' : 'Gemini Response:';
      
      const boxStyle = isUser 
        ? 'background-color: #f0f4f9; border-left: 4px solid #1a73e8; padding: 12px 16px; margin: 16px 0; border-radius: 6px;' 
        : 'margin: 20px 0;';

      const cleanHtml = this.cleanGeminiHtml(item.contentHtml || `<p>${this.escapeXml(item.contentText)}</p>`);

      return `
        <div style="${boxStyle}">
          <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; color: #202124; line-height: 1.6;">
            ${cleanHtml}
          </div>
        </div>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />
      `;
    }).join('\n');

    const htmlDoc = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:w="urn:schemas-microsoft-com:office:word" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${this.escapeXml(title)}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page { size: 8.5in 11in; margin: 1.0in; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #202124; }
          h1 { font-size: 20pt; color: #1a73e8; font-weight: bold; margin-bottom: 12px; }
          h2 { font-size: 15pt; color: #202124; font-weight: bold; margin-top: 18px; margin-bottom: 8px; }
          h3 { font-size: 13pt; color: #3c4043; font-weight: bold; margin-top: 14px; margin-bottom: 6px; }
          p { margin-top: 0; margin-bottom: 10px; }
          code { font-family: 'Consolas', 'Courier New', monospace; background-color: #f1f3f4; padding: 2px 5px; border-radius: 3px; font-size: 9.5pt; color: #d93025; }
          pre { background-color: #f8f9fa; border: 1px solid #dadce0; padding: 12px; border-radius: 6px; font-family: 'Consolas', monospace; font-size: 9.5pt; color: #202124; white-space: pre-wrap; margin: 12px 0; }
          table { border-collapse: collapse; width: 100%; margin: 16px 0; }
          th, td { border: 1px solid #dadce0; padding: 8px 12px; text-align: left; }
          th { background-color: #f1f3f4; font-weight: bold; }
          blockquote { border-left: 4px solid #1a73e8; padding-left: 14px; margin-left: 0; color: #5f6368; font-style: italic; }
          ul, ol { padding-left: 24px; margin: 10px 0; }
          li { margin-bottom: 6px; }
        </style>
      </head>
      <body>
        ${bodyContent}
      </body>
      </html>
    `;

    return new Blob([htmlDoc], { type: 'application/msword;charset=utf-8' });
  }

  /**
   * Generate PDF with plain text content - no Gemini HTML, no dark mode
   */
  static async generatePdfDirectDownload(title, items) {
    return new Promise((resolve, reject) => {
      try {
        // Build HTML from PLAIN TEXT only - zero Gemini markup
        let bodyHtml = '';
        for (const item of items) {
          const escapedText = this.escapeXml(item.contentText || '').replace(/\n/g, '<br>');
          if (item.role === 'user') {
            bodyHtml += `<div style="font-weight:bold;border-left:4px solid #1a73e8;padding:10px 14px;margin:16px 0;background-color:#f0f4f9;border-radius:6px;color:#000000;">${escapedText}</div>`;
          } else {
            bodyHtml += `<div style="margin:12px 0;color:#000000;">${escapedText}</div>`;
            bodyHtml += `<hr style="border:none;border-bottom:1px solid #e0e0e0;margin:16px 0;">`;
          }
        }

        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:800px;height:600px;border:none;';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(`<!DOCTYPE html><html><head><style>
          body{background-color:#ffffff;color:#000000;font-family:Arial,sans-serif;line-height:1.6;padding:15px;margin:0;}
        </style></head><body>${bodyHtml}</body></html>`);
        doc.close();

        setTimeout(() => {
          const opt = {
            margin: 10,
            filename: `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: false, logging: false, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };

          html2pdf().set(opt).from(doc.body).save().then(() => {
            document.body.removeChild(iframe);
            resolve();
          }).catch(err => {
            document.body.removeChild(iframe);
            reject(err);
          });
        }, 300);
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * Clean HTML payload for Google Docs API upload
   * Uses tables for reliable Google Docs rendering (backgrounds, borders)
   */
  static generateGoogleDocsHtml(title, items) {
    const bodyContent = items.map(item => {
      const isUser = item.role === 'user';
      const roleTitle = isUser ? 'User Query:' : 'Gemini Response:';

      const cleanContentHtml = this.cleanGeminiHtml(item.contentHtml || `<p>${this.escapeXml(item.contentText)}</p>`);

      const timeStr = new Date().toLocaleString();

      if (isUser) {
        return `<table width="100%" border="0" cellpadding="0" cellspacing="0" style="border: none; margin-bottom: 10px;"><tr style="border: none;"><td align="right" style="border: none; padding: 0;"><table width="75%" border="0" cellpadding="14" cellspacing="0" style="background-color: #f1f3f4; border: none; border-collapse: collapse; border-radius: 18px;"><tr><td style="border: none; text-align: left;"><span style="font-family: Arial, sans-serif; font-size: 11pt; color: #202124;">${cleanContentHtml}</span></td></tr></table></td></tr></table><div style="clear: both;"></div><div style="text-align: right; margin-bottom: 25px;"><span style="font-family: Arial, sans-serif; font-size: 9pt; color: #5f6368; font-style: italic;">${timeStr}</span></div>`;
      }

      return `<div style="font-family: Arial, sans-serif; font-size: 11pt; color: #202124; line-height: 1.6; margin-bottom: 30px;">${cleanContentHtml}</div>`;
    }).join('');

    return `<div style="font-family: Arial, sans-serif; max-width: 750px; margin: 0 auto; color: #202124;">${bodyContent}</div>`;
  }

  /**
   * Sanitizes Gemini HTML nodes for clean text rendering
   */
  static cleanGeminiHtml(rawHtml) {
    if (!rawHtml) return '';

    // Globally strip screen reader text that leaks into the export
    let cleanedHtml = rawHtml
      .replace(/Treść Twojej wiadomości[:\s]*/gi, '')
      .replace(/Treść wiadomości Gemini[:\s]*/gi, '')
      .replace(/User Query[:\s]*/gi, '')
      .replace(/Gemini Response[:\s]*/gi, '');

    const div = document.createElement('div');
    div.innerHTML = cleanedHtml;

    // Remove buttons, UI controls
    const toRemove = div.querySelectorAll('button, .action-bar, .gemini-export-inline-group, .copy-code-button, mat-icon, .citation-chip, [role="button"]');
    toRemove.forEach(el => el.remove());

    // Clean up math blocks / KaTeX elements to clean readable math HTML
    const mathBlocks = div.querySelectorAll('.math-block, katex, math-block');
    mathBlocks.forEach(mb => {
      let tex = mb.getAttribute('data-tex') || mb.innerText || mb.textContent;
      if (tex && tex.trim() !== '') {
        const cleanSpan = document.createElement('div');
        cleanSpan.style.cssText = 'font-family: "Courier New", monospace; background: #f8f9fa; padding: 10px 14px; border-radius: 6px; margin: 12px 0; color: #202124; font-size: 11pt; text-align: center; border: 1px solid #dadce0; font-weight: bold;';
        cleanSpan.textContent = tex;
        mb.replaceWith(cleanSpan);
      }
    });

    // Clean inline math
    const inlineMath = div.querySelectorAll('.math-inline, math-inline');
    inlineMath.forEach(im => {
      let tex = im.getAttribute('data-tex') || im.innerText || im.textContent;
      if (tex && tex.trim() !== '') {
        const cleanSpan = document.createElement('span');
        cleanSpan.style.cssText = 'font-family: "Courier New", monospace; background: #f1f3f4; padding: 2px 6px; border-radius: 3px; color: #1a73e8; font-size: 10pt; font-weight: bold;';
        cleanSpan.textContent = ` [ ${tex} ] `;
        im.replaceWith(cleanSpan);
      }
    });

    // Format code blocks cleanly
    const preBlocks = div.querySelectorAll('pre');
    preBlocks.forEach(pre => {
      pre.style.cssText = 'background-color: #f8f9fa; border: 1px solid #dadce0; padding: 12px; border-radius: 6px; font-family: "Consolas", "Courier New", monospace; font-size: 9.5pt; color: #202124; white-space: pre-wrap; margin: 12px 0; overflow-x: auto;';
    });

    // Format tables cleanly
    const tables = div.querySelectorAll('table');
    tables.forEach(tbl => {
      tbl.style.cssText = 'border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 10pt;';
      tbl.querySelectorAll('th').forEach(th => {
        th.style.cssText = 'border: 1px solid #dadce0; padding: 8px 12px; background-color: #f1f3f4; font-weight: bold; text-align: left;';
      });
      tbl.querySelectorAll('td').forEach(td => {
        td.style.cssText = 'border: 1px solid #dadce0; padding: 8px 12px; text-align: left;';
      });
    });

    // Format lists cleanly
    const lists = div.querySelectorAll('ul, ol');
    lists.forEach(l => {
      l.style.cssText = 'padding-left: 24px; margin: 10px 0;';
    });

    const listItems = div.querySelectorAll('li');
    listItems.forEach(li => {
      li.style.cssText = 'margin-bottom: 6px; line-height: 1.5;';
    });

    return div.innerHTML;
  }

  /**
   * Fallback PDF Generator
   */
  static generateFallbackPdfBlob(title, items) {
    let text = `${title.toUpperCase()}\nExported from Gemini on ${new Date().toLocaleString()}\n${'='.repeat(60)}\n\n`;
    items.forEach(item => {
      const roleHeader = item.role === 'user' ? '[ USER QUERY ]' : '[ GEMINI RESPONSE ]';
      text += `${roleHeader}\n${'-'.repeat(40)}\n${item.contentText}\n\n${'='.repeat(60)}\n\n`;
    });
    return new Blob([text], { type: 'application/pdf' });
  }

  static generateMarkdown(title, items) {
    let md = '';
    items.forEach(item => {
      if (item.contentNode) {
        md += this.domToMarkdown(item.contentNode);
      } else if (item.contentText) {
        md += item.contentText;
      }
      md += `\n\n---\n\n`;
    });
    return md.trim();
  }

  static generatePlainText(title, items) {
    let text = '';
    items.forEach(item => {
      text += `${item.contentText}\n\n${'='.repeat(60)}\n\n`;
    });
    return text.trim();
  }

  static domToMarkdown(node) {
    if (!node) return '';
    let result = '';
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.TEXT_NODE) {
        result += child.textContent;
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const tagName = child.tagName.toLowerCase();

      if (tagName === 'pre' || child.classList.contains('code-block')) {
        const codeElement = child.querySelector('code') || child;
        result += `\n\n\`\`\`\n${codeElement.textContent.trim()}\n\`\`\`\n\n`;
        continue;
      }
      if (tagName === 'code') {
        result += `\`${child.textContent}\``;
        continue;
      }
      if (/^h[1-6]$/.test(tagName)) {
        const level = parseInt(tagName.charAt(1), 10);
        result += `\n\n${'#'.repeat(level)} ${this.domToMarkdown(child).trim()}\n\n`;
        continue;
      }
      if (tagName === 'p') {
        result += `\n\n${this.domToMarkdown(child).trim()}\n\n`;
        continue;
      }
      if (tagName === 'strong' || tagName === 'b') {
        result += `**${this.domToMarkdown(child)}**`;
        continue;
      }
      if (tagName === 'em' || tagName === 'i') {
        result += `*${this.domToMarkdown(child)}*`;
        continue;
      }
      if (tagName === 'ul') {
        const items = Array.from(child.querySelectorAll(':scope > li'));
        result += '\n' + items.map(li => `- ${this.domToMarkdown(li).trim()}`).join('\n') + '\n\n';
        continue;
      }
      if (tagName === 'ol') {
        const items = Array.from(child.querySelectorAll(':scope > li'));
        result += '\n' + items.map((li, idx) => `${idx + 1}. ${this.domToMarkdown(li).trim()}`).join('\n') + '\n\n';
        continue;
      }
      if (tagName === 'blockquote') {
        result += `\n\n> ${this.domToMarkdown(child).trim()}\n\n`;
        continue;
      }
      if (tagName === 'table') {
        result += '\n\n' + this.tableToMarkdown(child) + '\n\n';
        continue;
      }
      result += this.domToMarkdown(child);
    }
    return result.replace(/\n{3,}/g, '\n\n');
  }

  static tableToMarkdown(table) {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (!rows.length) return '';
    let mdTable = '';
    rows.forEach((row, rowIndex) => {
      const cells = Array.from(row.querySelectorAll('th, td')).map(cell => 
        cell.textContent.trim().replace(/\|/g, '\\|').replace(/\n/g, ' ')
      );
      mdTable += `| ${cells.join(' | ')} |\n`;
      if (rowIndex === 0) {
        mdTable += `| ${cells.map(() => '---').join(' | ')} |\n`;
      }
    });
    return mdTable;
  }

  static escapeXml(unsafe) {
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
}

// Global scope attachment for Chrome extension content scripts
if (typeof window !== 'undefined') {
  window.DocExporter = DocExporter;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DocExporter;
}

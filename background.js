import { Premium } from './premium.js';

// Initialize on install & startup
chrome.runtime.onInstalled.addListener(() => {
  Premium.init();
});

chrome.runtime.onStartup.addListener(() => {
  Premium.init();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkStatus') {
    (async () => {
      const status = await Premium.getStatus();
      sendResponse({
        access: status.isTrialActive || status.isSubscribed,
        isTrial: status.isTrialActive,
        isSubscribed: status.isSubscribed,
        usesLeft: status.usesLeft,
        userEmail: status.userEmail
      });

      if (!status.isTrialActive && !status.isSubscribed && status.userEmail) {
        console.log('Background: Triggering background sync...');
        Premium.syncStatus(status.userEmail).then(newStatus => {
          console.log('Background: Sync complete, new status:', newStatus);
        });
      }
    })();
    return true;
  }

  if (request.action === 'syncEmail') {
    console.log('Background: Received syncEmail request', request.email);
    (async () => {
      const { userEmail } = await chrome.storage.sync.get(['userEmail']);
      if (userEmail !== request.email) {
        await chrome.storage.sync.set({ userEmail: request.email });
      }
      const result = await Premium.syncStatus(request.email);
      console.log('Background: Sync result', result);
      sendResponse({ success: true, status: result });
    })();
    return true;
  }

  if (request.action === 'logout') {
    (async () => {
      await Premium.clearSession();
      sendResponse({ success: true });
    })();
    return true;
  }

  if (request.action === 'incrementUsage') {
    (async () => {
      await Premium.incrementUsage();
      sendResponse({ success: true });
    })();
    return true;
  }

  if (request.action === 'DOWNLOAD_FILE') {
    handleFileDownload(request, sendResponse);
    return true;
  }

  if (request.action === 'CREATE_GOOGLE_DOC') {
    handleCreateGoogleDoc(request, sendResponse);
    return true;
  }

  if (request.action === 'CREATE_GOOGLE_DRIVE_PDF') {
    handleCreateGoogleDrivePdf(request, sendResponse);
    return true;
  }

  if (request.action === 'DOWNLOAD_PDF_VIA_GOOGLE_DRIVE_API') {
    handleDownloadPdfViaGoogle(request, sendResponse);
    return true;
  }

  if (request.action === 'DOWNLOAD_DOCX_VIA_GOOGLE_DRIVE_API') {
    handleDownloadDocxViaGoogle(request, sendResponse);
    return true;
  }

  if (request.action === 'CHECK_AUTH' || request.action === 'AUTHORIZE_GOOGLE') {
    handleGoogleAuthAction(request, sendResponse);
    return true;
  }
});

/**
 * Handle direct file download via chrome.downloads API
 */
function handleFileDownload(request, sendResponse) {
  const { url, filename, saveAs } = request;
  if (!url || !filename) {
    sendResponse({ success: false, error: 'Missing download parameters' });
    return;
  }

  chrome.downloads.download(
    {
      url: url,
      filename: filename,
      saveAs: saveAs || false
    },
    (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('Download error:', chrome.runtime.lastError.message);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, downloadId });
      }
    }
  );
}

/**
 * Check or Force Google OAuth Token
 */
async function handleGoogleAuthAction(request, sendResponse) {
  const interactive = request.action === 'AUTHORIZE_GOOGLE';
  const authResult = await getGoogleAuthToken(interactive);

  sendResponse({
    authenticated: !!authResult.token,
    token: authResult.token,
    error: authResult.error,
    extensionId: chrome.runtime.id
  });
}

/**
 * Upload HTML content directly to Google Drive as an editable Google Doc
 */
async function handleCreateGoogleDoc(request, sendResponse) {
  const { title, htmlContent } = request;
  const docTitle = title || 'Gemini Export - ' + new Date().toLocaleDateString();

  try {
    const authResult = await getGoogleAuthToken(true);

    if (!authResult.token) {
      sendResponse({
        success: false,
        error: authResult.error || 'Google Account authorization is required.',
        extensionId: chrome.runtime.id
      });
      return;
    }

    const token = authResult.token;
    const metadata = {
      name: docTitle,
      mimeType: 'application/vnd.google-apps.document'
    };

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeXml(docTitle)}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #202124; margin: 40px; }
    h1 { font-size: 22pt; color: #1a73e8; margin-bottom: 12px; }
    h2 { font-size: 16pt; color: #202124; margin-top: 20px; }
    h3 { font-size: 13pt; color: #3c4043; }
    code { font-family: "Courier New", monospace; background-color: #f1f3f4; padding: 2px 4px; border-radius: 3px; }
    pre { background-color: #f8f9fa; border: 1px solid #dadce0; padding: 12px; border-radius: 6px; overflow-x: auto; }
    blockquote { border-left: 4px solid #1a73e8; margin-left: 0; padding-left: 16px; color: #5f6368; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #dadce0; padding: 8px 12px; text-align: left; }
    th { background-color: #f1f3f4; font-weight: bold; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
      fullHtml +
      close_delim;

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'multipart/related; boundary=' + boundary
      },
      body: multipartRequestBody
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Drive API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const docUrl = data.webViewLink || `https://docs.google.com/document/d/${data.id}/edit`;

    chrome.tabs.create({ url: docUrl });
    sendResponse({ success: true, docUrl, docId: data.id });
  } catch (err) {
    console.error('Google Docs upload error:', err);
    sendResponse({ success: false, error: err.message, extensionId: chrome.runtime.id });
  }
}

/**
 * Generate a perfect text-based PDF using Google Drive API
 * Flow: HTML -> Temp Google Doc -> Export to PDF -> Save PDF -> Delete Temp Doc
 */
async function handleCreateGoogleDrivePdf(request, sendResponse) {
  const { title, htmlContent } = request;
  const docTitle = (title || 'Gemini Export') + '.pdf';

  try {
    const authResult = await getGoogleAuthToken(true);

    if (!authResult.token) {
      sendResponse({
        success: false,
        error: authResult.error || 'Google Account authorization is required.'
      });
      return;
    }

    const token = authResult.token;
    
    // Step 1: Prepare HTML
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeXml(title || 'Gemini Export')}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #202124; margin: 40px; }
    h1 { font-size: 22pt; color: #1a73e8; margin-bottom: 12px; }
    h2 { font-size: 16pt; color: #202124; margin-top: 20px; }
    h3 { font-size: 13pt; color: #3c4043; }
    code { font-family: "Courier New", monospace; background-color: #f1f3f4; padding: 2px 4px; border-radius: 3px; }
    pre { background-color: #f8f9fa; border: 1px solid #dadce0; padding: 12px; border-radius: 6px; overflow-x: auto; }
    blockquote { border-left: 4px solid #1a73e8; margin-left: 0; padding-left: 16px; color: #5f6368; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #dadce0; padding: 8px 12px; text-align: left; }
    th { background-color: #f1f3f4; font-weight: bold; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

    // Step 2: Upload as Temp Google Doc
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const tempMetadata = { name: 'Temp_' + docTitle, mimeType: 'application/vnd.google-apps.document' };
    const tempRequestBody = delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(tempMetadata) + delimiter + 'Content-Type: text/html; charset=UTF-8\r\n\r\n' + fullHtml + close_delim;

    const tempResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'multipart/related; boundary=' + boundary },
      body: tempRequestBody
    });

    if (!tempResponse.ok) throw new Error('Failed to create temporary Google Doc.');
    const tempData = await tempResponse.json();
    const tempDocId = tempData.id;

    // Step 3: Export Temp Doc as PDF Binary
    const exportResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${tempDocId}/export?mimeType=application/pdf`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!exportResponse.ok) throw new Error('Failed to export Google Doc to PDF.');
    const pdfBlob = await exportResponse.blob();

    // Step 4: Upload PDF Blob to Google Drive
    const pdfMetadata = { name: docTitle, mimeType: 'application/pdf' };
    
    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(pdfMetadata)], { type: 'application/json' }));
    formData.append('file', pdfBlob);

    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token },
      body: formData
    });

    if (!uploadResponse.ok) throw new Error('Failed to upload final PDF.');
    const uploadData = await uploadResponse.json();

    // Step 5: Delete Temp Doc in background
    fetch(`https://www.googleapis.com/drive/v3/files/${tempDocId}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    }).catch(e => console.warn('Could not delete temp doc', e));

    const docUrl = uploadData.webViewLink || `https://drive.google.com/file/d/${uploadData.id}/view`;

    chrome.tabs.create({ url: docUrl });
    sendResponse({ success: true, docUrl, docId: uploadData.id });
  } catch (err) {
    console.error('Google Drive PDF upload error:', err);
    sendResponse({ success: false, error: err.message });
  }
}

/**
 * Generate a perfect text-based PDF using Google Drive API and download it locally!
 * Flow: HTML -> Temp Google Doc -> Export to PDF -> Convert to DataURL -> Local Download -> Delete Temp Doc
 */
async function handleDownloadPdfViaGoogle(request, sendResponse) {
  const { title, htmlContent } = request;
  const docTitle = (title || 'Gemini Export') + '.pdf';

  try {
    const authResult = await getGoogleAuthToken(true);
    if (!authResult.token) {
      sendResponse({ success: false, error: authResult.error || 'Google Account authorization required.' });
      return;
    }
    const token = authResult.token;

    // Step 1: Prepare HTML
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeXml(title || 'Gemini Export')}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #202124; margin: 40px; }
    h1 { font-size: 22pt; color: #1a73e8; margin-bottom: 12px; }
    h2 { font-size: 16pt; color: #202124; margin-top: 20px; }
    h3 { font-size: 13pt; color: #3c4043; }
    code { font-family: "Courier New", monospace; background-color: #f1f3f4; padding: 2px 4px; border-radius: 3px; }
    pre { background-color: #f8f9fa; border: 1px solid #dadce0; padding: 12px; border-radius: 6px; overflow-x: auto; }
    blockquote { border-left: 4px solid #1a73e8; margin-left: 0; padding-left: 16px; color: #5f6368; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #dadce0; padding: 8px 12px; text-align: left; }
    th { background-color: #f1f3f4; font-weight: bold; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

    // Step 2: Upload as Temp Google Doc
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const tempMetadata = { name: 'Temp_' + docTitle, mimeType: 'application/vnd.google-apps.document' };
    const tempRequestBody = delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(tempMetadata) + delimiter + 'Content-Type: text/html; charset=UTF-8\r\n\r\n' + fullHtml + close_delim;

    const tempResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'multipart/related; boundary=' + boundary },
      body: tempRequestBody
    });

    if (!tempResponse.ok) throw new Error('Failed to create temporary Google Doc.');
    const tempData = await tempResponse.json();
    const tempDocId = tempData.id;

    // Step 3: Export Temp Doc as PDF Binary
    const exportResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${tempDocId}/export?mimeType=application/pdf`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!exportResponse.ok) throw new Error('Failed to export Google Doc to PDF.');
    const pdfBlob = await exportResponse.blob();

    // Step 4: Delete Temp Doc in background
    fetch(`https://www.googleapis.com/drive/v3/files/${tempDocId}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    }).catch(e => console.warn('Could not delete temp doc', e));

    // Step 5: Convert Blob to Data URL and download locally
    const reader = new FileReader();
    reader.onload = function() {
      const dataUrl = reader.result;
      chrome.downloads.download({ url: dataUrl, filename: docTitle, saveAs: false }, (downloadId) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ success: true, downloadId });
        }
      });
    };
    reader.readAsDataURL(pdfBlob);

  } catch (err) {
    console.error('Google Drive Direct PDF error:', err);
    sendResponse({ success: false, error: err.message });
  }
}

/**
 * Generate a perfect DOCX using Google Drive API and download it locally!
 * Flow: HTML -> Temp Google Doc -> Export to DOCX -> Convert to DataURL -> Local Download -> Delete Temp Doc
 */
async function handleDownloadDocxViaGoogle(request, sendResponse) {
  const { title, htmlContent } = request;
  const docTitle = (title || 'Gemini Export') + '.docx';

  try {
    const authResult = await getGoogleAuthToken(true);
    if (!authResult.token) {
      sendResponse({ success: false, error: authResult.error || 'Google Account authorization required.' });
      return;
    }
    const token = authResult.token;

    // Step 1: Prepare HTML
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeXml(title || 'Gemini Export')}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #202124; margin: 40px; }
    h1 { font-size: 22pt; color: #1a73e8; margin-bottom: 12px; }
    h2 { font-size: 16pt; color: #202124; margin-top: 20px; }
    h3 { font-size: 13pt; color: #3c4043; }
    code { font-family: "Courier New", monospace; background-color: #f1f3f4; padding: 2px 4px; border-radius: 3px; }
    pre { background-color: #f8f9fa; border: 1px solid #dadce0; padding: 12px; border-radius: 6px; overflow-x: auto; }
    blockquote { border-left: 4px solid #1a73e8; margin-left: 0; padding-left: 16px; color: #5f6368; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #dadce0; padding: 8px 12px; text-align: left; }
    th { background-color: #f1f3f4; font-weight: bold; }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;

    // Step 2: Upload as Temp Google Doc
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const tempMetadata = { name: 'Temp_' + docTitle, mimeType: 'application/vnd.google-apps.document' };
    const tempRequestBody = delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(tempMetadata) + delimiter + 'Content-Type: text/html; charset=UTF-8\r\n\r\n' + fullHtml + close_delim;

    const tempResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'multipart/related; boundary=' + boundary },
      body: tempRequestBody
    });

    if (!tempResponse.ok) throw new Error('Failed to create temporary Google Doc.');
    const tempData = await tempResponse.json();
    const tempDocId = tempData.id;

    // Step 3: Export Temp Doc as DOCX Binary
    const exportResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${tempDocId}/export?mimeType=application/vnd.openxmlformats-officedocument.wordprocessingml.document`, {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!exportResponse.ok) throw new Error('Failed to export Google Doc to DOCX.');
    const docxBlob = await exportResponse.blob();

    // Step 4: Delete Temp Doc in background
    fetch(`https://www.googleapis.com/drive/v3/files/${tempDocId}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token }
    }).catch(e => console.warn('Could not delete temp doc', e));

    // Step 5: Convert Blob to Data URL and download locally
    const reader = new FileReader();
    reader.onload = function() {
      const dataUrl = reader.result;
      chrome.downloads.download({ url: dataUrl, filename: docTitle, saveAs: false }, (downloadId) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ success: true, downloadId });
        }
      });
    };
    reader.readAsDataURL(docxBlob);

  } catch (err) {
    console.error('Google Drive Direct DOCX error:', err);
    sendResponse({ success: false, error: err.message });
  }
}

/**
 * Direct Google OAuth Token Request
 */
function getGoogleAuthToken(interactive = true) {
  return new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive: interactive }, (token) => {
      const err = chrome.runtime.lastError;
      if (err || !token) {
        console.warn('OAuth status:', err ? err.message : 'No token');
        resolve({ token: null, error: err ? err.message : 'OAuth not granted' });
      } else {
        resolve({ token, error: null });
      }
    });
  });
}

function base64ToUint8Array(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
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

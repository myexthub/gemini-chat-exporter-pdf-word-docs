/**
 * Popup Script for Gemini Export Extension
 * Manages preferences state and interactive Google Docs authorization.
 */

document.addEventListener('DOMContentLoaded', () => {
  const authBadge = document.getElementById('authBadge');
  const authDesc = document.getElementById('authDesc');
  const authBtn = document.getElementById('authBtn');
  const extIdInfo = document.getElementById('extIdInfo');

  const appContent = document.getElementById('appContent');
  const paywall = document.getElementById('paywall');
  const premiumFooter = document.getElementById('premiumFooter');
  const proUserEmail = document.getElementById('proUserEmail');
  const btnLogin = document.getElementById('btnLogin');
  const btnSignOut = document.getElementById('btnSignOut');

  function checkPremiumStatus() {
    chrome.runtime.sendMessage({ action: 'checkStatus' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Premium check status error:', chrome.runtime.lastError);
        return;
      }

      if (response) {
        if (response.access) {
          appContent.style.display = 'block';
          paywall.style.display = 'none';

          if (response.isSubscribed) {
            if (premiumFooter) premiumFooter.style.display = 'block';
            if (proUserEmail) {
              proUserEmail.textContent = response.userEmail ? `Logged in as ${response.userEmail}` : '';
            }
          } else {
            if (premiumFooter) premiumFooter.style.display = 'none';
          }
        } else {
          appContent.style.display = 'none';
          paywall.style.display = 'flex';
          if (premiumFooter) premiumFooter.style.display = 'none';
        }
      }
    });
  }

  checkPremiumStatus();

  if (btnLogin) {
    btnLogin.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://myexthub.com/dashboard' });
    });
  }

  if (btnSignOut) {
    btnSignOut.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'logout' }, () => {
        window.location.reload();
      });
    });
  }

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && (changes.subscriptionStatus || changes.viewInfoCount || changes.userEmail)) {
      checkPremiumStatus();
    }
  });

  function checkAuthStatus() {
    chrome.runtime.sendMessage({ action: 'CHECK_AUTH' }, (response) => {
      if (response && response.extensionId) {
        extIdInfo.textContent = `Extension ID: ${response.extensionId}`;
      }

      if (response && response.authenticated) {
        authBadge.textContent = 'Connected';
        authBadge.className = 'badge badge-success';
        authBtn.textContent = 'Google Account Connected ✓';
        authBtn.style.color = '#81c995';
        authDesc.textContent = 'Google Drive OAuth is authorized & active.';
      } else {
        authBadge.textContent = 'Not Connected';
        authBadge.className = 'badge badge-warning';
        authBtn.textContent = 'Authorize Google Account';
        authBtn.style.color = '#8ab4f8';
        authDesc.textContent = 'Click below to grant Google Drive authorization popup.';
      }
    });
  }

  checkAuthStatus();

  // Interactive Authorization Button
  authBtn.addEventListener('click', () => {
    authBtn.textContent = 'Authorizing...';
    chrome.runtime.sendMessage({ action: 'AUTHORIZE_GOOGLE' }, (response) => {
      if (response && response.authenticated) {
        authBadge.textContent = 'Connected';
        authBadge.className = 'badge badge-success';
        authBtn.textContent = 'Google Account Connected ✓';
        authBtn.style.color = '#81c995';
        authDesc.textContent = 'Authorization successful!';
      } else {
        authBadge.textContent = 'Failed';
        authBadge.className = 'badge badge-warning';
        authBtn.textContent = 'Retry Authorization';
        authBtn.style.color = '#fdd663';
        authDesc.textContent = response?.error || 'Authorization failed. Check Extension ID matching in Google Console.';
      }
    });
  });
});

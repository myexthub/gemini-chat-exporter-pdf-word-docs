// Content script for myexthub.com domain to sync user authentication status

function checkUserData() {
  const userData = document.getElementById('extension-user-data');
  const isAppDomain = window.location.hostname.includes('myexthub.com');

  if (userData) {
    console.log('MyExtHub Sync: Found user data element', userData);
    if (userData.dataset.email) {
      console.log('MyExtHub Sync: Found email', userData.dataset.email);
      if (chrome.runtime?.id) {
        chrome.runtime.sendMessage({
          action: 'syncEmail',
          email: userData.dataset.email
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('MyExtHub Sync: Sync failed (context invalid?)', chrome.runtime.lastError);
          } else {
            console.log('MyExtHub Sync: Sync response', response);
          }
        });
      }
    } else {
      console.log('MyExtHub Sync: Element found but no email data');
    }
  } else if (isAppDomain) {
    // If on app domain and user data element is missing, check if user was previously logged in
    chrome.storage.sync.get(['userEmail'], (result) => {
      if (result.userEmail) {
        console.log('MyExtHub Sync: User was logged in, but data element missing. Triggering logout...');
        if (chrome.runtime?.id) {
          chrome.runtime.sendMessage({ action: 'logout' });
        }
      }
    });
  }
}

// Run check on load and observe DOM changes for SPA navigation
checkUserData();
const observer = new MutationObserver(checkUserData);
if (document.body) {
  observer.observe(document.body, { childList: true, subtree: true });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, { childList: true, subtree: true });
  });
}

export const Premium = {
    // Initialize
    async init() {
        // --- Enhanced Persistence Logic ---

        // 1. Check sync storage (survives reinstall if sync enabled)
        const syncResult = await chrome.storage.sync.get(['viewInfoCount', 'firstInstallDate']);

        // 2. Check local storage (current install)
        const localResult = await chrome.storage.local.get(['viewInfoCount', 'firstInstallDate']);

        // 3. Check Cookies (survives reinstall even if sync is off)
        let cookieDate = null;
        try {
            const cookie = await chrome.cookies.get({
                url: 'https://myexthub.com',
                name: 'myexthub_trial_start'
            });
            if (cookie) {
                // Cookie values are strings
                cookieDate = parseInt(cookie.value, 10);
            }
        } catch (e) {
            console.warn('Premium: Cookie permission missing or failed.', e);
        }

        let finalCount = 0;
        let finalDate = Date.now();
        let restoreSource = null;

        // Determination Logic: Oldest date wins (to prevent reset)

        // Start with Sync as baseline if available
        if (syncResult.firstInstallDate) {
            finalDate = syncResult.firstInstallDate;
            finalCount = syncResult.viewInfoCount || 0;
            restoreSource = 'sync';
        }

        // Check Local (if older than sync, or sync missing)
        if (localResult.firstInstallDate && localResult.firstInstallDate < finalDate) {
            finalDate = localResult.firstInstallDate;
            finalCount = localResult.viewInfoCount || 0;
            restoreSource = 'local';
        }

        // Check Cookie (if older than current best)
        if (cookieDate && cookieDate < finalDate) {
            finalDate = cookieDate;
            // If we are falling back to cookie, it means Sync and Local are gone or newer (reinstall).
            // To prevent abuse (infinite trial by reinstalling), we assume the trial was used.
            // We set the count to MAX_FREE_USES (3) to expire the trial immediately.

            // Only force expire if we didn't find data in Sync/Local that matched this cookie.
            // (If Sync exists, finalCount is already set from Sync).
            if (!syncResult.firstInstallDate && !localResult.firstInstallDate) {
                finalCount = 3; // MAX_FREE_USES
                restoreSource = 'cookie (expired)';
            } else {
                restoreSource = 'cookie';
            }
        } else if (!cookieDate) {
            // Will set new cookie below
        }

        if (restoreSource) {
            console.log(`Premium: Restored trial data from ${restoreSource}.`, { finalCount, finalDate });
        } else {
            console.log('Premium: New install detected.');
        }

        // --- Persistence / Synchronization ---

        // 1. Update Sync
        if (!syncResult.firstInstallDate || syncResult.firstInstallDate > finalDate) {
            await chrome.storage.sync.set({ viewInfoCount: finalCount, firstInstallDate: finalDate });
        }

        // 2. Update Local
        if (!localResult.firstInstallDate || localResult.firstInstallDate > finalDate) {
            await chrome.storage.local.set({ viewInfoCount: finalCount, firstInstallDate: finalDate });
        }

        // 3. Update Cookie
        try {
            const expirationDate = new Date();
            expirationDate.setFullYear(expirationDate.getFullYear() + 1); // 1 year
            await chrome.cookies.set({
                url: 'https://myexthub.com',
                name: 'myexthub_trial_start',
                value: finalDate.toString(),
                expirationDate: expirationDate.getTime() / 1000
            });
        } catch (e) {
            console.error('Premium: Failed to set cookie', e);
        }
    },

    // Get current access status
    async getStatus() {
        // Always prefer sync for 'truth', fall back to local if needed (though init should sync them)
        const result = await chrome.storage.sync.get(['viewInfoCount', 'subscriptionStatus', 'userEmail', 'installTime', 'firstInstallDate']);
        const count = result.viewInfoCount || 0;

        // Trial settings: 3 uses.
        const MAX_FREE_USES = 3;
        const isSubscribed = result.subscriptionStatus === 'active';

        // Trial logic
        const isTrialActive = !isSubscribed && count < MAX_FREE_USES;

        return {
            isTrialActive,
            isSubscribed,
            usesLeft: Math.max(0, MAX_FREE_USES - count),
            userEmail: result.userEmail
        };
    },

    // Increment usage count
    async incrementUsage() {
        const result = await chrome.storage.sync.get(['viewInfoCount']);
        const current = result.viewInfoCount || 0;
        await chrome.storage.sync.set({ viewInfoCount: current + 1 });
    },

    // Sync status with backend
    async syncStatus(email, retrying = false) {
        if (!email) return;

        try {
            const response = await fetch(`https://myexthub.com/api/status?email=${email}`);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            const newStatus = data.status === 'active' ? 'active' : 'inactive';

            await chrome.storage.sync.set({
                subscriptionStatus: newStatus,
                lastSync: Date.now()
            });
            return newStatus;
        } catch (error) {
            console.error('Sync failed:', error);
            return null;
        }
    },

    // Clear session data (logout)
    async clearSession() {
        await chrome.storage.sync.remove(['userEmail', 'subscriptionStatus', 'lastSync']);
    }
};

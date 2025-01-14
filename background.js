chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'downloadImage') {
    const downloadId = chrome.downloads.download({
      url: request.url,
      filename: request.filename
    }, (downloadId) => {
      // Notify content script that download has started
      chrome.tabs.sendMessage(sender.tab.id, {
        action: 'downloadStarted',
        filename: request.filename
      });
    });
  }
});

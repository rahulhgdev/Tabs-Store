// Handle scheduled URL opening
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('scheduled_urls_')) {
    chrome.storage.local.get(['scheduledUrls'], (result) => {
      const urls = result.scheduledUrls || [];
      if (urls.length > 0) {
        // Open each URL in a new tab
        urls.forEach((url) => {
          chrome.tabs.create({ url, active: false });
        });
      }
    });
  }
});

chrome.commands.onCommand.addListener(function(command) {
  if (command === "save-tabs") {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      const urlsToAdd = tabs.map(tab => tab.url).filter(Boolean);
      const createdDate = new Date();
      const formattedDate = `${createdDate.getDate()}/${createdDate.getMonth() + 1}/${createdDate.getFullYear()}`;

      chrome.storage.local.get({ accordions: [] }, (result) => {
        const accordions = result.accordions || [];
        const quickSaveCount = accordions.filter(item =>
          item.name.startsWith("Quick Save")
        ).length;
        const uniqueName = quickSaveCount === 0 ? "Quick Save_1" : `Quick Save_${quickSaveCount + 1}`;
        accordions.push({ name: uniqueName, date: formattedDate, urls: urlsToAdd });
        chrome.storage.local.set({ accordions });
      });
    });
  }
  if (command === "open-popup") {
    chrome.action.openPopup();
  }
});
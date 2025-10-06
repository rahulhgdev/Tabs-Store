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

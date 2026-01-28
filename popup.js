// ---- Additional Options ---- //
const pinTabs = document.getElementById("pinTabs"); // #tab4
const unpinTabs = document.getElementById("unpinTabs");
const normalReload = document.getElementById("normalReload");
const hardReload = document.getElementById("hardReload");
const closeTabs = document.getElementById("closeTabs");

pinTabs.addEventListener("click", () => { 
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.update(tab.id, { pinned: true });
    });
  });
});

unpinTabs.addEventListener("click", () => {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.update(tab.id, { pinned: false });
    });
  });
});

normalReload.addEventListener('click', () => {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.reload(tab.id);
    });
  });
});

hardReload.addEventListener('click', () => {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.reload(tab.id, { bypassCache: true });
    });
  });
});

closeTabs.addEventListener('click', () => {
  chrome.tabs.query({ currentWindow: true, active: true }, (activeTabs) => {
    const currentTabId = activeTabs[0]?.id;
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      const toRemove = tabs
        .filter(tab => tab.id !== currentTabId)
        .map(tab => tab.id);
      if (toRemove.length > 0) {
        chrome.tabs.remove(toRemove);
      }
    });
  });
});

// ---- Keyboard Shortcuts ---- //
chrome.commands.onCommand.addListener((command) => {
  if (command === "open-popup") {
    chrome.browserAction.openPopup();
  } else if (command === "save-tabs") {
    window.saveButton.click();
  }
});

const saveButton = document.getElementById("saveTabBtn");
const clearTabs = document.getElementById("clearBtn");
const tabList = document.getElementById("urlList");

// Load current active tab's url in chrome storage
chrome.storage.local.get({ urls: [] }, (result) => {
  tabList.innerHTML = "";
  const urls = result.urls;
  if (urls.length === 0) {
    showNoUrlsMessage();
  } else {
    urls.forEach((url) => {
      addUrlToList(url);
    });
  }
});

// To add url to the list
function addUrlToList(url) {
  removeNoUrlsMessage();
  const listItem = document.createElement("li");
  const link = document.createElement("a");
  link.href = url;
  link.textContent = url;
  link.target = "_blank";
  listItem.appendChild(link);
  tabList.appendChild(listItem);
}

// Show empty url message
function showNoUrlsMessage() {
  const msgItem = document.createElement("p");
  msgItem.textContent = "Your URL list is empty. Add now!";
  msgItem.id = "noUrlsMsg";
  tabList.appendChild(msgItem);
}

// Remove empty url message
function removeNoUrlsMessage() {
  const msgItem = document.getElementById("noUrlsMsg");
  if (msgItem) {
    msgItem.remove();
  }
}

// Save current tab's url
saveButton.addEventListener("click", () => {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    chrome.storage.local.get({ urls: [] }, (result) => {
      const savedURLs = result.urls;
      let newUrlsAdded = false;

      tabs.forEach((tab) => {
        const url = tab.url;
        // Check if the URL is valid and not already saved
        if (url && !savedURLs.includes(url)) {
          savedURLs.push(url);
          addUrlToList(url);
          newUrlsAdded = true;
        }
      });

      // Save the updated list back to storage if new URLs were added
      if (newUrlsAdded) {
        chrome.storage.local.set({ urls: savedURLs });
      }

      // If no URLs were added and the list is still empty, show message
      if (savedURLs.length === 0) {
        showNoUrlsMessage();
      }
    });
  });
});

// Clear stored tab's url from chrome storage
clearTabs.addEventListener("click", () => {
  chrome.storage.local.set({ urls: [] }, () => {
    tabList.innerHTML = "";
    showNoUrlsMessage();
  });
});

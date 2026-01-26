// Multi URLs opener and related options
(function(){
  // On popup load, restore textarea URLs from storage or clear if getPreserve is unchecked
  function restoreOrClearMultiUrls() {
    chrome.storage.local.get({ preserveChecked: false, multiUrls: [] }, (result) => {
      window.getPreserve.checked = result.preserveChecked;
      if (window.getPreserve.checked) {
        if (result.multiUrls && result.multiUrls.length > 0) {
          window.multiUrlsTextarea.value = result.multiUrls.join("\n");
        }
      } else {
        window.multiUrlsTextarea.value = "";
        chrome.storage.local.remove("multiUrls");
      }
    });
  }
  restoreOrClearMultiUrls();

  // Save textarea URLs to storage when getPreserve is checked/unchecked or textarea changes
  function saveMultiUrlsIfPreserve() {
    if (window.getPreserve.checked) {
      const urls = window.multiUrlsTextarea.value.split("\n").map(url => url.trim()).filter(url => url !== "");
      chrome.storage.local.set({ multiUrls: urls });
    }
  }
  window.multiUrlsTextarea.addEventListener("input", saveMultiUrlsIfPreserve);

  // Save checkbox state when changed - getPreserve
  window.getPreserve.addEventListener("change", () => {
    chrome.storage.local.set({ preserveChecked: window.getPreserve.checked });
    saveMultiUrlsIfPreserve();
  });

  // Helper for tri-checkbox mutual exclusion and storage
  function handleMutualExclusion(changedCheckbox, checkboxes, storageKeyChanged, storageKeys) {
    if (changedCheckbox.checked) {
      checkboxes.forEach((cb, idx) => {
        if (cb !== changedCheckbox) {
          cb.checked = false;
          cb.disabled = true;
        }
      });
    } else {
      checkboxes.forEach((cb) => {
        if (cb !== changedCheckbox) {
          cb.disabled = false;
        }
      });
    }
    // Persist all states
    let obj = {};
    checkboxes.forEach((cb, idx) => {
      obj[storageKeys[idx]] = cb.checked;
    });
    chrome.storage.local.set(obj);
  }

  // Restore checkbox states from storage (all three)
  chrome.storage.local.get({ openInGroupChecked: false, openInIncognitoChecked: false, openInNewWindowChecked: false }, (result) => {
      window.openInGroup.checked = result.openInGroupChecked;
      window.openInIncognito.checked = result.openInIncognitoChecked;
      window.openInNewWindow.checked = result.openInNewWindowChecked;

      if (window.openInGroup.checked) {
        window.openInIncognito.checked = false;
        window.openInNewWindow.checked = false;
        window.openInIncognito.disabled = true;
        window.openInNewWindow.disabled = true;
        window.openInGroup.disabled = false;
      } else if (window.openInIncognito.checked) {
        window.openInGroup.checked = false;
        window.openInNewWindow.checked = false;
        window.openInGroup.disabled = true;
        window.openInNewWindow.disabled = true;
        window.openInIncognito.disabled = false;
      } else if (window.openInNewWindow.checked) {
        window.openInGroup.checked = false;
        window.openInIncognito.checked = false;
        window.openInGroup.disabled = true;
        window.openInIncognito.disabled = true;
        window.openInNewWindow.disabled = false;
      } else {
        window.openInGroup.disabled = false;
        window.openInIncognito.disabled = false;
        window.openInNewWindow.disabled = false;
      }
    }
  );

  const triCheckboxArr = [window.openInGroup, window.openInIncognito, window.openInNewWindow];
  const triStorageArr = ["openInGroupChecked", "openInIncognitoChecked", "openInNewWindowChecked"];

  window.openInGroup.addEventListener("change", () => {
    handleMutualExclusion(window.openInGroup, triCheckboxArr, "openInGroupChecked", triStorageArr);
  });
  window.openInIncognito.addEventListener("change", () => {
    handleMutualExclusion(window.openInIncognito, triCheckboxArr, "openInIncognitoChecked", triStorageArr);
  });
  window.openInNewWindow.addEventListener("change", () => {
    handleMutualExclusion(window.openInNewWindow, triCheckboxArr, "openInNewWindowChecked", triStorageArr);
  });

  // Open all URLs from textarea in new tabs
  window.openMultiUrlsButton.addEventListener("click", () => {
    let multiUrlList = window.multiUrlsTextarea.value.split("\n").map((url) => url.trim()).filter((url) => url !== "");

    if (multiUrlList.length === 0) {
      alert("Please enter URLs!");
      return;
    }

    // Remove duplicates, keep only first occurrence
    const seen = new Set();
    multiUrlList = multiUrlList.filter(url => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    });
    
    // Open in Incognito if checked
    const incognito = window.openInIncognito.checked;
    if (incognito) {
      chrome.windows.create({
        url: multiUrlList,
        incognito: true
      });
      return;
    }

    // Open in new window if checked
    const newWindow = window.openInNewWindow.checked;
    if (newWindow) {
      if (multiUrlList.length > 0) {
        chrome.windows.create({
          url: multiUrlList
        });
      }
      return;
    }

    if (multiUrlList.length > 0) {
      if (window.openInGroup.checked) {
        // Open all URLs in a tab group
        const tabIds = [];
        let createdCount = 0;
        let firstTabId = null;
        multiUrlList.forEach((url, idx) => {
          chrome.tabs.create({ url, active: false }, (tab) => {
            tabIds.push(tab.id);
            if (idx === 0) firstTabId = tab.id;
            createdCount++;
            // When all tabs are created, group them
            if (createdCount === multiUrlList.length) {
              chrome.tabs.get(firstTabId, (firstTab) => {
                const colors = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"]; 
                const color = colors[Math.floor(Math.random() * colors.length)];
                chrome.tabs.group({ tabIds }, (groupId) => {
                  chrome.tabGroups.update(groupId, { title: firstTab.title, color });
                });
              });
            }
          });
        });
      } else {
        multiUrlList.forEach((url) => {
          chrome.tabs.create({ url, active: false });
        });
      }
    }
  });

  // Extract urls from text
  window.extractURLs.addEventListener("click", ()=> {
    let text = window.multiUrlsTextarea.value;
    if (text.length === 0) {
      alert("Please enter URLs!");
      return;
    }
    let regexToMatch = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
    let matches = text.match(regexToMatch);
    if(matches){
      window.multiUrlsTextarea.value = matches.join('\n');
    }
  })

  // Delete all URLs from textarea and storage
  window.deleteMultiUrlsButton.addEventListener("click", () => {
    window.multiUrlsTextarea.value = "";
    chrome.storage.local.remove("multiUrls");
  });
})();

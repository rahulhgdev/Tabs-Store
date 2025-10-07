const saveButton = document.getElementById("saveTabBtn");
const clearTabs = document.getElementById("clearBtn");
const tabList = document.getElementById("urlList");

const multiUrlsTextarea = document.getElementById("multiUrls");
const openMultiUrlsButton = document.getElementById("openMultiUrls");
const getPreserve = document.getElementById("preserveUrls");
const deleteMultiUrlsButton = document.getElementById("deleteMultiUrls");
const openInGroup = document.getElementById("openInGroup");
const openInIncognito = document.getElementById("openInIncognito");

// ---- SAVE URLs ---- //
// Load current active tab's url in chrome storage
chrome.storage.local.get({ accordions: [] }, (result) => {
  tabList.innerHTML = "";
  const accordions = result.accordions || [];
  if (accordions.length === 0) {
    showNoUrlsMessage();
  } else {
    accordions.forEach((acc) => {
      createAccordion(acc.name, acc.date, acc.urls);
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
  const accordionName = prompt("Enter a name for this accordion:");
  if (!accordionName) return;

  let createdDate = new Date();
  createdDate = `${createdDate.getDate()}/${createdDate.getMonth() + 1}/${createdDate.getFullYear()}`;

  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    const urlsToAdd = [];
    tabs.forEach((tab) => {
      const url = tab.url;
      if (url) {
        urlsToAdd.push(url);
      }
    });

    if (urlsToAdd.length === 0) {
      showNoUrlsMessage();
      return;
    }

    chrome.storage.local.get({ accordions: [] }, (result) => {
      const accordions = result.accordions || [];
      accordions.push({
        name: accordionName,
        date: createdDate,
        urls: urlsToAdd,
      });
      chrome.storage.local.set({ accordions }, () => {
        tabList.innerHTML = "";
        accordions.forEach((acc) => {
          createAccordion(acc.name, acc.date, acc.urls);
        });
      });
    });
  });
});

// Create an accordion with given name, date, and URLs
function createAccordion(name, date, urls) {
  removeNoUrlsMessage();
  const accordion = document.createElement("div");
  accordion.className = "accordion";

  // Accordion header container
  const headerContainer = document.createElement("div");
  headerContainer.className = "headerContainer";

  // Accordion header button
  const header = document.createElement("button");
  header.className = "accordion-header";
  header.innerHTML = `<strong class="acc-name">${name}</strong> <span class="acc-date">(${date})</span>`;
  header.onclick = function () {
    content.style.display = content.style.display === "none" ? "block" : "none";
  };
  headerContainer.appendChild(header);


  // Open All URLs button
  const openAllBtn = document.createElement("button");
  openAllBtn.className = "open-all-btn";
  openAllBtn.innerHTML = '<img src="/images/open-url.png" alt="Open All" height="28" width="28"/>';
  openAllBtn.onclick = function () {
    // Open each URL in a new tab
    urls.forEach((url) => {
      chrome.tabs.create({ active: false, url });
    });
  };
  headerContainer.appendChild(openAllBtn);

  // Download URLs button
  const downloadBtn = document.createElement("button");
  downloadBtn.className = "download-btn";
  downloadBtn.innerHTML = '<img src="/images/downloads.png" alt="Download" height="28" width="28"/>';
  downloadBtn.onclick = function () {
    // Create a simple Excel file using XML
    let xml = `<?xml version="1.0"?>\n` +
      `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
        xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
        xmlns:html="http://www.w3.org/TR/REC-html40">
        <Worksheet ss:Name="URLs">
          <Table>
            <Row><Cell><Data ss:Type="String">URLs</Data></Cell></Row>
            ${urls.map(url => `<Row><Cell><Data ss:Type="String">${url}</Data></Cell></Row>`).join('')}
          </Table>
        </Worksheet>
      </Workbook>`;
    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const urlObj = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = urlObj;
    a.download = `${name.replace(/\s+/g, '_')}_urls.xlsx`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(urlObj);
    }, 100);
  };
  headerContainer.appendChild(downloadBtn);

  // Delete accordion button with confirmation
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.innerHTML = '<img src="/images/delete.png" alt="Delete" height="28" width="28"/>';
  deleteBtn.onclick = function () {
    if (confirm(`Are you sure you want to delete '${name}'?`)) {
      chrome.storage.local.get({ accordions: [] }, (result) => {
        let accordions = result.accordions || [];
        accordions = accordions.filter(
          (acc) => !(acc.name === name && acc.date === date)
        );
        chrome.storage.local.set({ accordions }, () => {
          tabList.innerHTML = "";
          if (accordions.length === 0) {
            showNoUrlsMessage();
          } else {
            accordions.forEach((acc) => {
              createAccordion(acc.name, acc.date, acc.urls);
            });
          }
        });
      });
    }
  };
  headerContainer.appendChild(deleteBtn);

  const content = document.createElement("div");
  content.className = "accordion-content";
  content.style.display = "none";

  const urlList = document.createElement("ul");
  urls.forEach((url) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = url;
    a.textContent = url;
    a.target = "_blank";
    li.appendChild(a);
    urlList.appendChild(li);
  });
  content.appendChild(urlList);

  accordion.appendChild(headerContainer);
  accordion.appendChild(content);
  tabList.appendChild(accordion);
}

// ---- Multi URLs Opener ---- //

// On popup load, restore textarea URLs from storage or clear if getPreserve is unchecked
function restoreOrClearMultiUrls() {
  chrome.storage.local.get({ preserveChecked: false, multiUrls: [] }, (result) => {
    getPreserve.checked = result.preserveChecked;
    if (getPreserve.checked) {
      if (result.multiUrls && result.multiUrls.length > 0) {
        multiUrlsTextarea.value = result.multiUrls.join("\n");
      }
    } else {
      multiUrlsTextarea.value = "";
      chrome.storage.local.remove("multiUrls");
    }
  });
}
restoreOrClearMultiUrls();

// Save textarea URLs to storage when getPreserve is checked/unchecked or textarea changes
function saveMultiUrlsIfPreserve() {
  if (getPreserve.checked) {
    const urls = multiUrlsTextarea.value.split("\n").map(url => url.trim()).filter(url => url !== "");
    chrome.storage.local.set({ multiUrls: urls });
  }
}
multiUrlsTextarea.addEventListener("input", saveMultiUrlsIfPreserve);

// Save checkbox state when changed - getPreserve
getPreserve.addEventListener("change", () => {
  chrome.storage.local.set({ preserveChecked: getPreserve.checked });
  saveMultiUrlsIfPreserve();
});

// Store status of checkbox
chrome.storage.local.get({ openInGroupChecked: false }, (result) => {
  openInGroup.checked = result.openInGroupChecked;
});

// Save checkbox state when changed - openInGroup
openInGroup.addEventListener("change", () => {
  chrome.storage.local.set({ openInGroupChecked: openInGroup.checked });
  if (openInGroup.checked) {
    openInIncognito.checked = false;
    openInIncognito.disabled = true;
  } else {
    openInIncognito.disabled = false;
  }
});

// Store status of checkbox
chrome.storage.local.get({ openInIncognitoChecked: false }, (result) => {
  openInIncognito.checked = result.openInIncognitoChecked;
});

// Save checkbox state when changed - openInGroup
openInIncognito.addEventListener("change", () => {
  chrome.storage.local.set({ openInIncognitoChecked: openInIncognito.checked });
  if (openInIncognito.checked) {
    openInGroup.checked = false;
    openInGroup.disabled = true;
  } else {
    openInGroup.disabled = false;
  }
});


// Open all URLs from textarea in new tabs
openMultiUrlsButton.addEventListener("click", () => {
  let multiUrlList = multiUrlsTextarea.value.split("\n").map((url) => url.trim()).filter((url) => url !== "");
  // Remove duplicates, keep only first occurrence
  const seen = new Set();
  multiUrlList = multiUrlList.filter(url => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
  
  // Open in Incognito if checked
  const incognito = openInIncognito.checked;
  if (incognito) {
    openInGroup.att
    chrome.windows.create({
      url: multiUrlList,
      incognito: true
    });
    return;
  }

  if (multiUrlList.length > 0) {
    if (openInGroup.checked) {
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

// Delete all URLs from textarea and storage
deleteMultiUrlsButton.addEventListener("click", () => {
  multiUrlsTextarea.value = "";
  chrome.storage.local.remove("multiUrls");
});

// ---- Keyboard Shortcuts ---- //
chrome.commands.onCommand.addListener((command) => {
  if (command === "open-popup") {
    chrome.browserAction.openPopup();
  } else if (command === "save-tabs") {
    saveButton.click();
  }
});
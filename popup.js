const help = document.getElementById("help"); //help
const saveButton = document.getElementById("saveTabBtn"); // #tab1
const clearTabs = document.getElementById("clearBtn");
const tabList = document.getElementById("urlList");
const multiUrlsTextarea = document.getElementById("multiUrls"); // #tab2
const openMultiUrlsButton = document.getElementById("openMultiUrls");
const getPreserve = document.getElementById("preserveUrls");
const deleteMultiUrlsButton = document.getElementById("deleteMultiUrls");
const openInGroup = document.getElementById("openInGroup");
const openInIncognito = document.getElementById("openInIncognito");
const openInNewWindow =  document.getElementById("openInNewWindow");
const oneTimeScheduler = document.getElementById('oneTimeScheduler'); // #tab3
const dailyScheduler = document.getElementById('dailyScheduler');
const multiScheduleUrls = document.getElementById('multiScheduleUrls');
const scheduleDate = document.getElementById('scheduleDate');
const scheduleTime = document.getElementById('scheduleTime');
const dailyTime = document.getElementById('dailyTime');
const oneTimePicker = document.getElementById('oneTimePicker');
const dailyPicker = document.getElementById('dailyPicker');
const cancelOneTime = document.getElementById('cancelOneTime');
const cancelDaily = document.getElementById('cancelDaily');
const pinTabs = document.getElementById("pinTabs"); // #tab4
const unpinTabs = document.getElementById("unpinTabs");
const normalReload = document.getElementById("normalReload");
const hardReload = document.getElementById("hardReload");
const closeTabs = document.getElementById("closeTabs");

 
// Help
help.addEventListener('click', ()=>{
  chrome.tabs.create({url: "help.html"});
})

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
    openInGroup.checked = result.openInGroupChecked;
    openInIncognito.checked = result.openInIncognitoChecked;
    openInNewWindow.checked = result.openInNewWindowChecked;

    if (openInGroup.checked) {
      openInIncognito.checked = false;
      openInNewWindow.checked = false;
      openInIncognito.disabled = true;
      openInNewWindow.disabled = true;
      openInGroup.disabled = false;
    } else if (openInIncognito.checked) {
      openInGroup.checked = false;
      openInNewWindow.checked = false;
      openInGroup.disabled = true;
      openInNewWindow.disabled = true;
      openInIncognito.disabled = false;
    } else if (openInNewWindow.checked) {
      openInGroup.checked = false;
      openInIncognito.checked = false;
      openInGroup.disabled = true;
      openInIncognito.disabled = true;
      openInNewWindow.disabled = false;
    } else {
      openInGroup.disabled = false;
      openInIncognito.disabled = false;
      openInNewWindow.disabled = false;
    }
  }
);

const triCheckboxArr = [openInGroup, openInIncognito, openInNewWindow];
const triStorageArr = ["openInGroupChecked", "openInIncognitoChecked", "openInNewWindowChecked"];

openInGroup.addEventListener("change", () => {
  handleMutualExclusion(openInGroup, triCheckboxArr, "openInGroupChecked", triStorageArr);
});
openInIncognito.addEventListener("change", () => {
  handleMutualExclusion(openInIncognito, triCheckboxArr, "openInIncognitoChecked", triStorageArr);
});
openInNewWindow.addEventListener("change", () => {
  handleMutualExclusion(openInNewWindow, triCheckboxArr, "openInNewWindowChecked", triStorageArr);
});

// Open all URLs from textarea in new tabs
openMultiUrlsButton.addEventListener("click", () => {
  let multiUrlList = multiUrlsTextarea.value.split("\n").map((url) => url.trim()).filter((url) => url !== "");

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
  const incognito = openInIncognito.checked;
  if (incognito) {
    chrome.windows.create({
      url: multiUrlList,
      incognito: true
    });
    return;
  }

  // Open in new window if checked
  const newWindow = openInNewWindow.checked;
  if (newWindow) {
    if (multiUrlList.length > 0) {
      chrome.windows.create({
        url: multiUrlList
      });
    }
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

// ---- URLs scheduler ---- //

// Cancel button
cancelOneTime.addEventListener('click', () => {
  oneTimePicker.style.display = 'none'; 
  oneTimeScheduler.textContent = 'Schedule One Time';
  scheduleDate.value = '';
  scheduleTime.value = '';
});

cancelDaily.addEventListener('click', () => {
  dailyPicker.style.display = 'none';
  dailyScheduler.textContent = 'Schedule Daily';
  dailyTime.value = '';
});

// Preserve scheduled URLs in storage
function saveScheduledUrls() {
  const urls = multiScheduleUrls.value.split("\n").map(url => url.trim()).filter(url => url !== "");
  chrome.storage.local.set({ scheduledUrlsText: urls });
}

// Restore scheduled URLs from storage on popup load
function restoreScheduledUrls() {
  chrome.storage.local.get(['scheduledUrlsText'], (result) => {
    if (result.scheduledUrlsText && result.scheduledUrlsText.length > 0) {
      multiScheduleUrls.value = result.scheduledUrlsText.join("\n");
    }
  });
}

// Save URLs when textarea changes
multiScheduleUrls.addEventListener("input", saveScheduledUrls);

// Restore URLs on popup load
restoreScheduledUrls();

// One-time scheduler
oneTimeScheduler.addEventListener("click", () => {
  const urls = multiScheduleUrls.value.split("\n").map(url => url.trim()).filter(url => url !== "");
  
  if (urls.length === 0) {
    alert("Please enter URLs to schedule!");
    return;
  }
  
  if (oneTimePicker.style.display === 'none') {
    oneTimePicker.style.display = 'block';
    oneTimeScheduler.textContent = 'Confirm Schedule';
    return;
  }
  
  const selectedDate = scheduleDate.value;
  const selectedTime = scheduleTime.value;
  if (!selectedDate || !selectedTime) {
    alert("Please select both date and time!");
    return;
  }
  
  const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}`);
  const now = new Date();
  if (scheduledDateTime <= now) {
    alert("Please select a future date and time!");
    return;
  }
  
  // Save URLs to storage
  chrome.storage.local.set({ scheduledUrls: urls }, () => {
    // Create alarm for one-time scheduling
    const alarmName = `scheduled_urls_onetime_${Date.now()}`;
    chrome.alarms.create(alarmName, {
      when: scheduledDateTime.getTime()
    });
    
    alert(`URLs scheduled to open on ${selectedDate} at ${selectedTime}`);
    
    oneTimePicker.style.display = 'none';
    oneTimeScheduler.textContent = 'Schedule One Time';
    scheduleDate.value = "";
    scheduleTime.value = "";
  });
});

// Daily scheduler
dailyScheduler.addEventListener("click", () => {
  const urls = multiScheduleUrls.value.split("\n").map(url => url.trim()).filter(url => url !== "");
  
  if (urls.length === 0) {
    alert("Please enter URLs to schedule!");
    return;
  }
  
  if (dailyPicker.style.display === 'none') {
    dailyPicker.style.display = 'block';
    dailyScheduler.textContent = 'Confirm Schedule';
    return;
  }
  
  const selectedTime = dailyTime.value;
  if (!selectedTime) {
    alert("Please select a time!");
    return;
  }
  
  // Parse the time
  const [hours, minutes] = selectedTime.split(':').map(Number);
  
  // Calculate the next occurrence of the specified time
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);
  
  // If the time has already passed today, schedule for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }
  
  // Save URLs to storage
  chrome.storage.local.set({ scheduledUrls: urls }, () => {
    // Create alarm for daily scheduling
    const alarmName = `scheduled_urls_daily_${Date.now()}`;
    chrome.alarms.create(alarmName, {
      when: scheduledTime.getTime(),
      periodInMinutes: 24 * 60 // Repeat every 24 hours
    });
    
    alert(`URLs scheduled to open daily at ${selectedTime}`);
    
    dailyPicker.style.display = 'none';
    dailyScheduler.textContent = 'Schedule Daily';
    dailyTime.value = "";
  });
});

// ---- Additional Options ---- //
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
// normal reload
normalReload.addEventListener('click', () => {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.reload(tab.id);
    });
  });
});

// hard reload - browser bypasses the local cache and forces the tab to fetch everything freshly from the server.
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
    saveButton.click();
  }
});

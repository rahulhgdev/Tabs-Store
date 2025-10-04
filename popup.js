const saveButton = document.getElementById("saveTabBtn");
const clearTabs = document.getElementById("clearBtn");
const tabList = document.getElementById("urlList");

const multiUrlsTextarea = document.getElementById("multiUrls");
const openMultiUrlsButton = document.getElementById("openMultiUrls");
const getPreserve = document.getElementById("preserveUrls");
const deleteMultiUrlsButton = document.getElementById("deleteMultiUrls");

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
      chrome.tabs.create({ url });
    });
  };
  headerContainer.appendChild(openAllBtn);

  // Delete accordion button
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.innerHTML = '<img src="/images/delete.png" alt="Delete" height="28" width="28"/>';
  deleteBtn.onclick = function () {
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

// On popup load, restore textarea URLs from storage
chrome.storage.local.get({ multiUrls: [] }, (result) => {
  if (result.multiUrls && result.multiUrls.length > 0) {
    multiUrlsTextarea.value = result.multiUrls.join("\n");
  }
});

// Save textarea URLs to storage when getPreserve is checked/unchecked or textarea changes
function saveMultiUrlsIfPreserve() {
  if (getPreserve.checked) {
    const urls = multiUrlsTextarea.value.split("\n").map(url => url.trim()).filter(url => url !== "");
    chrome.storage.local.set({ multiUrls: urls });
  }
}

// Clear textarea and storage if unchecked
if(!getPreserve.checked){
  multiUrlsTextarea.value = "";
  chrome.storage.local.remove("multiUrls")
}
multiUrlsTextarea.addEventListener("input", saveMultiUrlsIfPreserve);

// Store status of checkbox
chrome.storage.local.get({ preserveChecked: false }, (result) => {
  getPreserve.checked = result.preserveChecked;
});

// Save checkbox state when changed
getPreserve.addEventListener("change", () => {
  chrome.storage.local.set({ preserveChecked: getPreserve.checked });
  saveMultiUrlsIfPreserve();
});

// Open all URLs from textarea in new tabs
openMultiUrlsButton.addEventListener("click", () => {
  let multiUrlList = multiUrlsTextarea.value.split("\n").map((url) => url.trim()).filter((url) => url !== "");
  // To Remove duplicates, keep only first occurrence
  const seen = new Set();
  multiUrlList = multiUrlList.filter(url => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
  if (multiUrlList.length > 0) {
    multiUrlList.forEach((url) => {
      chrome.tabs.create({ url });
    });
  }
});

// Delete all URLs from textarea and storage
deleteMultiUrlsButton.addEventListener("click", () => {
  multiUrlsTextarea.value = "";
  chrome.storage.local.remove("multiUrls");
});
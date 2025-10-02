const saveButton = document.getElementById("saveTabBtn");
const clearTabs = document.getElementById("clearBtn");
const tabList = document.getElementById("urlList");

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

  const createdDate = new Date().toLocaleString();

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
  headerContainer.style.display = "flex";
  headerContainer.style.alignItems = "center";
  headerContainer.style.gap = "16px";

  // Accordion header button
  const header = document.createElement("button");
  header.className = "accordion-header";
  header.textContent = `${name} (${date})`;
  header.style.flex = "1";
  header.onclick = function () {
    content.style.display = content.style.display === "none" ? "block" : "none";
  };
  headerContainer.appendChild(header);

  // Open All URLs button
  const openAllBtn = document.createElement("button");
  openAllBtn.textContent = "Open All URLs";
  openAllBtn.onclick = function () {
    // Open each URL in a new tab
    urls.forEach((url) => {
      chrome.tabs.create({ url });
    });
  };
  headerContainer.appendChild(openAllBtn);

  // Delete accordion button
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
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

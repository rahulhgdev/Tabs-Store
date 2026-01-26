// Accordion and saved-URLs logic
(function(){
  // Load current active tab's url in chrome storage
  chrome.storage.local.get({ accordions: [] }, (result) => {
    window.tabList.innerHTML = "";
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
  window.addUrlToList = function(url) {
    removeNoUrlsMessage();
    const listItem = document.createElement("li");
    const link = document.createElement("a");
    link.href = url;
    link.textContent = url;
    link.target = "_blank";
    listItem.appendChild(link);
    window.tabList.appendChild(listItem);
  }

  // Show empty url message
  window.showNoUrlsMessage = function() {
    const msgItem = document.createElement("p");
    msgItem.textContent = "Your URL list is empty. Add now!";
    msgItem.id = "noUrlsMsg";
    window.tabList.appendChild(msgItem);
  }

  // Remove empty url message
  window.removeNoUrlsMessage = function() {
    const msgItem = document.getElementById("noUrlsMsg");
    if (msgItem) {
      msgItem.remove();
    }
  }

  // Save current tab's url
  window.saveButton.addEventListener("click", () => {
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
          window.tabList.innerHTML = "";
          accordions.forEach((acc) => {
            createAccordion(acc.name, acc.date, acc.urls);
          });
        });
      });
    });
  });

  // Create an accordion with given name, date, and URLs
  window.createAccordion = function(name, date, urls) {
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
      // Create a simple TXT file containing all URLs (one per line)
      const content = urls.join('\n');
      const blob = new Blob([content], { type: 'text/plain' });
      const urlObj = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlObj;
      a.download = `${name.replace(/\s+/g, '_')}_urls.txt`;
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
            window.tabList.innerHTML = "";
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
    window.tabList.appendChild(accordion);
  }
})();

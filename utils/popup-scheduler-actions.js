// Scheduler and additional tab actions
(function(){
  // Get confirm button references
  const confirmOneTime = document.getElementById('confirmOneTime');
  const confirmDaily = document.getElementById('confirmDaily');
  
  // Cancel button
  window.cancelOneTime.addEventListener('click', () => {
    window.oneTimePicker.style.display = 'none'; 
    window.oneTimeScheduler.textContent = 'Schedule Now';
    setDefaultDateTimePickers();
  });

  window.cancelDaily.addEventListener('click', () => {
    window.dailyPicker.style.display = 'none';
    window.dailyScheduler.textContent = 'Schedule Now';
    setDefaultDateTimePickers();
  });

  // Preserve scheduled URLs in storage
  function saveScheduledUrls() {
    const urls = window.multiScheduleUrls.value.split("\n").map(url => url.trim()).filter(url => url !== "");
    chrome.storage.local.set({ scheduledUrlsText: urls });
  }

  // Restore scheduled URLs from storage on popup load
  function restoreScheduledUrls() {
    chrome.storage.local.get(['scheduledUrlsText'], (result) => {
      if (result.scheduledUrlsText && result.scheduledUrlsText.length > 0) {
        window.multiScheduleUrls.value = result.scheduledUrlsText.join("\n");
      }
    });
  }

  // Save URLs when textarea changes
  window.multiScheduleUrls.addEventListener("input", saveScheduledUrls);

  // Restore URLs on popup load
  restoreScheduledUrls();

  // Set current date and time as default for one-time and daily scheduler
  function setDefaultDateTimePickers() {
    const now = new Date();
    // Format date as YYYY-MM-DD
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;
    window.scheduleDate.value = formattedDate;

    // Format time as HH:MM
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedTime = `${hours}:${minutes}`;
    window.scheduleTime.value = formattedTime;
    window.dailyTime.value = formattedTime;
  }
  setDefaultDateTimePickers();

  // One-time scheduler
  window.oneTimeScheduler.addEventListener("click", () => {
    const urls = window.multiScheduleUrls.value.split("\n").map(url => url.trim()).filter(url => url !== "");
    
    if (urls.length === 0) {
      alert("Please enter URLs to schedule!");
      return;
    }
    
    if (window.oneTimePicker.style.display === 'none') {
      window.oneTimePicker.style.display = 'block';
      window.oneTimeScheduler.textContent = 'Schedule Now';
      return;
    }
  });

  // Confirm One-Time Schedule
  confirmOneTime.addEventListener("click", () => {
    const urls = window.multiScheduleUrls.value.split("\n").map(url => url.trim()).filter(url => url !== "");
    
    const selectedDate = window.scheduleDate.value;
    const selectedTime = window.scheduleTime.value;
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
      
      alert(`✓ URLs scheduled to open on ${selectedDate} at ${selectedTime}`);
      
      window.oneTimePicker.style.display = 'none';
      window.oneTimeScheduler.textContent = 'Schedule Now';
      window.scheduleDate.value = "";
      window.scheduleTime.value = "";
    });
  });

  // Daily scheduler
  window.dailyScheduler.addEventListener("click", () => {
    const urls = window.multiScheduleUrls.value.split("\n").map(url => url.trim()).filter(url => url !== "");
    
    if (urls.length === 0) {
      alert("Please enter URLs to schedule!");
      return;
    }
    
    if (window.dailyPicker.style.display === 'none') {
      window.dailyPicker.style.display = 'block';
      window.dailyScheduler.textContent = 'Schedule Now';
      return;
    }
  });

  // Confirm Daily Schedule
  confirmDaily.addEventListener("click", () => {
    const urls = window.multiScheduleUrls.value.split("\n").map(url => url.trim()).filter(url => url !== "");
    
    const selectedTime = window.dailyTime.value;
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
      
      alert(`✓ URLs scheduled to open daily at ${selectedTime}`);
      
      window.dailyPicker.style.display = 'none';
      window.dailyScheduler.textContent = 'Schedule Now';
      window.dailyTime.value = "";
    });
  });

  // ---- Additional Options ---- //
  window.pinTabs.addEventListener("click", () => { 
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.update(tab.id, { pinned: true });
      });
    });
  });

  window.unpinTabs.addEventListener("click", () => {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.update(tab.id, { pinned: false });
      });
    });
  });
  // normal reload
  window.normalReload.addEventListener('click', () => {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.reload(tab.id);
      });
    });
  });

  // hard reload - browser bypasses the local cache and forces the tab to fetch everything freshly from the server.
  window.hardReload.addEventListener('click', () => {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.reload(tab.id, { bypassCache: true });
      });
    });
  });

  window.closeTabs.addEventListener('click', () => {
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
      chrome.browserAction.openPopup && chrome.browserAction.openPopup();
    } else if (command === "save-tabs") {
      window.saveButton.click();
    }
  });
})();

// DOM references exposed on window for other scripts
window.help = document.getElementById("help"); //help
window.saveButton = document.getElementById("saveTabBtn"); // #tab1
window.clearTabs = document.getElementById("clearBtn");
window.tabList = document.getElementById("urlList");
window.multiUrlsTextarea = document.getElementById("multiUrls"); // #tab2
window.openMultiUrlsButton = document.getElementById("openMultiUrls");
window.extractURLs = document.getElementById("extractURLs");
window.getPreserve = document.getElementById("preserveUrls");
window.deleteMultiUrlsButton = document.getElementById("deleteMultiUrls");
window.openInGroup = document.getElementById("openInGroup");
window.openInIncognito = document.getElementById("openInIncognito");
window.openInNewWindow = document.getElementById("openInNewWindow");
window.oneTimeScheduler = document.getElementById('oneTimeScheduler'); // #tab3
window.dailyScheduler = document.getElementById('dailyScheduler');
window.multiScheduleUrls = document.getElementById('multiScheduleUrls');
window.scheduleDate = document.getElementById('scheduleDate');
window.scheduleTime = document.getElementById('scheduleTime');
window.dailyTime = document.getElementById('dailyTime');
window.oneTimePicker = document.getElementById('oneTimePicker');
window.dailyPicker = document.getElementById('dailyPicker');
window.cancelOneTime = document.getElementById('cancelOneTime');
window.cancelDaily = document.getElementById('cancelDaily');
window.pinTabs = document.getElementById("pinTabs"); // #tab4
window.unpinTabs = document.getElementById("unpinTabs");
window.normalReload = document.getElementById("normalReload");
window.hardReload = document.getElementById("hardReload");
window.closeTabs = document.getElementById("closeTabs");

// Help button
window.help.addEventListener('click', ()=>{
  chrome.tabs.create({url: "help.html"});
});

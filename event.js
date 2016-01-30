function addAlarm(name, dateTime, periodInMinutes) {
    if (typeof (periodInMinutes) === 'undefined') periodInMinutes = -1;
    var alarmEpoch = dateTime;
    if (periodInMinutes > 0) { //Find next occurence if it is in the past and is recurrent alarm
        while (alarmEpoch < Date.now()) alarmEpoch += (periodInMinutes * 60 * 1000);
        chrome.alarms.create(name, { when: alarmEpoch, periodInMinutes: periodInMinutes });
    } else if (alarmEpoch > Date.now()) {
        chrome.alarms.create(name, { when: alarmEpoch });
    }
}

function resetAlarms() {
    chrome.alarms.clearAll(function () {
        chrome.storage.sync.get({
            savedAlarms: []
        }, function (items) {
            items.savedAlarms.forEach(function (alarm) {
                addAlarm(alarm.name, (new Date(alarm.dateTime)).valueOf(), parseInt(alarm.periodInMinutes));
            });
        });
    });
}

// When the extension is installed or upgraded ...
function onInit() {
    resetAlarms();
}

function onAlarm(alarm) {
    chrome.storage.sync.get({
        savedAlarms: []
    }, function (items) {
        var i = 0;
        for (i = 0; i < items.savedAlarms.length; i++) {
            if (alarm.name === items.savedAlarms[i].name) {
                chrome.tabs.create({ url: items.savedAlarms[i].url, active: true });
                break;
            }
        }
    });
}

chrome.runtime.onInstalled.addListener(onInit);
chrome.alarms.onAlarm.addListener(onAlarm);

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message === "fullscreen") {
        chrome.windows.getCurrent(function (window) {
            chrome.windows.update(window.id, { state: "fullscreen" });
        });
    } else if (message === "resetAlarms") {
        resetAlarms();
    }
});

chrome.pageAction.onClicked.addListener(function (tab) {
    chrome.runtime.openOptionsPage();
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (tab.url.indexOf('classevirtuelle.ulaval.ca') > -1) {
        chrome.pageAction.show(tabId);
        chrome.pageAction.setTitle({ tabId: tab.id, title: "Configure Automatic Sessions Opener" });
    }
});
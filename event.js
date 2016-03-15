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

function onInit() {
    resetAlarms();
    chrome.storage.sync.get({
        configuredOnce: false
    }, function (items) {
        if (!items.configuredOnce) {
            chrome.storage.sync.set({
                configuredOnce: true
            });
            chrome.runtime.openOptionsPage();
        }
    });
}

function onAlarm(alarm) {
    chrome.storage.sync.get({
        savedAlarms: []
    }, function (items) {
        var i = 0;
        for (i = 0; i < items.savedAlarms.length; i++) {
            if (alarm.name === items.savedAlarms[i].name) {
                if (alarm.scheduledTime > Date.now() - 1800000) { //If scheduled time was more than 30 minutes ago, dont open the class
                    chrome.tabs.create({ url: items.savedAlarms[i].url, active: true });
                }
                break;
            }
        }
    });
}

//Create all listeners
chrome.runtime.onInstalled.addListener(onInit);
chrome.runtime.onStartup.addListener(onInit);
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
    }
});
$(document).ready(function () {
    chrome.storage.sync.get({
        autofullscreen: false
    }, function (items) {        
        if (items.autofullscreen) {
            chrome.runtime.sendMessage("fullscreen");
        }
    });
});

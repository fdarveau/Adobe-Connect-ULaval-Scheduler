$(document).ready(function () {
    chrome.storage.sync.get({
        autologin: false,
        username: '',
        password: '',
        autofullscreen: false
    }, function (items) {
        if ($('#login-button') != null && items.autologin) {
            $('#name').val(items.username);
            $('#pwd').val(items.password);
            $('#login-button').click();
        }
        
        if (items.autofullscreen) {
            chrome.runtime.sendMessage("fullscreen");
        }
    });
});

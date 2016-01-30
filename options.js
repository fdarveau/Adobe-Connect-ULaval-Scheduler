var nbAlarms = 0;
var alarms = [];

function addAlarmRow(hasAlarm, alarm) {
    if (typeof (hasAlarm) === 'undefined') hasAlarm = false;
    $('#alarmsTable').append(`<tr class="alarm">
                <td>
                    <input type="text" id="name%number%">
                </td>
                <td>
                    <input type="text" id="url%number%">
                </td>
                <td>
                    <input id="dateTime%number%" type="text" value="">
                </td>
                <td>
                    <select id="recurrent%number%">
                        <option value=-1>%recOnce%</option>
                        <option value=1440>%recDaily%</option>
                        <option value=10080>%recWeekly%</option>
                    </select>
                </td>
            </tr>`.replace(new RegExp("%number%", 'g'), nbAlarms)
        .replace("%recOnce%", chrome.i18n.getMessage("recOnce"))
        .replace("%recDaily%", chrome.i18n.getMessage("recDaily"))
        .replace("%recWeekly%", chrome.i18n.getMessage("recWeekly")));
    $('#dateTime' + nbAlarms).datetimepicker({
        mask: true,
        minDate: '0'
    });
    if (hasAlarm) {
        $('#name' + nbAlarms).val(alarm.name);
        $('#url' + nbAlarms).val(alarm.url);
        $('#dateTime' + nbAlarms).val(alarm.dateTime);
        $('#recurrent' + nbAlarms).val(alarm.periodInMinutes);
    }
    nbAlarms++;
}


// Saves options to chrome.storage.sync.
function save_options() {
    nbAlarms = 0;
    alarms = [];
    var i = 0;
    while ($('#name' + i).length != 0) {
        if ($('#name' + i).val() != "") {
            var newAlarm = new Alarm($('#name' + i).val(), $('#url' + i).val(), $('#dateTime' + i).val(), $('#recurrent' + i).val());
            alarms.push(newAlarm);
        }
        i++;
    }

    var autologin = document.getElementById('autologin').checked;
    var username = $('#username').val();
    var password = $('#password').val();
    var autofullscreen = document.getElementById('autofullscreen').checked;
    if (username == '' || password == '') autologin = false;
    chrome.storage.sync.set({
        autologin: autologin,
        username: username,
        password: password,
        autofullscreen: autofullscreen,
        savedAlarms: alarms
    }, function () {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = chrome.i18n.getMessage("optionsSaved");
        setTimeout(function () {
            status.textContent = '';
        }, 2000);

        alarms = []; //Will be retrieved again when restoring
        restore_options();
        chrome.runtime.sendMessage("resetAlarms");
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    chrome.storage.sync.get({
        autologin: false,
        username: '',
        password: '',
        autofullscreen: false,
        savedAlarms: []
    }, function (items) {
        document.getElementById('autologin').checked = items.autologin;
        $('#username').val(items.username);
        $('#password').val(items.password);
        document.getElementById('autofullscreen').checked = items.autofullscreen;

        $('.alarm').remove();
        items.savedAlarms.forEach(function (alarm) {
            alarms.push(alarm);
            addAlarmRow(true, alarm);
        })

        if (nbAlarms == 0) {
            addAlarmRow(false);
        }
    });
}

function exportAlarms() {
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

    window.requestFileSystem(window.TEMPORARY, 1024 * 1024, function (fs) {
        fs.root.getFile(chrome.i18n.getMessage("extensionName") + '_' + chrome.i18n.getMessage("export") + '.acus', { create: true }, function (fileEntry) {
            fileEntry.createWriter(function (fileWriter) {
                var exportString = "";
                alarms.forEach(function (alarm) {
                    if (exportString !== "") exportString += "|&|";
                    exportString += JSON.stringify(alarm);
                });

                var arr = new Uint8Array(exportString.length);
                var i = 0;
                for (i = 0; i < exportString.length; i++) {
                    arr[i] = exportString.charCodeAt(i);
                }

                var blob = new Blob([arr]);

                fileWriter.addEventListener("writeend", function () {
                    chrome.downloads.download({ url: fileEntry.toURL(), saveAs: true });
                }, false);

                fileWriter.write(blob);
            });
        });
    });
}

function importAlarms() {
    var fileList = document.getElementById('classesFile').files;

    // Make sure file has been selected 
    if (!(fileList instanceof FileList) || fileList.length === 0) {
        return false;
    }

    var fileReader = new FileReader();
    fileReader.onloadend = (function (file) {

        return function (fileContents) {
            var importedString = fileContents.currentTarget.result;
            var alarmsStrings = importedString.split("|&|");
            alarmsStrings.forEach(function (alarm) {
                var actualAlarmObject = JSON.parse(alarm);
                alarms.push(actualAlarmObject);
                addAlarmRow(true, actualAlarmObject);
            });
        }

    })(fileList[0]);  // fileList[0] assumes only one file has been selected

    fileReader.readAsText(fileList[0]);
    
    //Reset controls
    $('#import').prop('disabled', true);
    $("#classesFile").val('');
}

$(document).ready(function () {
    $('[data-i18n]').each(function () {
        var me = $(this);
        var key = me.data('i18n');
        me.html(chrome.i18n.getMessage(key));
    });
    restore_options();
});

document.getElementById('save').addEventListener('click', save_options);
document.getElementById('addRow').addEventListener('click', addAlarmRow);
document.getElementById('import').addEventListener('click', importAlarms);
document.getElementById('export').addEventListener('click', exportAlarms);

$('#import').prop('disabled', true);

$("#classesFile").change(function (e) {
    $('#import').prop('disabled', document.getElementById('classesFile').files.length <= 0);
});
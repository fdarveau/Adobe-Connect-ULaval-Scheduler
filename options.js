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
                        <option value=-1>Once</option>
                        <option value=1440>Daily</option>
                        <option value=10080>Weekly</option>
                    </select>
                </td>
            </tr>`.replace(new RegExp("%number%", 'g'), nbAlarms));
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
        status.textContent = 'Options saved.';
        setTimeout(function () {
            status.textContent = '';
        }, 750);
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
        items.savedAlarms.forEach(function (entry) {
            alarms.push(entry);
            addAlarmRow(true, entry);
        })

        if (nbAlarms == 0) {
            addAlarmRow(false);
        }
    });
}

$(document).ready(restore_options);
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('addRow').addEventListener('click', addAlarmRow);
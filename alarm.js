'use strict';
var Alarm = class Alarm {
    constructor(name, url, dateTime, periodInMinutes) {
        this.name = name;
        this.url = url;
        this.dateTime = dateTime;
        this.periodInMinutes = periodInMinutes;
    }
}

//every ten minutes check - are some notifications in next 10 min
// playground: https://repl.it/I1Hz/2

const requestify = require('requestify');
const express = require('express');
const dbUrl = process.env.MONGODB_URI;
const monk = require('monk');
const db = monk(dbUrl);
const users = db.get('users');
const moment = require('moment-timezone');

db.then(() => {
    console.log('schedule checker connected with db');
    users.find({}).each((user, {close, pause, resume}) => {
        user.notifications.forEach(time => {
            isInNext10Min(time.full, user.timezone, close)
        });
    }).then(() => {
        console.log('we go to exit');
        // process.exit()
    });

});

function isInNext10Min(time, timezone, close) {
    // moment.tz.setDefault("UTC");
    console.log(time, timezone);
    const now = moment.utc();
    const notif = moment.utc(moment.tz(time, 'hh:mm', timezone));
    const next10min = moment.utc().add(10, 'm');
    // console.log('is btw: ', now.isBetween(now, next10min));
    // console.log('is before +10: ', notif.isBefore(next10min));
    // console.log('is after now: ', notif.isAfter(now.format()));
    if (notif.isBetween(now, next10min)) {
        console.log('I found - call pinger');
        pingToWakeUp()
        close()
    }
}

function pingToWakeUp() {
    console.log('i am pinger');
    requestify.get(process.env.URL).then(function(response) {
        console.log('resp: ', response.getBody());
    });
}

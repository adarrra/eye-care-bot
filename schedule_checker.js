//every ten minutes check - are some notifications in next 10 min
// playground: https://repl.it/I1Hz/2

const pinger = require('express-ping');
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
        process.exit()
    });

});

function isInNext10Min(time, tz, close) {
    // moment.tz.setDefault("UTC");
    console.log(time);
    let now = moment.utc();
    console.log('now utc:', now);
    let notif = moment.utc(moment.tz(time, 'hh:mm', tz));
    console.log('from db utc: ', notif);
    let next10min = now.add(10, 'm');
    console.log('next10', next10min);
    console.log('is btw: ', now.isBetween(now, next10min));
    console.log('is before +10: ', notif.isBefore(next10min));
    console.log('is after now: ', notif.isAfter(now.format()));
    if (notif.isBetween(now, next10min)) {
        console.log('I found - call pinger');
        pingToWakeUp()
    }
}

function pingToWakeUp() {
    console.log('i am pinger');
    const app = express();
    app.use(pinger.ping());
}

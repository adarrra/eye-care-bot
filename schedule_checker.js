//every ten minutes check - are some notifications in next 10 min

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
    console.log(time);
    let notif = moment(time, 'hh:mm').tz(tz);
    let now = moment.utc();
    let next10min = moment.utc().add(10, 'm');
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

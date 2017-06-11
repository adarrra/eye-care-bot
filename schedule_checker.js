/* Task for Heroku scheduler add-on
*  it check - are some notifications in next 10 min (every ten minutes)
*  moment playground: https://repl.it/I1Hz/2
*/

const requestify = require('requestify');
const dbUrl = process.env.MONGODB_URI;
const monk = require('monk');
const db = monk(dbUrl);
const users = db.get('users');
const moment = require('moment-timezone');

let found = false;

db.then(() => {
    console.log('schedule checker connected with db');
    users.find({}).each((user, { close }) => {
        found = user.notifications.some(time => isInNext10Min(time.full, user.timezone));
        if (found) {
            console.log('ok you found so I close stream');
            close();
        }
    }).then(() => {
        if (!found) {
            console.log('not found, we go to exit');
            process.exit();
        }
    })
    .catch(() => {
        console.log('error, we go to exit');
        process.exit();
    });
});

function isInNext10Min(time, timezone) {
    console.log(time, timezone);
    const now = moment.utc();
    const notif = moment.utc(moment.tz(time, 'hh:mm', timezone));
    // carefull here girl. moment mutate obj
    const next10min = moment.utc().add(10, 'm');
    if (notif.isBetween(now, next10min)) {
        console.log('I found - call pinger');
        pingToWakeUp();
        return true;
    }
}

function pingToWakeUp() {
    console.log('i am pinger');
    requestify.get(process.env.URL).then((response) => {
        console.log('resp: ', response.getBody());
        process.exit();
    });
}

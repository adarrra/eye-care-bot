//every ten minutes check - are some notifications in next 10 min

const dbUrl = process.env.MONGODB_URI;
const monk = require('monk');
const db = monk(dbUrl);
const users = db.get('users');
const moment = require('moment-timezone');

db.then(() => {
    console.log('db connected');
    users.find({}).each((user, {close, pause, resume}) => {
  // the users are streaming here
  // call `close()` to stop the stream
        user.notifications.forEach(time => {
            isInNext10Min(time.full, user.timezone, close)
        });
        process.exit()
    }).then(() => {
        console.log('schedule checker connected with db');
    });

});

function isInNext10Min(time, tz, close) {
    let notif = moment(time.full).tz(user.timezone);
    let next10min = moment().tz(user.timezone).add(10, 'm');
    if (notif.isBefore(next10min)) {
        console.log('I found - ping');
        // ping maybe https://www.npmjs.com/package/express-ping
        //close() - close stream
        //process exit
    }
}

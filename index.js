// some mess with libs... microbot? What is Composer...

const {Markup} = require('micro-bot');
const Telegraf = require('telegraf');
const msg = require('./messages');
const CronJob = require('cron').CronJob;
const moment = require('moment-timezone');
const monk = require('monk');
// mongoose.connect(process.env.DATABASE);
const dbUrl = 'localhost:27017/testUsers';
const db = monk(dbUrl);
const users = db.get('users');

const app = new Telegraf(process.env.BOT_TOKEN); // was const app = new Composer()
// when to db.close()?
let cronJobHash = new Map();
db.then(() => {
    console.log('db connected');
    users.find({}).each((user, {close, pause, resume}) => {
  // the users are streaming here
  // call `close()` to stop the stream
        user.notifications.forEach(time => {
            setCronJob(user.chat_id, time, user.timezone);
        });
    }).then(() => {
        console.log('hope it is setted');
    });

});

// app.set('port', (process.env.PORT || 5000))

const myKeyboard = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['0', ':']
];

function getJobId(chat_id, time) {
    return `${chat_id}${time.full}`;
}


app.hears(/^\d\d/, ctx => {
    let time = ctx.message.text.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/);

    if (time) {
        let timeObj = {h: time[1] , m: time[2], full: time[0]};
        users.findOne({chat_id: ctx.chat.id}).then(user => {
            if (user) {
                users.update({chat_id: ctx.chat.id}, {$push: {notifications: timeObj}})
                .then(() => {
                    if (!user.timezone) {
                        return ctx.reply(msg.askLocation);
                    } else {
                        setCronJob(ctx.chat.id, timeObj, user.timezone);
                        ctx.reply(`${timeObj.full} setted`);
                    }
                })
            } else {
                users.insert({
                    chat_id: ctx.chat.id,
                    notifications: [timeObj],
                    waitLocation: true
                })
                .then(() => {
                    // return ctx.reply(msg.askLocation, Markup.keyboard([Markup.locationRequestButton('Send contact')]))
                    return ctx.reply(msg.askLocation);
                });
            }
        });
    } else {
        return ctx.reply(msg.cantRecongnizeTime);
    }
});

app.on('sticker', ctx => ctx.reply('👍'));
app.hears(/(hi)|(hey)/i, ctx => ctx.reply('Hey there!'));
app.hears('d', ctx => {
    const replyOptions = Markup.inlineKeyboard([
        Markup.urlButton('❤️', 'http://telegraf.js.org'),
        Markup.callbackButton('Delele', 'delete')
    ]).extra();
    ctx.telegram.sendMessage(ctx.from.id, 'ff', replyOptions);
});

app.command('start', ctx =>
    ctx.reply(msg.start)
);

app.command('e_tz', ctx => {
    let tz = ctx.message.text.split(' ').slice(1).join();
    if (tz) {
        users.findOne({chat_id: ctx.chat.id}).then(user => {
            updTz(tz, user);
        });
    } else {
        ctx.reply(msg.cantRecongnizeLocation);
    }
});

// maybe add smth like 'rm all'
app.command('rm', ctx => {
    let time = ctx.message.text.match(/([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/);
    if (time) {
        users.findOne({chat_id: ctx.chat.id}).then(user => {
            users.update({chat_id: ctx.chat.id}, {$pull: {notifications: {full: time[0]}}})
            .then(result => {
                let resultMsg = result.nModified ? `${time[0]} removed` : 'Ops! Notification not found';
                cronJobHash.get(getJobId(user.chat_id, {full: time[0]})).stop();
                app.telegram.sendMessage(user.chat_id, resultMsg)
            })
            .catch (() => {
                ctx.reply('Oh, some error occured');
            })
        });
    } else {
        ctx.reply(msg.cantRecongnizeTime);
    }
});

app.command('ls', ctx =>
    users.findOne({chat_id: ctx.chat.id}).then(user => {
        let notif = [];
        user.notifications.forEach(time => {
            notif.push(`${time.full}`);
        });
        ctx.reply(`Your notifications: ${notif.join(', ')}. Your timezone: ${user.timezone}`)

    })
);


app.on('message', ctx => {
    users.findOne({chat_id: ctx.chat.id})
    .then(user => {
        if (user && user.waitLocation) {
            updTz(ctx.message.text, user);
        } else {
            ctx.reply('If you are confused type /help');
        }
    });
});

// maybe we can rm waitLocation and use some callback query?
function updTz(zone, user) {
    let tz = moment.tz.names().find(z => {
            // stricter checking needed
        if (z.includes(zone)) {
            return z;t
        }
    });
    if (tz) {
        users.update(
            {chat_id: user.chat_id},
            {$set: {
                waitLocation: false,
                timezone: tz
                }
            }
        )
        .then(result => {
            let resMsg = result.nModified ? `${tz} setted` : 'Ops! Something went wrong';
            app.telegram.sendMessage(user.chat_id, `${tz} setted`);
            // user.notifications.forEach(time => {
            //     // you should update all jobs for this user !!!
            //     setCronJob(time, zone2db);
            // });
        });
    } else {
        app.telegram.sendMessage(user.chat_id, msg.cantRecongnizeLocation);
    }
}

function setCronJob(chat_id, time, tz) {
    let job = new CronJob({
        cronTime: `${time.m} ${time.h} * * *`,
        onTick: function () {
            app.telegram.sendMessage(chat_id, 'eye notification');
        //       reply with callback btn - done, postpone, skip
        },
        start: true,
        timeZone: tz
    });
    cronJobHash.set(getJobId(chat_id, time), job);
}

// MVP!!!

// /help
// /e_tz <newTz>- edit timezone
// /rm <HH:MM> or Key - rm notification
// /ls - list notifications

// db schema:
// {
//     chat_id: int
//     notifications: [{h:12, m:30, full: '12:30'}, {h:17, m:0, full: '17:00'}]
//     timezone: 'Europe/Minsk'
//     waitLocation: false
// }

/* TODO:
    - beauty help and start messages
    - stop cron jobs when tz changes
    - try to deploy, check timezone correctness
    - postpone btn - done/postpone/skip
    - weekends settings
    - split somehow and prettify for less spaghettiness
    - tests espec. for e_tz
    - add emojis for eternal beauty

*/

module.exports = app;

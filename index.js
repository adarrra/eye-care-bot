const Telegraf = require('telegraf');
const {Markup} = require('telegraf');
const express = require('express');
const expressApp = express();
const CronJob = require('cron').CronJob;
const moment = require('moment-timezone');
const monk = require('monk');
const dbUrl = process.env.MONGODB_URI;
const db = monk(dbUrl);
const users = db.get('users');
const randray = require('randray');
const msg = require('./messages');

const app = new Telegraf(process.env.BOT_TOKEN);
const PORT = process.env.PORT ||8443;

app.telegram.setWebhook(`${process.env.URL}bot${process.env.BOT_TOKEN}`);
//app.startWebhook(`bot${process.env.BOT_TOKEN}`, null, PORT);

expressApp.use(app.webhookCallback(`/bot${process.env.BOT_TOKEN}`));

app.telegram.getWebhookInfo().then(info => console.log('wh info: ', info))

expressApp.get('/', (req, res) => {
      res.send('Hey babe... You have nice eye color...');
});
expressApp.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

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
        console.log('hope it is set');
    });

});

function getJobId(chat_id, fulltime) {
    return `${chat_id}${fulltime}`;
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
                        ctx.reply(`${timeObj.full} set`);
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

app.command('start', ctx =>
    app.telegram.sendMessage(ctx.chat.id, msg.start, {parse_mode: 'HTML'})
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
                stopJob(user.chat_id, time[0]);
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
        if(!user) {
            ctx.reply(msg.haventNotifications);
        }
        user.notifications.forEach(time => {
            notif.push(`${time.full}`);
        });
        if (!notif.length) {
            ctx.reply(msg.haventNotifications);
        }
        ctx.reply(`Your notifications: ${notif.join(', ')}. Your timezone: ${user.timezone}`)

    })
);

app.command('help', ctx =>
    app.telegram.sendMessage(ctx.chat.id, msg.helpMsg, {parse_mode: 'HTML'})
);

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
            let resMsg = result.nModified ? `${tz} set` : 'Ops! Something went wrong';
            app.telegram.sendMessage(user.chat_id, `${tz} set`);
            user.notifications.forEach(time => {
                stopJob(user.chat_id, time.full);
                setCronJob(user.chat_id, time, tz);
            });
        });
    } else {
        app.telegram.sendMessage(user.chat_id, msg.cantRecongnizeLocation);
    }
}

const notifyOpts= Markup.inlineKeyboard([
    [
        Markup.callbackButton('Done', 'onDone'),
        Markup.callbackButton('Skip', 'onSkip')
    ],
    [
        Markup.callbackButton('Postpone 5 min', 'onPostpone5'),
        Markup.callbackButton('10 min', 'onPostpone10'),
        Markup.callbackButton('30 min', 'onPostpone29'),
    ]
]).extra();


app.action('onDone', ctx =>  ctx.reply(randray(positiveSmiles)))
app.action('onSkip', ctx =>  ctx.reply(randray(negativeSmiles)))
app.action(/^onPostpone/, ctx =>  {
    let minutes = parseInt(ctx.callbackQuery.data.match(/\d+/)[0]);
    // the problem if script stopped it will not be triggered, write to bd?
    users.findOne({chat_id: ctx.chat.id}).then(user => {
        let time = moment().tz(user.timezone).add(minutes, 'm');
        setCronJob(user.chat_id, time, user.timezone)
        app.telegram.sendMessage(ctx.chat.id, `Postponed on ${minutes} min`);
    })
})

app.hears('q', ctx => {
    app.telegram.sendMessage(ctx.from.id, 'Let\'s do some eyes exercises!', notifyOpts);
});

function setCronJob(chat_id, time, tz) {
    let cronTime = moment.isMoment(time) ? time.toDate() : `${time.m} ${time.h} * * *`;
    // for weekdays only * * * * 1-5
    let job = new CronJob({
        cronTime: cronTime,
        onTick: function () {
            app.telegram.sendMessage(chat_id, 'Let\'s do some eyes exercises!', notifyOpts);
        },
        start: true,
        timeZone: tz
    });
    cronJobHash.set(getJobId(chat_id, time.full), job);
}

function stopJob(chat_id, fulltime) {
    if (cronJobHash.has(getJobId(chat_id, fulltime))) {
        cronJobHash.get(getJobId(chat_id, fulltime)).stop();
    }
}

app.on('message', ctx => {
    users.findOne({chat_id: ctx.chat.id})
    .then(user => {
        if (user && user.waitLocation) {
            updTz(ctx.message.text, user);
        } else {
            ctx.reply(msg.notUnderstand);
        }
    });
});

const positiveSmiles = ['👍','👌', '😎', '😽', '👏', '💪', '💚', '🏆',  '🎉', ];
const negativeSmiles = ['😢', '😒', '😫', '😩', '😠', '🙁', '😿', '👓', '😞', ];

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
    - underst. answerCallbackQuery - can we answer only once??
    - weekends settings!
    - split somehow and prettify for less spaghettiness and better readability
    - write temp notifications to bd??
    - tests espec. for e_tz
    - send location by btn
    - add emojis for eternal beauty

*/

module.exports = app;

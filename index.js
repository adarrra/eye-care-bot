const Telegraf = require('telegraf');
const { Markup } = require('telegraf');
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
const PORT = process.env.PORT || 8443;

const notifyOpts = Markup.inlineKeyboard([
    [
        Markup.callbackButton('5 min', 'onPostpone5'),
        Markup.callbackButton('10 min', 'onPostpone10'),
        Markup.callbackButton('30 min', 'onPostpone29'),
    ],
    [
        Markup.callbackButton('Done', 'onDone'),
        Markup.callbackButton('Skip', 'onSkip'),
    ],
])
.extra();

const positiveSmiles = ['👍', '👌', '😎', '😽', '👏', '💪', '💚', '🏆', '🎉'];
const negativeSmiles = ['😢', '😒', '😫', '😩', '😠', '🙁', '😿', '👓', '😞'];

const cronJobHash = new Map();

// set webhooks and up express
app.telegram.setWebhook(`${process.env.URL}bot${process.env.BOT_TOKEN}`);
expressApp.use(app.webhookCallback(`/bot${process.env.BOT_TOKEN}`));
app.telegram.getWebhookInfo().then(info => console.log('wh info: ', info));

expressApp.get('/', (req, res) => {
    res.send('Hey babe... You have nice eye color...');
});
expressApp.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


// set jobs for all notifications
db.then(() => {
    console.log('db connected');
    users.find({}).each((user) => {
        user.notifications.forEach((time) => {
            setCronJob(user.chat_id, time, user.timezone);
        });
    }).then(() => {
        console.log('hope it is set');
    });
});


// set up notification
app.hears(/^\d\d/, (ctx) => {
    const time = ctx.message.text.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/);

    if (time) {
        const timeObj = { h: time[1], m: time[2], full: time[0] };
        users.findOne({ chat_id: ctx.chat.id }).then((user) => {
            if (user) {
                users.update({ chat_id: ctx.chat.id }, { $push: { notifications: timeObj } })
                .then(() => {
                    if (!user.timezone) {
                        return ctx.reply(msg.askLocation);
                    }
                    setCronJob(ctx.chat.id, timeObj, user.timezone);
                    ctx.reply(`${timeObj.full} set`);
                });
            } else {
                users.insert({
                    chat_id: ctx.chat.id,
                    notifications: [timeObj],
                    waitLocation: true,
                })
                .then(() => ctx.reply(msg.askLocation));
            }
        });
    } else {
        return ctx.reply(msg.cantRecongnizeTime);
    }
});


// set up commands
app.command('start', ctx =>
    app.telegram.sendMessage(ctx.chat.id, msg.start, { parse_mode: 'HTML' }),
);


app.command('e_tz', (ctx) => {
    const tz = ctx.message.text.split(' ').slice(1).join();
    if (tz) {
        users.findOne({ chat_id: ctx.chat.id }).then((user) => {
            updTz(tz, user);
        });
    } else {
        ctx.reply(msg.cantRecongnizeLocation);
    }
});


app.command('rm', (ctx) => {
    const time = ctx.message.text.match(/([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/);
    if (time) {
        users.findOne({ chat_id: ctx.chat.id }).then((user) => {
            users.update({ chat_id: ctx.chat.id }, { $pull: { notifications: { full: time[0] } } })
            .then((result) => {
                const resultMsg = result.nModified ? `${time[0]} removed` : 'Ops! Notification not found';
                stopJob(user.chat_id, time[0]);
                app.telegram.sendMessage(user.chat_id, resultMsg);
            })
            .catch(() => {
                ctx.reply(msg.oops);
            });
        });
    } else {
        ctx.reply(msg.cantRecongnizeTime);
    }
});


app.command('ls', ctx =>
    users.findOne({ chat_id: ctx.chat.id }).then((user) => {
        const notif = [];
        if (!user) {
            ctx.reply(msg.haventNotifications);
        }
        user.notifications.forEach((time) => {
            notif.push(`${time.full}`);
        });
        if (!notif.length) {
            ctx.reply(msg.haventNotifications);
        } else {
            ctx.reply(`Your notifications: ${notif.join(', ')}. Your timezone: ${user.timezone}`);
        }
    }),
);

app.command('help', ctx =>
    app.telegram.sendMessage(ctx.chat.id, msg.helpMsg, { parse_mode: 'HTML' }),
);


app.action('onDone', ctx => {
    ctx.reply(randray(positiveSmiles));
    ctx.deleteMessage();
});
app.action('onSkip', ctx => {
    ctx.reply(randray(negativeSmiles));
    ctx.deleteMessage();
});
app.action(/^onPostpone/, (ctx) => {
    const minutes = parseInt(ctx.callbackQuery.data.match(/\d+/)[0], 10);
    users.findOne({ chat_id: ctx.chat.id }).then((user) => {
        const time = moment().tz(user.timezone).add(minutes, 'm');
        setCronJob(user.chat_id, time, user.timezone);
        app.telegram.sendMessage(ctx.chat.id, `Postponed on ${minutes} min`);
        ctx.deleteMessage();
    });
});

// set up other reactions
app.on('sticker', ctx => ctx.reply('👍'));
app.hears(/(hi)|(hey)/i, ctx => ctx.reply('Hey there!'));

app.on('message', (ctx) => {
    users.findOne({ chat_id: ctx.chat.id })
    .then((user) => {
        if (user && user.waitLocation) {
            updTz(ctx.message.text, user);
        } else {
            ctx.reply(msg.notUnderstand);
        }
    });
});

function getJobId(chat_id, fulltime) {
    return `${chat_id}${fulltime}`;
}

function updTz(zone, user) {
    const tz = moment.tz.names().find(z => z.includes(zone));
    if (tz) {
        users.update(
            { chat_id: user.chat_id },
            { $set: {
                waitLocation: false,
                timezone: tz,
            },
            },
        )
        .then((result) => {
            const resMsg = result.nModified ? `${tz} set` : msg.oops;
            app.telegram.sendMessage(user.chat_id, resMsg);
            user.notifications.forEach((time) => {
                stopJob(user.chat_id, time.full);
                setCronJob(user.chat_id, time, tz);
            });
        });
    } else {
        app.telegram.sendMessage(user.chat_id, msg.cantRecongnizeLocation);
    }
}

function stopJob(chat_id, fulltime) {
    if (cronJobHash.has(getJobId(chat_id, fulltime))) {
        cronJobHash.get(getJobId(chat_id, fulltime)).stop();
    }
}

function setCronJob(chat_id, time, tz) {
    // for weekdays only * * * * 1-5
    const cronTime = moment.isMoment(time) ? time.toDate() : `${time.m} ${time.h} * * *`;
    const job = new CronJob({
        cronTime,
        onTick() {
            app.telegram.sendMessage(chat_id, msg.notif, notifyOpts);
        },
        start: true,
        timeZone: tz,
    });
    cronJobHash.set(getJobId(chat_id, time.full), job);
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
    - underst. answerCallbackQuery - can we answer only once??
    - weekends settings!
    - maybe add smth like 'rm all'
    - split somehow and prettify for less spaghettiness and better readability
    - write temp notifications to bd??
    - tests espec. for e_tz
    - send location by btn
    - add emojis for eternal beauty

*/

module.exports = app;

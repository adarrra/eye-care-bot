// some mess with libs... microbot? What is Composer...

const {Markup} = require('micro-bot')
const Telegraf = require('telegraf')
const msg = require('./messages')
const CronJob = require('cron').CronJob
const moment = require('moment-timezone')
const monk = require('monk')
// mongoose.connect(process.env.DATABASE);
const dbUrl = 'localhost:27017/testUsers';
const db = monk(dbUrl);
const users = db.get('users');

const app = new Telegraf(process.env.BOT_TOKEN) // was const app = new Composer()
// when to db.close()?
db.then(() => {
  console.log('db connected')
  users.find({}).each((user, {close, pause, resume}) => {
  // the users are streaming here
  // call `close()` to stop the stream
    user.notifications.forEach(time => {
        setCronJob(time, zone2db);
    });
    }).then(() => {
      console.log('hope it is setted');
    })
  
})

//app.set('port', (process.env.PORT || 5000))


app.command('start', (ctx) =>
    ctx.reply(msg.start)
  // ctx.replyWithMarkdown(msg.start, Markup
  //   .keyboard(myKeyboard)
  //   .resize()
  //   .extra()
  // )
)
const myKeyboard = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['0', ':']
];

let chat_id = process.env.TEL_CHAT_ID_ME
let time2db;
let zone2db;

app.hears(/\d\d:\d\d/, (ctx) => { // maybe ease regex
    let time = ctx.message.text.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/)

    if (time) {
        time2db = {h: time[1] , m: time[2]}
        console.log(time);
        users.findOne({chat_id: ctx.chat.id}).then(user => {
            if(user) { 
                users.update({chat_id: ctx.chat.id}, { $push: { notifications: time2db }})
                if (!user.timezone) {
                    return ctx.reply(msg.askLocation)
                } else {
                    setCronJob(time2db, user.timezone)
                }
            } else {
                users.insert( {
                    chat_id: ctx.chat.id,
                    notifications: [time2db],
                    waitLocation: true
                });
                //return ctx.reply(msg.askLocation, Markup.keyboard([Markup.locationRequestButton('Send contact')]))
                return ctx.reply(msg.askLocation)
            }
        })
    } else {
        return ctx.reply('Oh no! I can\'t recognize time. Please check format  HH:MM e.g. 06:30 or 18:00')
    }
})

app.on('sticker', (ctx) => ctx.reply('👍'))
app.hears('hi', (ctx) => ctx.reply('Hey there!'))
app.hears('d', (ctx) => {
    ctx.reply('debug')
    console.log(ctx.chat.id);
})

app.hears('db', (ctx) => {
    users.find({}).then((users) => {
        console.log('users from db: ', users);
        ctx.reply(users)
    })
})



// when I put app.hears after this they not work- why?
// what time it use itself
app.on('message', (ctx) => {
    users.findOne({chat_id: ctx.chat.id}).then(user => {
        if (user && user.waitLocation) {
            zone2db = moment.tz.names().find(z => {
                // stricter checking needed
                     if(z.includes(ctx.message.text)){
                         return z
                     }
                 })

            if (zone2db) {
                // how can user update location?)
                users.update(
                    {chat_id: ctx.chat.id},
                    {$set: {
                        waitLocation: false, 
                        timezone: zone2db
                        }
                    }
                )
                user.notifications.forEach(time => {
                    setCronJob(time, zone2db)
                });

                return ctx.reply(`${time.h}:${time.m} setted`)
            } else {
                return ctx.reply('Oh no! I can\'t recognize location. Please use latin e.g. Minsk')
            }
            
        }
    })
})

function setCronJob(time, tz) {
    new CronJob({
      cronTime: `${time.m} ${time.h} * * *`,
      onTick: function() {
        app.telegram.sendMessage(chat_id, 'eye notification')
      },
      start: true,
      timeZone: tz
    });
}

//MVP!!!

// TelegrafContext {
//   tg:
//    Telegram {
//      token: '',
//      options:
//       { apiRoot: 'https://api.telegram.org',
//         webhookReply: true,
//         agent: [Object] },
//      response: undefined },
//   update:
//    { update_id: 657081901,
//      message:
//       { message_id: 37,
//         from: [Object],
//         chat: [Object],
//         date: 1494058487,
//         text: '14:15' } },
//   options: { retryAfter: 1, handlerTimeout: 0, username: 'eye_care_bot' },
//   updateType: 'message',
//   updateSubType: 'text',
//   match: [ '14:15', index: 0, input: '14:15' ] }


// I need your city
// then Sorry it's invalid'
// Then - Deal!`
// help use command 'set time' or change location/ pause / exercise
  // ctx.reply('42')
// app.command('help', ctx => ctx.replyWithMarkdown(msg.help))
// app.hears(/(так)|(ишо)/i, ctx => ctx.replyWithMarkdown(msg.formatQuote(getQuote({ details: true }))))

// with inlintKeybord done or postopne for 15,30,45,60 (as skeddy buttons) or fck it
// add emojis for eternal beauty

// any - you next notification is (time , not setted) - to change it use command /setted
// use command advise
// bot.hears(/\/\w+/, (ctx) => {
//   ctx.reply('If you are confused type /help');
// });

// mayb customize keyboard with commands that need often


// db schema:
// {
//     chat_id: int
//     notifications: [{h:12, m:30}, {h:17, m:0}]
//     timezone: 'Europe/Minsk'
//     waitLocation: false
// }

module.exports = app

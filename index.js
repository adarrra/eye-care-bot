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
let userAnswerOnLocation; // need more handling


app.hears(/\d\d:\d\d/, (ctx) => { // maybe ease regex
    let time = ctx.message.text.match(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/)

    if (time) {
        time2db = time
        users.findOne({chat_id: ctx.chat.id}).then(user => {
            if(user) { // and user has location
                users.update({chat_id: ctx.chat.id}, { $push: { notifications: `${time2db[1]}:${time2db[2]}`} })
            } else {
                // insert doc with chat id, ask and set waitLocation, when getLocation => add. But handle above
                userAnswerOnLocation = true;
                //return ctx.reply(msg.askLocation, Markup.keyboard([Markup.locationRequestButton('Send contact')]))
                return ctx.reply('It\'s nearly done! Last question: your city (for proper timezone) e.g. Minsk')
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
app.on('message', (ctx) => {
    if (userAnswerOnLocation) {
        // but I don't understand what time it use itself
        zone2db = moment.tz.names().find(z => {
                 if(z.includes(ctx.message.text)){return z}} )

        if (zone2db) {
            userAnswerOnLocation = false;
            new CronJob({
              cronTime: `${time2db[2]} ${time2db[1]} * * *`,
              onTick: function() {
                app.telegram.sendMessage(chat_id, 'eye notification')
              },
              start: true,
              timeZone: zone2db
            });
            return ctx.reply(zone2db + ' setted')
        } else {
            return ctx.reply('Oh no! I can\'t recognize location. Please use latin e.g. Minsk')
        }
    }
})

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
//     notifications: ['12:30, 15:40']
//     timezone: 'Europe/Minsk'
//     waitLocation: false
// }

module.exports = app

// some mess with libs... microbot? What is Composer...

const {Markup} = require('micro-bot')
const Telegraf = require('telegraf')
const msg = require('./messages')
const CronJob = require('cron').CronJob
const moment = require('moment-timezone')

const app = new Telegraf(process.env.BOT_TOKEN) // was const app = new Composer()
//app.set('port', (process.env.PORT || 5000))
// mongoose.connect(process.env.DATABASE);

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
        //return ctx.reply(msg.askLocation, Markup.keyboard([Markup.locationRequestButton('Send contact')]))
        userAnswerOnLocation = true;
        // if user has no timezone yet:
        return ctx.reply('Time setted! Last question: your city (for proper timezone) e.g. Minsk')
    } else {
        return ctx.reply('Oh no! I can\'t recognize time. Please check format  HH:MM e.g. 06:30 or 18:00')
    }
    console.log(ctx.update.message.text);
})

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




app.on('sticker', (ctx) => ctx.reply('👍'))
app.hears('hi', (ctx) => ctx.reply('Hey there!'))


app.hears('d', (ctx) => {
    ctx.reply('debug')
    console.log(ctx.chat.id);

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

module.exports = app

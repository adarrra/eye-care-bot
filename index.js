// some mess with libs... microbot? What is Composer...

const {Markup} = require('micro-bot')
const Telegraf = require('telegraf')
const msg = require('./messages')

const app = new Telegraf(process.env.BOT_TOKEN) // was const app = new Composer()
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

app.hears('hi', (ctx) => ctx.reply('Hey there!'))


let chat_id;
app.hears('d', (ctx) => {
    ctx.reply('debug')
    chat_id = ctx.chat.id
    console.log(ctx.chat);

})

// next some cron) 
// setTimeout(function () {
//     app.telegram.sendMessage(chat_id, 'aha! I am alive')
//     console.log(app.telegram.sendMessage);
// }, 2000);


app.hears(/\d\d:\d\d/, (ctx) => { // maybe ease regex
    if (/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(ctx.message.text)) {
        //return ctx.reply(msg.askLocation, Markup.keyboard([Markup.locationRequestButton('Send contact')]))
        return ctx.reply('Time setted! Last question: your city (for proper timezone) e.g. Minsk')
    } else {
        return ctx.reply('Oh no! I can\'t recognize time. Please check format  HH:MM e.g. 06:30 or 18:00')
    }
    console.log(ctx.update.message.text);
})

app.on('sticker', (ctx) => ctx.reply('👍'))
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

module.exports = app

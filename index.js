const { Composer, Markup } = require('micro-bot')
const msg = require('./messages')

const app = new Composer()
//app.set('port', (process.env.PORT || 5000))

app.command('start', (ctx) =>
  ctx.replyWithMarkdown(msg.start, Markup
    .keyboard(myKeyboard)
    .resize()
    .extra()
  )
)
const myKeyboard = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['0', ':']
];

app.hears('hi', (ctx) => ctx.reply('Hey there!'))
app.hears(/\d\d:\d\d/, (ctx) => ctx.reply('time setted! and one more question about location'))

// I need your city 
// then Sorry it's invalid'
// Then - Deal!`
// help use command 'set time' or change location/ pause / exercise
  // ctx.reply('42')
// app.command('help', ctx => ctx.replyWithMarkdown(msg.help))
// app.hears(/(так)|(ишо)/i, ctx => ctx.replyWithMarkdown(msg.formatQuote(getQuote({ details: true }))))

// with inlintKeybord done or postopne for 15,30,45,60 (as skeddy buttons) or fck it

module.exports = app

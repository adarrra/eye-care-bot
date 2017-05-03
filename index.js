const { Composer, Markup } = require('micro-bot')

const app = new Composer()
//app.set('port', (process.env.PORT || 5000))

app.command('start', (ctx) =>
  ctx.reply('42')
  // ctx.replyWithMarkdown(msg.start, Markup
  //   .keyboard([['так', 'ишо']])
  //   .resize()
  //   .extra()
  // )
)
app.hears('hi', (ctx) => ctx.reply('Hey there!'))


// app.command('help', ctx => ctx.replyWithMarkdown(msg.help))
// app.hears(/(так)|(ишо)/i, ctx => ctx.replyWithMarkdown(msg.formatQuote(getQuote({ details: true }))))

module.exports = app

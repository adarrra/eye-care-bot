const CronJob = require('cron').CronJob;
const app = require('./index.js');

new CronJob({
  cronTime: "28 13 * * *",
  onTick: () => app.telegram.sendMessage(process.env.DEBUG_CHAT_ID, 'DEBUG DEBUG'),
  start: true,
  timeZone: "Europe/Minsk"
});

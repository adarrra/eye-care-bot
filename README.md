# eye-care-bot
WIP

Eye-care telegram bot built with [Telegraph](https://github.com/telegraf/telegraf) and [Nodejs](https://nodejs.org/en/).  
It will send you daily reminders about eyes exercise.

# How to use
1) Find **eye_care_bot** in your telegram
2) press /start
3) Use some of this commands:
```
<HH:MM> - set notification (e.g. 12:30 )
/ls - list notifications and timezone
/rm <HH:MM> - remove notification (e.g. /rm 12:30 )
/e_tz <newTz> - set new timezone (e.g. /e_tz Moscow )
```

# Developing
You need to provide
```bash
MONGODB_URI
BOT_TOKEN
URL
```
Bot live on Heroku so I use scheduler add-on

<img src="https://image.flaticon.com/icons/svg/272/272371.svg" alt="bot icon" width="150px"/>
<sub><sup>Icon made by Freepik from www.flaticon.com</sub></sup>

# eye-care-bot

Eye-care [Telegram](https://telegram.org/) bot built with [Telegraf](https://github.com/telegraf/telegraf) and [Nodejs](https://nodejs.org/en/).  
As a programmers we should take care of our eyes.  
This bot will help  you to **schedule daily weekday reminders** about eyes exercise.  
It's minimalistic, without any clatter. If you want more, feel free to create issue-feature request :)

# How to use
1) Paste **eye_care_bot** in your [Telegram client](https://telegram.org/) search input field
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

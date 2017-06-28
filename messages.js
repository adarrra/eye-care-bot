const helpMsg = `
&lt;HH:MM&gt; - set notification (<em>e.g. 12:30</em> )
/ls - list notifications and timezone
/rm &lt;HH:MM&gt; - remove notification (<em>e.g. /rm 12:30</em> )
/e_tz &lt;newTz&gt; - set new timezone (<em>e.g. /e_tz Moscow</em> )
`;

const start = `
Hi! You can use this nice commands:
${helpMsg}

So... What time do you prefer for eye exercises?
Don't forget to use format HH:MM e.g. 15:30`;

const askLocation = 'Time set! Last question: your city (for proper timezone) e.g. \'Minsk\'';

const cantRecongnizeTime = '\'Oh no! I can\'t recognize time. Please check format  HH:MM e.g. 06:30 or 18:00\'';

const cantRecongnizeLocation = 'Oh no! I can\'t recognize location. Please use latin e.g. Minsk';

const haventNotifications = 'You haven\'t any notifications yet. Just write <HH:MM> for setup it e.g. 12:30';

const notUnderstand = 'I don\'t understand you :( You can try /help to list available commands';

const oops = 'Ops! Something went wrong';

const notif = `Let's do some eyes exercises!

Postpone it for:
`;
const notifShort = 'Let\'s do some eyes exercises!';


module.exports = {
    start,
    askLocation,
    cantRecongnizeTime,
    cantRecongnizeLocation,
    haventNotifications,
    helpMsg,
    oops,
    notif,
    notUnderstand,
    notifShort,
};

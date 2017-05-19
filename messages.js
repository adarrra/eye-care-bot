
const start = `
Hi!
What time do you prefer for eye exercises?
Use format HH:MM e.g. 15:30`

const askLocation = `Time setted! Last question: your city (for proper timezone) e.g. 'Minsk'`

const cantRecongnizeTime = `'Oh no! I can't recognize time. Please check format  HH:MM e.g. 06:30 or 18:00'`

const cantRecongnizeLocation = `Oh no! I can't recognize location. Please use latin e.g. Minsk`


module.exports = {
    start,
    askLocation,
    cantRecongnizeTime,
    cantRecongnizeLocation
}

const {addKeyword, EVENTS} = require("@bot-whatsapp/bot");
const yes = "Si";
const not = "No";
const idle = 300000; //5 min

const optionBotton = [
    {body: yes},
    {body: not}
]

const flowLocation = addKeyword(EVENTS.LOCATION)
    .addAnswer('Ohh ya veo donde estas crack');

module.exports = { yes, not, optionBotton, idle };

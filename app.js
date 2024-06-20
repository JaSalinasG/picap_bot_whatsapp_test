const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')

const MetaProvider = require('@bot-whatsapp/provider/meta')
const JsonFileAdapter = require('@bot-whatsapp/database/json')
const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')

/**
 * Aqui declaramos los flujos hijos, los flujos se declaran de atras para adelante, es decir que si tienes un flujo de este tipo:
 *
 *          Menu Principal
 *           - SubMenu 1
 *             - Submenu 1.1
 *           - Submenu 2
 *             - Submenu 2.1
 *
 * Primero declaras los submenus 1.1 y 2.1, luego el 1 y 2 y al final el principal.
 */

const flowSecundario = addKeyword(['2', 'siguiente']).addAnswer(['📄 Aquí tenemos el flujo secundario'])

const flowDocs = addKeyword(['doc', 'documentacion', 'documentación']).addAnswer(
    [
        '📄 Aquí encontras las documentación recuerda que puedes mejorarla',
        'https://bot-whatsapp.netlify.app/',
        '\n*2* Para siguiente paso.',
    ],
    null,
    null,
    [flowSecundario]
)

const flowTuto = addKeyword(['tutorial', 'tuto']).addAnswer(
    [
        '🙌 Aquí encontras un ejemplo rapido',
        'https://bot-whatsapp.netlify.app/docs/example/',
        '\n*2* Para siguiente paso.',
    ],
    null,
    null,
    [flowSecundario]
)

const flowGracias = addKeyword(['gracias', 'grac']).addAnswer(
    [
        '🚀 Puedes aportar tu granito de arena a este proyecto',
        '[*opencollective*] https://opencollective.com/bot-whatsapp',
        '[*buymeacoffee*] https://www.buymeacoffee.com/leifermendez',
        '[*patreon*] https://www.patreon.com/leifermendez',
        '\n*2* Para siguiente paso.',
    ],
    null,
    null,
    [flowSecundario]
)

const flowDiscord = addKeyword(['discord']).addAnswer(
    ['🤪 Únete al discord', 'https://link.codigoencasa.com/DISCORD', '\n*2* Para siguiente paso.'],
    null,
    null,
    [flowSecundario]
)

const flowPrincipal = addKeyword(['test'])
    .addAnswer('👾 ¡Hola! Bienvenido a Picap', {
            delay: 100,
            capture: true,
            buttons: [
                {body: 'opcion 1'},
                {body: 'opcion 2'},
                {body: 'opcion 3'},
            ]
    }



)

// const flowWelcome2 = addKeyword(EVENTS.WELCOME)
//     .addAnswer('👾 ¡Hola! Bienvenido a Picap', {
//             delay: 100,
//         },
//         async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
//             const responses = await fetch(''https://c24f-181-130-197-45.ngrok-free.app/api/pssg/passenger_bot_whatsapps/find_passenger_by_phone'')
//                 .then(response => {
//                     if (!response.ok) {
//                         // Manejo de errores HTTP
//                         throw new Error('Network response was not ok ' + response.statusText);
//                     }
//                     return response.json(); // Procesar la respuesta como JSON
//                 })
//                 .then(data => {
//                     console.log(data); // Manejar los datos recibidos
//                 })
//                 .catch(error => {
//                     console.error('There has been a problem with your fetch operation:', error); // Manejo de errores
//                 });
//
//
//             console.log( ":::::::",responses, ":::::::")
//             if (!["1", "2", "3", "0"].includes(ctx.body)) {
//                 return fallBack(
//                     `${ctx.pushName} la respuesta no es válida, por favor selecciona una de las opciones.`
//                 );
//             }
//         })


const main = async () => {
    const adapterDB = new JsonFileAdapter()
    const adapterFlow = createFlow([flowPrincipal])
    // console.log(process.env.JWTOKEN,process.env.NUMBER_ID,process.env.VERIFY_TOKEN,":::::::::::")
    const adapterProvider = createProvider(MetaProvider, {
        jwtToken: process.env.JWTOKEN,
        numberId: process.env.NUMBER_ID,
        verifyToken: process.env.VERIFY_TOKEN,
        version: 'v19.0',
    })

    // const adapterProvider2 = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    // QRPortalWeb()
}

main()

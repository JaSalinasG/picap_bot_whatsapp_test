const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')
require('./config');
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

const flowPrincipal = addKeyword(EVENTS.WELCOME, { sensitive: true })
    .addAnswer(['¡Hola! Bienvenido a Picap 👾', '¿Deseas solicitar un servicio?'], {
            capture: true,
            buttons: [
                {body: `✅ ${options.yes}`},
                {body: `❌ ${options.not}`}
            ]
        },
        async (ctx, ctxFn) => {
            if (!(ctx.body.includes(options.yes) || ctx.body.includes(options.not))){ return ctxFn.fallBack()}
            if (ctx.body.includes(options.not)) { return ctxFn.endFlow(`No hay problema ${ctx.pushName}. Si necesitas ayuda en el futuro, no dudes en contactarnos.\n¡Que tengas un buen día! 👋`) }
            await ctxFn.gotoFlow(service.listService)
            console.log('test... en proceso!!')
        }
    )

const flowPrincipal2 = addKeyword(EVENTS.WELCOME)
    .addAction({ capture: true },
        async (ctx, ctxFn ) => {
        // await ctxFn.flowDynamic(`¡Hola! Bienvenido a Picap 👾 ${ctx.pushName}`)
        await ctxFn.flowDynamic(`¡Qué bueno saludarte! ${ctx.pushName}`)
        await ctxFn.gotoFlow(register_user.flowRegister)
        }
    )

const main = async () => {
    const adapterDB = new JsonFileAdapter()
    const adapterFlow = createFlow([
        startApp.flowPrincipal,
        register_user.flowRegister,
        register_user.validatePhone,
        register_user.responseSendCode,
        location.locationWpp,
        location.locationAddress2,
        location.locationParameters,
        location.locationAddress,
        location.locationEndAddress,
        location.locationEndAddress2,
        location.getLocationWppAdddress,
        location.getLocationWppEndAdddress,
        service.listService,
        service.createBooking,
        service.statusBooking,
        service.rateStatus,
        service.relaunched,
        service.responseListService
    ])
    const adapterProvider = createProvider(MetaProvider, {
        jwtToken: process.env.JWTOKEN,
        numberId: process.env.NUMBER_ID,
        verifyToken: process.env.VERIFY_TOKEN,
        version: 'v16.0',
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

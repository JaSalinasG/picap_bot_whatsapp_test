const {addKeyword, EVENTS} = require("@bot-whatsapp/bot");
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
    email = email.replace(/\s+/g, '')
    if (emailPattern.test(email)){ return email }
    return null;
}

async function validatePicap(body_parmas) {
    let body = {
        "validation": body_parmas
    }
    const server = process.env.URL_API
    const route ='/api/whatsapp/bot_whatsapp/validation_passenger'
    const token = process.env.TOKEN
    const url = `${server}${route}?t=${token}`

    return await requestsApi.makePostRequest(url, body)

}

const flowRegister = addKeyword("###__flowRegister_##", { sensitive: true })
    .addAnswer(`¿Ya te encuentras registrado en Picap? 📲`,{
            capture: true,
            buttons: [
                {body: `✅ ${options.yes}`},
                {body: `❌ ${options.not}`}
            ]
        },
        async (ctx, ctxFn) => {
            if (!(ctx.body.includes(options.yes) || ctx.body.includes(options.not))){ return ctxFn.fallBack()}
            if (ctx.body.includes(options.yes)) {
                await ctxFn.gotoFlow(registeredUsers)
            }

            if (ctx.body.includes(options.not)) { await ctxFn.gotoFlow(unregisteredUsers) }
        }
    )

const registeredUsers = addKeyword("###__registeredUsers__##", { sensitive: true })
    .addAnswer(
        '*Perfecto*, Por favor, escribe tu dirección de correo electrónico 📧, para confirmar tu identidad 👤',
        { capture: true },
        async (ctx, ctxFn) => {
            const email = "miguelqa@mail.com"//validateEmail(ctx.body) //**se quema para pruebas**//

            if (!email) { return ctxFn.fallBack('Por favor, escribe tu dirección de correo electrónico 📧')}
            await ctxFn.state.update({ email: email })
            await ctxFn.flowDynamic('¡Entendido! Para continuar, necesitamos *confirmar* tu dirección de correo electrónico.\n' +
                `Correo electrónico: ${email}`
            )
        }
    ).addAnswer('¿Es correcta tu dirección de correo electrónico?', {
            capture: true,
            buttons: [
                {body: `✅ ${options.yes}`},
                {body: `❌ ${options.not}`}
            ]
        },
        async (ctx, ctxFn) => {
            const email = ctxFn.state.get('email')
            const phone = ctx.from.substring(2)
            if (!(ctx.body.includes(options.yes) || ctx.body.includes(options.not))){ return ctxFn.fallBack()}
            if (ctx.body.includes(options.yes)) {
                let body = {
                    email: email,
                    phone: "21313123"//phone  //**se quema para pruebas**//
                }
                console.log(ctx,`:::::: ctx ==>`)
                const response = await validatePicap(body)
                if (response.status === 200){
                    if (response.expelled || response.suspended){ return ctxFn.endFlow(
                        `🚨 ${ctx.pushName}, luego de realizar una validación de su cuenta, hemos evidenciado que la cuenta asociada a este número de teléfono ${phone} y al`+
                        `correo ${email} no cumple con las políticas internas de seguridad de la Aplicación Móvil.\nPor favor comunícate con chat central desde la Aplicación.`
                    )}
                    await ctxFn.flowDynamic( `¡Verificación Completa! 👾\nTu cuenta ha sido validada y estás registrado en nuestra aplicación ${response.name}.`)
                    const test = await ctxFn.gotoFlow(service.locationParameters)



                }
                console.log(`:::::: registeredUsers ==>`,)
            }
            if (ctx.body.includes(options.not)) { await ctxFn.gotoFlow(unregisteredUsers) }



        }

    )

const unregisteredUsers = addKeyword("###__unRegisteredUsers__##", { sensitive: true })
    .addAnswer('¡Entendido! Para comenzar el registro, necesitamos algunos detalles tuyos.\n' +
    'Por favor, proporciona tu nombre completo, número de teléfono y dirección.\n')
    .addAnswer('continuara... jajaja')



module.exports = { flowRegister, registeredUsers, unregisteredUsers };

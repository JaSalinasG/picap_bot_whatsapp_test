const {addKeyword, EVENTS} = require("@bot-whatsapp/bot");
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const sixCode = /^\d{6}$/;
const server = process.env.URL_API
const device = {
    brand: "whatsapp",
    model: "wpp",
    os: "whatsapp",
    os_version: "33",
    app_version: "5.25.8",
    lang: "es",
    push_token: "push_token_wpp",
    application_name: "whatsapp"
}

function validateEmail(email) {
    email = email.replace(/\s+/g, '')
    if (emailPattern.test(email)){ return email }
    return null;
}

async function sendCode(number, token) {
    // console.log('::::::: sendCode',number)
    let body = {
        country_code: number.substring(0,2),
        phone: number.substring(2)
    }
    const route ='/api/pssg/passengers/validate_phone'
    // console.log(`${server}${route}?t=${token}`,body)
    return await requestsApi.makePostRequest(`${server}${route}?t=${token}`, body)
}

async function validationCode(number, code, token) {
    let body = {
        country_code: number.substring(0,2),
        phone: number.substring(2),
        sms_code: `${code}`
    }
    const route ='/api/pssg/passengers/confirm_phone'
    // console.log(`:::::::: validationCode ${server}${route}?t=${token}`,body)
    return await requestsApi.makePostRequest(`${server}${route}?t=${token}`, body)
}

async function signIn(ctx,ctxFn) {
    await ctxFn.state.update({ flowRegisterKey: "signIn" })
    let header = {
        type: "text",
        text: `Validación de cuenta 👤`
    }
    return await methods.signIn(ctx.from, ctxFn.provider, header, `Completa el módulo para poder continuar.`, 'Picap 💜')
}

async function signUp(ctx,ctxFn) {
    await ctxFn.state.update({ flowRegisterKey: "signUp" })
    let header = {
        type: "text",
        text: `Registro de cuenta 👤`
    }
    return await methods.signUp(ctx.from, ctxFn.provider, header, `Completa el módulo  de registro para poder continuar.`, 'Picap 💜')
}

async function flowSignIn(ctx,ctxFn) {
    let response_form = JSON.parse(ctx.body)
    let body = {
        email: response_form.email,
        phone: ctx.from.substring(2),//"3214858909",//phone  //**se quema para pruebas**// preguntar si se deja o no
        password:response_form.password
    }
    console.log(':::flowSignIn')
    const response = await session(body)
    switch (response.status) {
        case 200:
            const responseProfile = await  profile(response.passenger_id, response.session_token)
            let name
            await ctxFn.state.update({ passenger: { id: responseProfile._id, name: responseProfile.name } })
            name = responseProfile.name
            // switch (responseProfile.status) {
            //     case 200:
            //         await ctxFn.state.update({ passenger: { id: responseProfile._id, name: responseProfile.name } })
            //         name = responseProfile.name
            //         break
            // }
            if (response.expelled || response.suspended){ return ctxFn.endFlow(
                `🚨 ${ name || ctx.pushName }, luego de realizar una validación de su cuenta, hemos evidenciado que la cuenta NO cumple con las políticas internas de seguridad de la Aplicación Móvil.\nPor favor comunícate con chat central desde la Aplicación.`
            )}
            await ctxFn.state.update({ session: { id: response._id, passenger_id: response.passenger_id, session_token: response.session_token} })
            await ctxFn.flowDynamic( `¡Listo ${ name || ctx.pushName } encontré tu perfil!`)
            if (!(responseProfile.is_phone_validated && responseProfile.is_phone_validated2)){
                await ctxFn.gotoFlow(validatePhone)
            }else {
                await ctxFn.gotoFlow(location.locationAddress2)
            }


            break
        case 422:
            if (response.mssg) {
                console.log('::::::createService tenemos 422 with mssg',response.mssg)
                ctxFn.flowDynamic(`❌ ${response.mssg}`)
                await ctxFn.gotoFlow(flowRegister)
            }else {
                return ctxFn.endFlow({body: '❌ Presentamos algunos inconvenientes, lo sentimos,\nintenta realizar la solicitud desde la aplicación. ❌'})
            }
            break
    }
}

async function flowSignUp(ctx,ctxFn) {
    let response_form = JSON.parse(ctx.body)
    let body = {
        name: `${response_form.firstName} ${response_form.lastName}`,
        country_code: ctx.from.substring(0, 2),
        phone: ctx.from.substring(2),
        password: response_form.password,
        email: response_form.email,
        gender_cd: response_form.gender
    }
    console.log(':::flowSignUp')
    const response = await createPassenger(body)
    switch (response.status) {
        case 200:
            const responseProfile = await  profile(response.passenger_id, response.session_token)
            let name
            switch (responseProfile.status) {
                case 200:
                    await ctxFn.state.update({ passenger: { id: responseProfile._id, name: responseProfile.name } })
                    name = responseProfile.name
                    break
            }
            await ctxFn.state.update({ session: { id: response._id, passenger_id: response.passenger_id, session_token: response.session_token} })
            await ctxFn.flowDynamic(`¡Perfecto! ${name || ctx.pushName}`)
            if (!(responseProfile?.is_phone_validated && responseProfile?.is_phone_validated2)){
                console.log('::::: flowSignUp')
                await ctxFn.gotoFlow(validatePhone)
            }else {
                await ctxFn.gotoFlow(location.locationAddress2)
            }

            break
        case 422:
            if (response.mssg){
                console.log('::::::createService tenemos 422 with mssg',response.mssg)
                ctxFn.flowDynamic(`❌ ${response.mssg}`)
                await ctxFn.gotoFlow(flowRegister)
            }else {
                return ctxFn.endFlow({body: '❌ Presentamos algunos inconvenientes, lo sentimos,\nintenta realizar la solicitud desde la aplicación. ❌'})
            }
            break
    }
}

// async function validatePicap(body_parmas) {
//     let body = {
//         "validation": body_parmas
//     }
//     const route ='/api/whatsapp/bot_whatsapp/validation_passenger'
//     const token = process.env.TOKEN
//     const url = `${server}${route}`
//
//     return await requestsApi.makePostRequest(url, body)
//
// }

async function session(body_parmas) {
    let body = {
        session: {
            password: `${body_parmas.password}`,
            email: `${body_parmas.email}`
        },
        device: device
    }
    const server = process.env.URL_API
    const route ='/api/pssg/sessions'
    const url = `${server}${route}`
    // console.log(':::url',url,body)
    return await requestsApi.makePostRequest(url, body)
}

async function profile(id, token) {
    const route ='/api/whatsapp/bot_whatsapp/66962ec6b2cc31002bd8bfab/profile'
    const url = `${server}${route}?t=${token}`

    return await requestsApi.makeGetRequest(url)
}

async function createPassenger(body_parmas) {
    let body = {
        passenger: body_parmas,
        device: device
    }
    const route ='/api/pssg/passengers'

    return await requestsApi.makePostRequest(`${server}${route}`, body)
}

const flowRegister = addKeyword("###__flowRegister_##", { sensitive: true })
    .addAnswer(`Indícame, por favor, la cuenta con la que te registraste en la app 📲.\n` +
        `Si ya tienes cuenta *Inicia sesión* o *Inicia registro* para crear una.`,
        {
            capture: true, idle: options.idle, //5 min
            buttons: [
                {body: `Inicia sesión`},
                {body: `Inicia registro`}
            ]
        },
        async (ctx, ctxFn) => {
            if (ctx?.idleFallBack) {
                await ctxFn.endFlow({body:'Se canceló el proceso por inactividad\n👋 ¡Ten un excelente día!'})
                return await ctxFn.gotoFlow(startApp.flowPrincipal)
            }
            if ((ctx.type === `interactive`)){
                switch (ctx.body) {
                    case `Inicia sesión`:
                        console.log(':::::Inicia sesión')
                        await signIn(ctx,ctxFn)
                        break
                    case `Inicia registro`:
                        console.log(':::::Inicia registro')
                        await signUp(ctx,ctxFn)
                        break
                }
            }else {
                ctxFn.fallBack('Por favor válida tu cuenta 👤. ⬆⬆⬆')
            }
        }
    ).addAction({ capture: true },
        async (ctx, ctxFn) => {
            if ((ctx.type === `interactive`)){
                // console.log(ctxFn.state.get('flowRegisterKey'))
                switch (ctxFn.state.get('flowRegisterKey')){
                    case "signIn":
                        return await flowSignIn(ctx, ctxFn)
                    case "signUp":
                        return await flowSignUp(ctx, ctxFn)
                }
            }else {
                ctxFn.fallBack('Por favor Inicia sesión. ⬆⬆⬆')
            }
        }
    )

const validatePhone = addKeyword("###__validatePhone__##", { sensitive: true })
    .addAnswer('Para continuar tenemos que validar tu número de teléfono, por favor selecciona *Enviar código*\n' +
        'Después ingresa el código de *6 dígitos* que enviamos como mensaje de texto a tu celular.\nTienes 30 segundos para completar esta acción',
        {
            capture: true, idle: options.idle, //5 min
            buttons: [
                {body: 'Enviar código'}
            ]
        },
        async (ctx, ctxFn) => {
            if (ctx?.idleFallBack) {
                await ctxFn.endFlow({body:'Se canceló el proceso por inactividad\n👋 ¡Ten un excelente día!'})
                return await ctxFn.gotoFlow(startApp.flowPrincipal)
            }
            if (ctx.body === 'Enviar código'){
                const response = await sendCode(ctx.from, ctxFn.state.get('session').session_token)
                console.log(':::::Revisa tu bandeja de mensajes',response.status)
                switch (response.status) {
                    case 200:
                        await ctxFn.gotoFlow(responseSendCode)
                        break
                    case 422:
                        await ctxFn.flowDynamic(`${response.mssg} ❌`)
                        return await ctxFn.gotoFlow(register_user.flowRegister)
                        break
                }
            }
        }
    )

const responseSendCode = addKeyword("###__responseSendCode__##", { sensitive: true })//depercado
    .addAnswer('Revisa tu bandeja de mensajes e ingresa el codigo 🧐...',
        { capture: true, idle: 33000 }, // 33 segundos
        async (ctx, ctxFn) => {
            if (ctx?.idleFallBack) {
                await ctxFn.endFlow({body:'No ingresaste el código, inténtalo de nuevo'})
                await ctxFn.gotoFlow(validatePhone)
            }
            if (sixCode.test(ctx.body)) {
                const response = await validationCode(ctx.from, ctx.body, ctxFn.state.get('session').session_token)
                // console.log(':::::validationCode',response.status)
                switch (response.status) {
                    case 200:
                        await ctxFn.flowDynamic('Número validado con éxito. ✅')
                        return await ctxFn.gotoFlow(location.locationAddress2)
                    case 422:
                        await ctxFn.flowDynamic(`${response.mssg} ❌`)
                        return await ctxFn.gotoFlow(validatePhone)
                }
            }else {
                ctxFn.flowDynamic('No ingresaste el código, inténtalo de nuevo')
                return await ctxFn.gotoFlow(validatePhone)
            }
        }
    )

// const unregisteredUsers = addKeyword("###__unRegisteredUsers__##", { sensitive: true })//depercado
//     .addAnswer('¡Entendido! Para comenzar el registro, necesitamos algunos detalles tuyos.\n' +
//     'Por favor, proporciona tu nombre completo, número de teléfono y dirección.\n')
//     .addAnswer('continuara... jajaja')



module.exports = { flowRegister, validatePhone, responseSendCode };

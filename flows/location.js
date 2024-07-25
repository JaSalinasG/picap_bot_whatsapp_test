const {addKeyword, EVENTS} = require("@bot-whatsapp/bot");
const eventLocation = /event_location/;
const addressRegex = /^[^,]+,[^,]+,[^,]+$/;

async function listAddress(ctx, ctxFn, response) {
    const headerText = 'Lista de direcciones encontradas'
    const bodyText = 'Seleccione la dirección que corresponde a la indicada anteriormente o que más se aproxime.'
    const footerText = ''
    const buttonList = 'Direcciones'
    const listParams = [
        {
            title: '📍',
            rows: items2(response)
        }
    ]
    //await ctxFn.provider.sendList(ctx.from, headerText, bodyText, footerText, buttonList, listParams)
    console.log(ctx)
    await methods.listAddress(ctx.from, ctxFn, headerText, bodyText, footerText, buttonList, listParams)
}

async function address(ctx,ctxFn, header, body) {
    // await ctxFn.state.update({ flowRegisterKey: "signIn" })
    return await methods.address(ctx.from, ctxFn.provider, header, body, 'Picap 🎯')
}
async function suggestionAutocomplete(query_parmas) {
    const server = 'https://suggestion.picapdb.co'
    const route ='/api/v1/autocomplete'
    const token = '2D0pmyQPrsL_cxO1h75X87JwZ2BYokLZIsJ4AQq52-LVDWzUvNUV2g'
    const url = `${server}${route}?${query_parmas}&t=${token}`

    return await requestsApi.makeGetRequest(url)
}

async function suggestions(query_parmas) {
    const server = 'https://suggestion.picapdb.co'
    const route ='/api/v1/suggestions'
    const token = '2D0pmyQPrsL_cxO1h75X87JwZ2BYokLZIsJ4AQq52-LVDWzUvNUV2g'
    // const url = `${server}${route}?${query_parmas}&t=${token}`
    const url = `${server}${route}?${query_parmas}`
    console.log(':::::::::::suggestions',url)
    return await requestsApi.makeGetRequest(url)
}

async function suggestionAddress(ctx, ctxFn, key ) {
    switch (key) {
        case 'OriginAddress':
            const originAddress = ctxFn.state.get('originAddress')[parseInt(ctx.body)].suggestion
            const originQueryParmas = `lat=${ctxFn.state.get('lat')}&lon=${ctxFn.state.get('lon')}&address=${originAddress.replace(/#/g,'%23')}&module_name=location_helper_suggestion_addresses`
            let originResponse = await suggestions(originQueryParmas)
            const originPoints = originResponse[0].geometry.location
            if ((originResponse.length  > 0)){
                await ctxFn.state.update({ originAddress: { address: originResponse[0].address, lat: originPoints.lat, lon: originPoints.lng }})
                console.log("Fin OriginAddress!!!",ctxFn.state.get('originAddress'))
            }else {
                ctxFn.endFlow({body: '❌ Presentamos algunos inconvenientes, lo sentimos,\nintenta solicitar el servicio desde la aplicación ❌'})
            }
            break
        case 'EndAddress':
            const origin = ctxFn.state.get('originAddress')
            const endAddress = ctxFn.state.get('responseEndAddress')[parseInt(ctx.body)].suggestion
            const queryParmas = `lat=${origin.lat}&lon=${origin.lon}&address=${endAddress.replace(/#/g,'%23')}&module_name=location_helper_suggestion_addresses`
            let response = await suggestions(queryParmas)
            const points = response[0].geometry.location
            if ((response.length  > 0)){
                await ctxFn.state.update({ endAddress: { address: response[0].address, lat: points.lat, lon: points.lng }})
                console.log("Fin EndAddress!!!",ctxFn.state.get('endAddress'))
            }else {
                ctxFn.endFlow({body: '❌ Presentamos algunos inconvenientes, lo sentimos,\nintenta solicitar el servicio desde la aplicación ❌'})
            }
            break
        default:
            ctxFn.endFlow({body: '❌ Presentamos algunos inconvenientes, lo sentimos,\nintenta solicitar el servicio desde la aplicación ❌'})
    }
}

function items(response){
    let list = response.map((item, index) => {
        let [address, ...rest] = [...new Set(item.suggestion.split(', ').map(item => item.toLowerCase()))].map(item => {
            return item.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        })
        return {
            id: `${index}`, // Genera un ID basado en el índice del array
            title: address || 'Sin registro', // Usa suggestion_title o un valor predeterminado
            description: rest.slice(1, -1).join(', ') || '' // Usa source o un valor predeterminado
        }
    })

    list.push({
        id: `422`,
        title: 'Otra dirección',
        description: 'No se encontró una dirección aproximada a tu ubicación'
    })
    return list
}

function items2(response){
    let list = response.map((item, index) => {
        return {
            id: `${index}:${item.geometry.location.lat}:${item.geometry.location.lng}`,
            title: item.title || 'Sin registro',
            description: item.formatted_address.split(', ').slice(1).join(', ') || ''
        }
    })

    list.push({
        id: `422`,
        title: 'Otra dirección',
        description: 'No se encontró una dirección aproximada a tu ubicación'
    })
    return list
}

function locationRequestMessage(number,text,provider){
    const body = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: number,
        type: 'interactive',
        interactive: {
            type: "location_request_message",
            body: {
                text: `${text}`
            },
            action: {
                name: "send_location"
            }
        },
    };
    return provider.sendMessageMeta(body)
}

const getLocationWppAdddress = addKeyword("###__getLocationWpp__###", { sensitive: true })
    .addAction(async (ctx, ctxFn) => {
        console.log("::: GOO origin ",ctxFn.state)
        await locationRequestMessage(
            ctx.from,
            'Vamos a empezar 🚩.\nPuedes marcarnos donde te recogeremos . 📍',
            ctxFn.provider
        )
    })
    .addAction(
        { capture: true },
        async (ctx, ctxFn) => {
            if ((eventLocation.test(ctx.body))){
                console.log(ctx)
                await ctxFn.state.update({ originAddress: { lat: ctx.latitude, lon: ctx.longitude, address: ctx.address }})
                // await ctxFn.state.update({ originAddress: { address: ctx.address, lat:  3.4329655, lon: -76.4979447 }})
                await ctxFn.gotoFlow(getLocationWppEndAdddress)
            }else {
                ctxFn.gotoFlow(getLocationWppAdddress)
            }
    })

const getLocationWppEndAdddress = addKeyword("###__getLocationWpp__###", { sensitive: true })
    .addAction(async (ctx, ctxFn) => {
        console.log(":::GO EndAdddres ")
        await locationRequestMessage(
            ctx.from,
            'Puedes marcarnos donde es el punto de finalización de servicio. 🕹',
            ctxFn.provider
        )
    })
    .addAction(
        { capture: true },
        async (ctx, ctxFn) => {
            if ((eventLocation.test(ctx.body))){
                await ctxFn.state.update({ endAddress: { lat: ctx.latitude, lon: ctx.longitude,  address: ctx.address }})
                // await ctxFn.state.update({ endAddress: { address: ctx.address, lat: 3.4329703, lon: -76.4979374 }})
                console.log("::: stop endAdddres ",ctxFn.state.get('originAddress'),ctxFn.state.get('endAddress'))
                await ctxFn.gotoFlow(service.listService)
            }else {
                ctxFn.gotoFlow(getLocationWppEndAdddress)
            }
    })


const locationWpp = addKeyword("###__locationWpp__###", { sensitive: true })
    .addAnswer('Envíanos tu ubicación a través de la opción de WhatsApp. 📍\n'+
        'Presiona el *+* o 📎, selecciona la opción *Ubicación* y luego oprime *Enviar mi ubicación actual*.',
        { capture: true, idle: options.idle },
        async (ctx, ctxFn) => {
            if (ctx?.idleFallBack) {
                await ctxFn.endFlow({body:'Se canceló el proceso por inactividad\n👋 ¡Ten un excelente día!'})
                return await ctxFn.gotoFlow(startApp.flowPrincipal)
            }
            if (eventLocation.test(ctx.body)) {
                console.log(ctx)
                await ctxFn.state.update({ lat: ctx.latitude, lon: ctx.longitude })
                await ctxFn.gotoFlow(locationParameters)
            }else {
                ctxFn.fallBack('Envíanos tu ubicación a través de la opción de WhatsApp 📍')
            }
        }
    )

const locationParameters = addKeyword("###__locationParameters__###", { sensitive: true })
    .addAnswer('¿Deseas solicitar un servicio desde tu ubicación actual?',
        {
            capture: true, idle: options.idle,
            buttons: [
                {body: 'Tu ubicación actual'},
                {body: 'Otra dirección'}
            ]
        },
        async (ctx, ctxFn) => {
            if (ctx?.idleFallBack) {
                await ctxFn.endFlow({body:'Se canceló el proceso por inactividad\n👋 ¡Ten un excelente día!'})
                return await ctxFn.gotoFlow(startApp.flowPrincipal)
            }
            switch (ctx.body) {
                case 'Tu ubicación actual':
                    await ctxFn.gotoFlow(address)
                    break
                case 'Otra dirección':
                    await ctxFn.flowDynamic(`Perfecto ${ctx.pushName}. ⏩\nIngresa direccion del punto de origen`)
                    await ctxFn.gotoFlow(locationAddress)
                    break
                default:
                    await ctxFn.fallBack('Para poder proceder con su solicitud, por favor responda  una de las opciones:')
            }
        }
    )

const locationAddress2 = addKeyword("###__locationAddress__###", { sensitive: true })
    .addAction(
        async (ctx, ctxFn) => {
            let header = {
                type: "text",
                text: `Punto de partida`
            }
            await address(ctx, ctxFn, header, `Por favor indícame la dirección del punto de *recogida*.` )
        }
    )
    .addAction(
        { capture: true },
        async (ctx, ctxFn) => {
            if ((ctx.type === 'interactive')){
                let body = JSON.parse(ctx.body)
                const query_parmas = `lat=0&lon=0&address=${body.address.replace(/#/g,'%23')}&city_name=${body.city}&country_code=CO&module_name=whatsapp`
                let originResponse = await suggestions(query_parmas)
                console.log('::::::::::::::originResponse',JSON.stringify(originResponse, null, 2))
                if ((originResponse.length  > 0)){
                    originResponse.forEach((element) => {
                        if (element.title.length > 24){
                            element.title = element.title.replace(/\s+/g, '')
                        }
                    })
                    let list = originResponse.filter(item => item.title.length <= 24).slice(0, 9)
                    // await ctxFn.state.update({ response_origin_address: originResponse })
                    await listAddress(ctx, ctxFn, list)
                }
                else {
                    await ctxFn.flowDynamic('No encontramos ninguna ubicación en referencia a la dirección que nos suministraste.')
                    await ctxFn.gotoFlow(locationAddress2)
                }
            }else {
                ctxFn.fallBack('Ingresa la dirección por favor.')
            }
        }
    )
    .addAction(
        { capture: true },
        async (ctx, ctxFn) => {
            if ((ctx.type === 'interactive')){
                if (ctx.body === '422'){
                    return await ctxFn.gotoFlow(locationAddress2)
                }
                let [index, lat, lon] = ctx.body.split(':')
                let address = ctx.description_list_reply.split(',')[0]

                await ctxFn.state.update({ originAddress: { lat: lat, lon: lon, address: `${ctx.title_list_reply}, ${address}` }})

                await ctxFn.gotoFlow(locationEndAddress2)
            }else {
                ctxFn.fallBack('Selecciona una dirección de la lista. ⬆⬆⬆')
            }
        }
    )

const locationEndAddress2 = addKeyword("###__locationAddress__###", { sensitive: true })
    .addAction(
        async (ctx, ctxFn) => {
            let header = {
                type: "text",
                text: `Punto de destino`
            }
            await address(ctx, ctxFn, header, `Por favor indícame la dirección del punto de *destino*.` )
        }
    )
    .addAction(
        { capture: true },
        async (ctx, ctxFn) => {
            if ((ctx.type === 'interactive')){
                let body = JSON.parse(ctx.body)
                const query_parmas = `lat=0&lon=0&address=${body.address.replace(/#/g,'%23')}&city_name=${body.city}&country_code=CO&module_name=whatsapp`
                let originResponse = await suggestions(query_parmas)
                if ((originResponse.length  > 0)){
                    let list = originResponse.filter(item => item.title.length <= 24).slice(0, 9)
                    // await ctxFn.state.update({ response_origin_address: originResponse })
                    await listAddress(ctx, ctxFn, list)
                }
                else{
                    await ctxFn.flowDynamic('No encontramos ninguna ubicación en referencia a la dirección que nos suministraste.')
                    await ctxFn.gotoFlow(locationEndAddress2)
                }
            }else {
                ctxFn.fallBack('Ingresa la dirección por favor.')
            }
        }
    )
    .addAction(
        { capture: true },
        async (ctx, ctxFn) => {
            if ((ctx.type === 'interactive')){
                if (ctx.body === '422'){
                    return await ctxFn.gotoFlow(locationEndAddress2)
                }
                let [index, lat, lon] = ctx.body.split(':')
                let address = ctx.description_list_reply.split(',')[0]

                await ctxFn.state.update({ endAddress: { lat: lat, lon: lon, address: `${ctx.title_list_reply}, ${address}` }})

                await ctxFn.gotoFlow(service.listService)
            }else {
                ctxFn.fallBack('Selecciona una dirección de la lista. ⬆⬆⬆')
            }
        }
    )

const locationAddress = addKeyword("###__address__###", { sensitive: true })
    .addAnswer(`Por favor indícame la dirección del punto de *recogida*.\nEscribe en un solo mensaje (Ej: *Av.Cra. 19 # 120 - 16, Santa Barbara, Bogotá*). 🎯`,
        { capture: true, idle: options.idle }, //5 min
        async (ctx, ctxFn) => {
            if (ctx?.idleFallBack) {
                await ctxFn.endFlow({body:'Se canceló el proceso por inactividad\n👋 ¡Ten un excelente día!'})
                return await ctxFn.gotoFlow(startApp.flowPrincipal)
            }
            if (!addressRegex.test(ctx.body)) {
                await ctxFn.fallBack('Escribe la dirección en un solo mensaje (Ej: *Av.Cra. 19 # 120 - 16, Santa Barbara, Bogotá*). 🎯')
            }else {
                // query_parmas ==>     lat, lon, address, t, kind
                const origin = ctxFn.state.get('originAddress')
                const query_parmas = `lat=$${origin.lat}&lon=$\{origin.lon}&address=Cra26m1%2354-49,nueva floresta,cali&kind=destiny`
                let response = await suggestionAutocomplete(query_parmas)
                response = response.filter(item => item.suggestion_title.length <= 24)
                console.log(response,'::::::locationAddress')
                if ((response.length  > 0)){
                    response.filter(item => item.suggestion_title.length <= 24)
                    await ctxFn.state.update({ response_origin_address: response })
                    await listAddress(ctx, ctxFn, response)
                }else {
                    ctxFn.fallBack('Ingresa nuevamente la dirección del destino como indica el ejemplo.')
                }
                await ctxFn.flowDynamic(`Perfecto. ⏩`)
                await ctxFn.gotoFlow(locationEndAddress)
            }
        }
    )
    .addAction(
        { capture: true },
        async (ctx, ctxFn) => {
            // await state.update({ name: ctx.body })
            if ((ctx.type === 'interactive')){
                if (ctx.body === '422'){
                    return await ctxFn.gotoFlow(locationAddress)
                }
                // console.log('::::::getOriginAddress')
                await suggestionAddress(ctx, ctxFn, 'OriginAddress')
                await ctxFn.gotoFlow(locationEndAddress)
            }else {
                ctxFn.fallBack('Selecciona una dirección de la lista. ⬆⬆⬆')
            }
        }
    )

const locationEndAddress = addKeyword("###__locationEndAddress__###", { sensitive: true })
    .addAnswer(`Por favor indícame la dirección del punto de *destino*.\nEscribela en un solo mensaje (Ej: *Av.Cra. 19 # 120 - 16, Santa Barbara, Bogotá*). 🎯`,
        { capture: true, idle: options.idle }, //5 min
        async (ctx, ctxFn) => {
            if (ctx?.idleFallBack) {
                await ctxFn.endFlow({body:'Se canceló el proceso por inactividad\n👋 ¡Ten un excelente día!'})
                return await ctxFn.gotoFlow(startApp.flowPrincipal)
            }
            // query_parmas ==>     lat, lon, address, t, kind
            if (!addressRegex.test(ctx.body)) {
                await ctxFn.fallBack('Escribe la dirección en un solo mensaje (Ej: *Av.Cra. 19 # 120 - 16, Santa Barbara, Bogotá*). 🎯')
            }else {
                const origin = ctxFn.state.get('originAddress')
                const query_parmas = `lat=${origin.lat}&lon=${origin.lon}&address=${ctx.body.replace(/#/g,'%23')}&kind=destiny`
                let response = await suggestionAutocomplete(query_parmas)
                response = response.filter(item => item.suggestion_title.length <= 24)
                console.log('::: Response suggestionAutocomplete',response.status)
                if ((response.length  > 0)){
                    response.filter(item => item.suggestion_title.length <= 24)
                    await ctxFn.state.update({ responseEndAddress: response })
                    await listAddress(ctx, ctxFn, response)
                }else {
                    ctxFn.fallBack('Ingresa nuevamente la dirección del destino como indica el ejemplo.')
                }
            }
        }
    )
    .addAction({ capture: true }, async (ctx, ctxFn) => {
            // await state.update({ name: ctx.body })
            if ((ctx.type === 'interactive')){
                if (ctx.body === '422'){
                    return await ctxFn.gotoFlow(locationEndAddress)
                }
                await suggestionAddress(ctx, ctxFn, 'EndAddress')
                console.log('Entra la lista de servicios con los puntos ya obtenidos')
                await ctxFn.gotoFlow(service.listService)
                console.log('Entra la lista de servicios con los puntos ya obtenidos')
            }else {
                ctxFn.fallBack('Selecciona una dirección de la lista. ⬆⬆⬆')
            }
        }
    )



module.exports = { 
    locationParameters, 
    locationWpp, 
    locationAddress,
    locationAddress2,
    locationEndAddress,
    locationEndAddress2,
    getLocationWppAdddress,
    getLocationWppEndAdddress 
};

const {addKeyword, EVENTS} = require("@bot-whatsapp/bot");
const eventLocation = /event_location/;

async function listAddress(ctx, ctxFn, response) {
    const headerText = 'Lista de direcciones encontradas'
    const bodyText = 'Seleccione la dirección que corresponde a la indicada anteriormente o que más se aproxime.'
    const footerText = ''
    const buttonList = 'Direcciones'
    const listParams = [
        {
            title: '📍',
            rows: items(response)
        }
    ]
    await ctxFn.provider.sendList(ctx.from, headerText, bodyText, footerText, buttonList, listParams)
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
    const url = `${server}${route}?${query_parmas}&t=${token}`

    return await requestsApi.makeGetRequest(url)
}

async function suggestionAddress(ctx, ctxFn, key ) {
    console.log('::::::suggestionAddress')
    switch (key) {
        case 'OriginAddress':
            const originAddress = ctxFn.state.get('response_end_address')[parseInt(ctx.body)].suggestion
            const originQueryParmas = `lat=3.429294867581182&lon=-76.52695039247168&address=${originAddress.replace(/#/g,'%23')}&module_name=location_helper_suggestion_addresses`
            let originResponse = await suggestions(originQueryParmas)
            const originPoints = originResponse[0].geometry.location
            if ((originResponse.length  > 0)){
                await ctxFn.state.update({ originAddress: { lat: originPoints.lat, lon: originPoints.lng }})
                console.log("Fin OriginAddress!!!",ctxFn.state.get('originAddress'))
            }else {
                ctxFn.endFlow({body: '❌ Presentamos algunos inconvenientes, lo sentimos,\nintenta solicitar el servicio desde la aplicación ❌'})
            }
            break
        case 'EndAddress':
            const endAddress = ctxFn.state.get('response_end_address')[parseInt(ctx.body)].suggestion
            const queryParmas = `lat=3.429294867581182&lon=-76.52695039247168&address=${endAddress.replace(/#/g,'%23')}&module_name=location_helper_suggestion_addresses`
            let response = await suggestions(queryParmas)
            const points = response[0].geometry.location
            if ((response.length  > 0)){
                await ctxFn.state.update({ endAddress: { lat: points.lat, lon: points.lng }})
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
    return response.map((item, index) => {
        let [address, ...rest] = [...new Set(item.suggestion.split(', ').map(item => item.toLowerCase()))].map(item => {
            return item.split(' ').map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1)).join(' ');
        })
        return {
            id: `${index}`, // Genera un ID basado en el índice del array
            title: address || 'Sin registro', // Usa suggestion_title o un valor predeterminado
            description: rest.join(', ') || ''  // Usa source o un valor predeterminado
        }
    })
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
        console.log("::: GOO origin ")
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
                await ctxFn.state.update({ originAddress: { lat: ctx.latitude, lon: ctx.longitude }})
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
                await ctxFn.state.update({ endAddress: { lat: ctx.latitude, lon: ctx.longitude }})
                console.log("::: stop endAdddres ",ctxFn.state.get('originAddress'),ctxFn.state.get('endAddress'))
            }else {
                ctxFn.gotoFlow(getLocationWppEndAdddress)
            }
    })


const locationWpp = addKeyword("###__locationWpp__###", { sensitive: true })
    .addAnswer('Envíanos tu ubicación a través de la opción de WhatsApp. 📍\n'+
        'Presiona el *+* o 📎, selecciona la opción \'*Ubicación*\' y luego oprime \'*Enviar mi ubicación actual*\'.',
        { capture: true },
        async (ctx, ctxFn) => {
            if (eventLocation.test(ctx.body)) {
                await ctxFn.state.update({ lat: ctx.latitude, lon: ctx.longitude, name: ctx.pushName })
                await ctxFn.gotoFlow(locationParameters)
            }else {
                ctxFn.fallBack('Envíanos tu ubicación a través de la opción de WhatsApp 📍')
            }
        }
    )

const locationParameters = addKeyword("###__locationParameters__###", { sensitive: true })
    .addAnswer('¿Deseas solicitar un servicio desde tu ubicación actual?',
        {
            capture: true,
            buttons: [
                {body: 'Tu ubicación actual'},
                {body: 'Otra dirección'}
            ]
        },
        async (ctx, ctxFn) => {
            switch (ctx.body) {
                    case 'Tu ubicación actual':
                    await ctxFn.state.update({ origin: { lat: ctxFn.state.get('lat'), lon: ctxFn.state.get('lon') }})
                    await ctxFn.flowDynamic(`Perfecto ${ctx.pushName}. ⏩`)
                    await ctxFn.gotoFlow(locationEndAddress)
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

const locationAddress = addKeyword("###__address__###", { sensitive: true })
    .addAnswer(`Escribe la dirección completa del punto de origen porfavor.\nEscribe en un solo mensaje (Ej: *Av.Cra. 19 # 120 - 16, Santa Barbara, Bogotá*). 🎯`,
        { capture: true },
        async (ctx, ctxFn) => {

            // query_parmas ==>     lat, lon, address, t, kind
            // const origin = ctxFn.state.get('origin')
            const query_parmas = 'lat=3.4330263137817&lon=-76.497924804688&address=Cra26m1%2354-49,nueva floresta,cali&kind=destiny'//`lat=${origin.lat}&lon=${origin.lon}&address=${ctx.body.replace(/#/g,'%23')}&kind=destiny`
            let response = await suggestionAutocomplete(query_parmas)
            response = response.filter(item => item.suggestion_title.length <= 24)
            // console.log(response.length,'::::::locationAddress')
            if ((response.length  > 0)){
                response.filter(item => item.suggestion_title.length <= 24)
                await ctxFn.state.update({ response_end_address: response })
                await listAddress(ctx, ctxFn, response)
            }

        }
    )
    .addAction({ capture: true }, async (ctx, ctxFn) => {
            // await state.update({ name: ctx.body })
            if ((ctx.type === 'interactive')){
                // console.log('::::::getOriginAddress')
                await suggestionAddress(ctx, ctxFn, 'OriginAddress')
            }else {
                ctxFn.fallBack('Selecciona una dirección de la lista. ⬆⬆⬆')
            }
        }
    )

const locationEndAddress = addKeyword("###__locationEndAddress__###", { sensitive: true })
    .addAnswer(`Escribe la dirección completa del punto de destino porfavor.\nEscribela en un solo mensaje (Ej: *Av.Cra. 19 # 120 - 16, Santa Barbara, Bogotá*). 🎯`,
        { capture: true },
        async (ctx, ctxFn) => {
            // query_parmas ==>     lat, lon, address, t, kind
            // const origin = ctxFn.state.get('origin')
            const query_parmas = 'lat=3.4330263137817&lon=-76.497924804688&address=Cra26m1%2354-49,nueva floresta,cali&kind=destiny'//`lat=${origin.lat}&lon=${origin.lon}&address=${ctx.body.replace(/#/g,'%23')}&kind=destiny`
            let response = await suggestionAutocomplete(query_parmas)
            response = response.filter(item => item.suggestion_title.length <= 24)
            // console.log(response.length,'::::::locationEndAddress')
            if ((response.length  > 0)){
                response.filter(item => item.suggestion_title.length <= 24)
                await ctxFn.state.update({ response_end_address: response })
                await listAddress(ctx, ctxFn, response)
            }else{
                ctxFn.fallBack('Ingresa nuevamente la dirección del destino como indica el ejemplo.')
            }
        }
    )
    .addAction({ capture: true }, async (ctx, ctxFn) => {
            // await state.update({ name: ctx.body })
            if ((ctx.type === 'interactive')){
                await suggestionAddress(ctx, ctxFn, 'EndAddress')
                // console.log('fin:::addAction:::getOriginAddress')
            }else {
                ctxFn.fallBack('Selecciona una dirección de la lista. ⬆⬆⬆')
            }
        }
    )



module.exports = { 
    locationParameters, 
    locationWpp, 
    locationAddress, 
    locationEndAddress, 
    getLocationWppAdddress, 
    getLocationWppEndAdddress 
};

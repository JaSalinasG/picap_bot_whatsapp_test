// const fetch = require('node-fetch');

async function request(url, requestOptions){
    try {
        const response = await fetch(url, requestOptions);
        let data = await response.json()
        // console.log('::::::::response.status',response.status)
        data.status = response.status
        return (data); // Devolver los datos
    } catch (error) {
        console.error('HTTP Request Error:', error);
        // throw error;
        return { status: 422 }; // Devolver undefined en caso de error
    }
}

const makePostRequest = async (url, body) => {
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    };

    // try {
    //     const response = await fetch(url, requestOptions);
    //     let data = await response.json()
    //     data.status = response.status
    //     return (data); // Devolver los datos
    // } catch (error) {
    //     console.error('HTTP Request Error:', error);
    //     // throw error;
    //     // console.log('Network response was not ok ::: ERROR ',response)
    //     return { status: 500 }; // Devolver undefined en caso de error
    // }
    return await request(url, requestOptions)
};

const makeGetRequest = async (url) => {
    const requestOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }

    // try {
    //     const response = await fetch(url, requestOptions);
    //     let data = await response.json()
    //     data.status = response.status
    //     return (data); // Devolver los datos
    // } catch (error) {
    //     console.error('HTTP Request Error:', error);
    //     // throw error;
    //     return undefined; // Devolver undefined en caso de error
    // }
    return await request(url, requestOptions)
};

const makePatchRequest = async (url, body) => {
    const requestOptions = {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }

   return await request(url, requestOptions)
};

module.exports = {
    makePostRequest,
    makeGetRequest,
    makePatchRequest
};

// const fetch = require('node-fetch');

const makePostRequest = async (url, body) => {
    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    };

    try {
        const response = await fetch(url, requestOptions);
        let data = await response.json()
        // data.status = response.status
        console.log(data,'POST:::::::requestsApi'); // Borrar
        return (data); // Devolver los datos
    } catch (error) {
        // console.error('HTTP Request Error:', error);
        // throw error;
        console.log('Network response was not ok ::: ERROR ' + response.statusText)
        return []; // Devolver undefined en caso de error
    }
};

const makeGetRequest = async (url) => {
    const requestOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }

    try {
        const response = await fetch(url, requestOptions);
        let data = await response.json()
        data.status = response.status
        // console.log('GET:::::::requestsApi/response.status',response.status); // Borrar
        // console.log('GET:::::::requestsApi',data); // Borrar
        return (data); // Devolver los datos
    } catch (error) {
        // console.error('HTTP Request Error:', error);
        // throw error;
        console.log('Network response was not ok ::: ERROR ' + response.statusText)
        return undefined; // Devolver undefined en caso de error
    }
};

module.exports = {
    makePostRequest,
    makeGetRequest
};

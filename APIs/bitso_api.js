const axios = require("axios");

const groupBy = (arr, key) => {
    const groupedData = arr.reduce((acc, value) => {
        if (!acc[value[key]]) {
            acc[value[key]] = []
        }
        acc[value[key]].push(value)
        return acc

    }, {})

    return groupedData
}

const calcAvgPrice = (arr) => {
    /* 
    Average Entry Price = Total number of contracts / Total contract value in BTC
    Total contract value in BTC = [(Quantity A / Price A) + (Quantity B / Price B) + (Quantity C / Price C) ...]
    */
    //tnc = Total number of contracts
    const tnc = arr.reduce((acc, cur) => {
        let amount = Number(cur["major"])
        amount < 0 ? amount *= -1 : amount


        return acc + amount
    }, 0)

    //Total contract value
    const tcvArr = arr.map(elem => {
        return Number(elem["major"]) / Number(elem["price"])
    })

    const tcv = tcvArr.reduce((acc, cur) => acc + cur, 0)

    const AvgPrice = tnc / tcv
    //return tnc, AvgPrice, Total cost
    return [tnc, AvgPrice, tnc * AvgPrice]
}

const createSignature = (nonce, method, reqPath, apiSecret, json_payload = {}) => {
    // Create the signature

    const message = nonce + method + reqPath;
    const payload = JSON.stringify(json_payload)
    if (method == "POST")
        message += payload;
    const crypto = require('crypto');
    const signature = crypto.createHmac('sha256', apiSecret).update(message).digest('hex');

    return signature
}

module.exports = async function getBitsoData(key, secret) {

    const http_method = "GET";  // Change to POST if endpoint requires data
    //const request_path="/v3/balance/"
    const request_path = "/v3/user_trades/"
    const nonce = new Date().getTime();

    const signature = createSignature(nonce, http_method, request_path, secret)
    // Build the auth header
    const auth_header = "Bitso " + key + ":" + nonce + ":" + signature;

    //test server url: https://api-sandbox.bitso.com/v3/
    //API url:  https://api.bitso.com
    const config = {
        baseURL: 'https://api.bitso.com',
        url: request_path,
        method: http_method,
        headers: {
            'Authorization': auth_header,
            'Content-Type': 'application/json'
        },
        data: {},
    };

    const data = await axios(config)
        .then((response) => {

            const groupedData = groupBy(response.data.payload, "oid")

            const orderId = Object.keys(groupedData)

            const orders =  orderId.map((elem) => {
                //groupedData -> array with different orders filtered by orderID
                //elem -> Order ID
                // 0 -> first element from groupedData array
                groupedData[elem][0]["major"] = calcAvgPrice(groupedData[elem])[0]
                groupedData[elem][0]["price"] = calcAvgPrice(groupedData[elem])[1]
                groupedData[elem][0]["minor"] = calcAvgPrice(groupedData[elem])[2]

                return groupedData[elem][0]
            })
            
            return orders
        }
        )
        .catch(err => console.log(err))

    return data
}

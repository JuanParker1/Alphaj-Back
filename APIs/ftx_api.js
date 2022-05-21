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
        return acc + cur["size"]
    }, 0)

    //Total contract value
    const tcvArr = arr.map(elem => {
        return elem["size"] / elem["price"]
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

module.exports = function getFTXData(key, secret, subAcc) {
    let data = []
    const http_method = "GET";  // Change to POST if endpoint requires data
    const nonce = new Date().getTime();
    const request_path = "/api/fills?start_time=1621371415&end_time=1652885815&limit=50"
    
    const headers = (key, nonce, subAcc) =>{
        if (subAcc === undefined){
            return {
                    'FTX-KEY': key,
                    'FTX-SIGN': createSignature(nonce, http_method, request_path, secret),
                    'FTX-TS': nonce,
                }
        } else {
            return {
                    'FTX-KEY': key,
                    'FTX-SIGN': createSignature(nonce, http_method, request_path, secret),
                    'FTX-TS': nonce,
                    'FTX-SUBACCOUNT': subAcc
                }
        }
    }

    // Send request
    const config = {
        baseURL: 'https://ftx.com',
        url: request_path,
        method: http_method,
        headers: headers(key, nonce, subAcc)
    };


    axios(config)
        .then(response => {
            //console.log(response.data)
            data = [...response.data.result]
            //console.log("group Trades: ", data)

            const groupedData = groupBy(data, "orderId")
            console.log("group Trades: ", groupedData)

            const keys = Object.keys(groupedData)
            console.log(keys)

            keys.forEach((elem) => {
                groupedData[elem][0]["size"] = calcAvgPrice(groupedData[elem])[0]
                groupedData[elem][0]["price"] = calcAvgPrice(groupedData[elem])[1]
                //console.log("trades:",groupedData[elem][0] ,calcAvgPrice(groupedData[elem]))
            })
        })
        .catch(err => console.log(err))

}

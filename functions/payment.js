
const { validatePaymentPayload } = require('./paymentServer/schema');
const { ApiError, client: square } = require('./paymentServer/square');
const { nanoid } = require('nanoid');
require('dotenv').config();
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
const PAYPAL_APP_SECRET = process.env.PAYPAL_APP_SECRET
const fetch = require("node-fetch");
const baseURL = {
	    sandbox: "https://api-m.sandbox.paypal.com",
	   // production: "https://api-m.paypal.com"
	};


const processCashAppPayment = async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    const depositPayment = BigInt(req.body.payment);
    const payload = {
      locationId: req.body.locationId,
      sourceId: req.body.sourceId
    }
    if (!validatePaymentPayload(payload)) { // schema validates incoming requests
        return res.status(400).json(getResponseJSON('Bad Request!', 400));
    }
    try{
    const idempotencyKey = nanoid();
    const payment = {
      idempotencyKey,
      locationId: payload.locationId,
      sourceId: payload.sourceId,
      amountMoney: {
        amount: depositPayment,
        currency: 'USD',
      },
    };
    if (payload.customerId) {
      payment.customerId = payload.customerId;
    }
    const { result, statusCode } = await square.paymentsApi.createPayment(payment); // square provides the API client and error types
    console.log('resultttttt', result)
    if(statusCode === 200) {
        const { validateIDToken, updatePaymentSuccess  } = require('./shared');
        const decodedToken = await validateIDToken(idToken);
        await updatePaymentSuccess(decodedToken.uid, result.payment.id, result.payment.receiptUrl, req.body.paymentMethod, depositPayment);
    }
  }
    catch (ex) {
      if (ex instanceof ApiError) {
        // likely an error in the request. don't retry
        console.log(ex.errors);
      } else {
        // IDEA: send to error reporting service
        console.log(`Error creating payment on attempt: ${ex}`);
        throw ex; // to attempt retry
      }
    }
}

const createOrder = async (payment) => {
    const accessToken = await generateAccessToken();
    const url = `${baseURL.sandbox}/v2/checkout/orders`;
    const depositPayment = payment;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: depositPayment,
            },
          },
        ],
      }),
    });
    const data = await response.json();
    return data;
  }

  	// use the orders api to capture payment for an order
const capturePayment = async (orderId, req) => {
 	  const accessToken = await generateAccessToken();
  	  const url = `${baseURL.sandbox}/v2/checkout/orders/${orderId}/capture`;
  	  const response = await fetch(url, {
  	    method: "POST",
  	    headers: {
  	      "Content-Type": "application/json",
  	      Authorization: `Bearer ${accessToken}`,
  	    },
  	  });
  	  const data = await response.json();
      console.log('fs', data)
      if(data.status === 'COMPLETED') {
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        const { validateIDToken, updatePaymentSuccess  } = require('./shared');
        const decodedToken = await validateIDToken(idToken);
        await updatePaymentSuccess(decodedToken.uid, data.id, data.links[0].href, req.body.paymentMethod, req.body.payment);
    }
  	  return data;
}

// generate an access token using client id and app secret
async function generateAccessToken() {
  const auth = Buffer.from(PAYPAL_CLIENT_ID + ":" + PAYPAL_APP_SECRET).toString("base64")
  const response = await fetch(`${baseURL.sandbox}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });
  const data = await response.json();
  return data.access_token;
}


module.exports = {
    processCashAppPayment,
    createOrder,
    capturePayment
}
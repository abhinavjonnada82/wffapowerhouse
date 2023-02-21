const functions = require("firebase-functions");
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const initUser = require('./initUser');
const teamData = require('./teamData');

const { validatePaymentPayload } = require('./paymentServer/schema');
const { ApiError, client: square } = require('./paymentServer/square');
const { nanoid } = require('nanoid');


const app = express();
app.use(cors({ origins: true }));

// Configuring body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.post('/payments', (req, res) => {
    processCashAppPayment(req)
    res.status(200).json({message: `Success!`, code:200})
})


const processCashAppPayment = async (req, res) => {
    const idToken = req.headers.authorization?.split('Bearer ')[1];
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
        amount: '1000',
        currency: 'USD',
      },
    };
    if (payload.customerId) {
      payment.customerId = payload.customerId;
    }
    const { result, statusCode } = await square.paymentsApi.createPayment(payment); // square provides the API client and error types
    if(statusCode === 200) {
        const { validateIDToken, updatePaymentSuccess } = require('./shared');
        let decodedToken = await validateIDToken(idToken);
        await updatePaymentSuccess(decodedToken.uid);
        console.log('success', result.payment)
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

exports.initUser = initUser.initUser
exports.teamData = teamData.teamData
exports.paymentPivot = functions.https.onRequest(app);

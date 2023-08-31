const functions = require("firebase-functions");
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const initUser = require('./initUser');
const teamData = require('./teamData');

const app = express();
app.use(cors({ origins: true }));

// Configuring body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.post('/cashapp-payment', (req, res) => {
    const { processCashAppPayment } = require('./shared');
    processCashAppPayment(req)
    res.status(200).json({message: `Success!`, code:200})
})

app.post("/create-paypal-order", async (req, res) => {
  const { createOrder } = require('./shared');
  const order = await createOrder(req.body.payment);
  res.json(order);
});

app.post("/capture-paypal-order", async (req, res) => {
  const { capturePayment } = require('./shared');
  const { orderID } = req.body;
  const captureData = await capturePayment(orderID, req);
  // TODO: store payment information such as the transaction ID
  res.json(captureData);
});

exports.initUser = initUser.initUser
exports.teamData = teamData.teamData
exports.paymentPivot = functions.https.onRequest(app);

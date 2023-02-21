const logger = require('./paymentServer/logger');
const {
  validatePaymentPayload,
} = require('./paymentServer/schema');
const { ApiError, client: square } = require('./paymentServer/square');


const processCashAppPayment = async (req, res) => {
    console.log('1234', req.body)
  //   const payload = req
  //   // const payload = {
  //   //   locationId: "LR72E4C5EYMQ6",
  //   //   sourceId: "wnon:CA4SEB1U9Ep0W_sysFfTNi0jUYMYAQ"
  //   // }
  //   if (!validatePaymentPayload(payload)) { // schema validates incoming requests
  //     console.log('Bad Request');
  //   }
  //   try{
  //   const idempotencyKey = `xTV22ZZxppR-czsiKybau`;
  //   const payment = {
  //     idempotencyKey,
  //     locationId: 'LR72E4C5EYMQ6',
  //     sourceId: 'wnon:CA4SEMUZjhLMfPbWuFtKjrefFuIYAQ',
  //     amountMoney: {
  //       amount: '1000',
  //       currency: 'USD',
  //     },
  //   };
  //   // if (payload.customerId) {
  //   //   payment.customerId = payload.customerId;
  //   // }
  //   const { result, statusCode } = await square.paymentsApi.createPayment(payment); // square provides the API client and error types
  //   console.log('res', statusCode)
  //   if(statusCode) {
  //     console.log('success', result.payment)
  //   }
  // }
  //   catch (ex) {
  //     if (ex instanceof ApiError) {
  //       // likely an error in the request. don't retry
  //       logger.error(ex.errors);
  //     } else {
  //       // IDEA: send to error reporting service
  //       logger.error(`Error creating payment on attempt: ${ex}`);
  //       throw ex; // to attempt retry
  //     }
  //   }
  }

  module.exports = {
    processCashAppPayment
  };
  
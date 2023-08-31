const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();
const { validatePaymentPayload } = require('./paymentServer/schema');
const { ApiError, client: square } = require('./paymentServer/square');
const { nanoid } = require('nanoid');

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
const PAYPAL_APP_SECRET = process.env.PAYPAL_APP_SECRET
const fetch = require("node-fetch");
const baseURL = {
	    sandbox: "https://api-m.sandbox.paypal.com",
	   // production: "https://api-m.paypal.com"
	};

const setHeaders = (res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers','Accept,Content-Type,Content-Length,Accept-Encoding,X-CSRF-Token,Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
}

const grabTeamData = async (userId) => {
  try{
      const snapShot = await db.collection('teamRoster').where('uid', '==', userId).get();
      if(snapShot.size > 0){
            return snapShot.docs.map(document => document.data());
        }
        else {
            return false;
        }
  }
  catch(error){
      console.error(error);
      return new Error(error);
  }
}

const grabAllTeamData = async () => {
  try{
      const snapShot = await db.collection('teamRoster').where('approve', '==', false).get();
      if(snapShot.size > 0){
            return snapShot.docs.map(document => document.data());
        }
        else {
            return false;
        }
  }
  catch(error){
      console.error(error);
      return new Error(error);
  }
}

const grabAllUserData = async () => {
  try{
      const snapShot = await db.collection('users').where('teamSignup', '==', true).get();
      if(snapShot.size > 0){
            return snapShot.docs.map(document => document.data());
        }
        else {
            return false;
        }
  }
  catch(error){
      console.error(error);
      return new Error(error);
  }
}


const addTeamData = async (data, userId) => {
  try {
       await db.collection('teamRoster').add(data);
       const snapshot = await db.collection('users').where('uid', '==', userId).get();
       if (snapshot.empty) return false
       const docId = snapshot.docs[0].id;
       await db.collection("users").doc(docId).update({teamSignup: true})
       return true;
   }
   catch(error){
       console.error(error);
       return new Error(error);
   }
}

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
        amount: req.body.payment,
        currency: 'USD',
      },
    };
    if (payload.customerId) {
      payment.customerId = payload.customerId;
    }
    const { result, statusCode } = await square.paymentsApi.createPayment(payment); // square provides the API client and error types
    if(statusCode === 200) {
        const decodedToken = await validateIDToken(idToken);
        await updatePaymentSuccess(decodedToken.uid);
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
              value: payment,
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
      if(data.status === 'COMPLETED') {
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        const decodedToken = await validateIDToken(idToken);
        await updatePaymentSuccess(decodedToken.uid);
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

const updatePaymentSuccess = async (userId) => {
    try {
         const snapshot = await db.collection('users').where('uid', '==', userId).get();
         if (snapshot.empty) return false
         const docId = snapshot.docs[0].id;
         await db.collection("users").doc(docId).update({payment: true})
         return true;
     }
     catch(error){
         console.error(error);
         return new Error(error);
     }
  }
  

const grabUserData = async (userId) => {
  try{
      const snapShot = await db.collection('users').where('uid', '==', userId).get();
      if(snapShot){
            return snapShot.docs.map(document => document.data());
        }
        else {
            return false;
        }
  }
  catch(error){
      console.error(error);
      return new Error(error);
  }
}

const setName = async (data, userId) => {
  try{
    const snapshot = await db.collection('users').where('uid', '==', userId).get();
    if (snapshot.empty) return false
    const docId = snapshot.docs[0].id;
    await db.collection("users").doc(docId).update({name: data.data})
    return true;
  }
  catch(error){
      console.error(error);
      return new Error(error);
  }
}

const integrateRulesEngine = async (data, userId) => {
    try{
        const pin = parseInt(data.pin)
        const snapshot = await db.collection('rulesEngine').where('PIN', '==', pin).get();
        if (snapshot.empty) return `incorrectPin`
        await db.collection("users").doc(userId).update({ 
            rulesEngineActive: true,
            rules: snapshot.docs[0].data()
            })
        return true;
    }
    catch(error){
        console.error(error);
        return new Error(error);
    }
  }

const setTeamApproval = async (userId, phone) => {
  try {
      let docId = ``
      let docRef = db.collection('users').doc(userId);
      await docRef.update({
        approve: true
      });
      let snapShot = db.collection('teamRoster').where('uid', '==', userId).get()
      .then((querySnapshot) => {
        querySnapshot.forEach(async(doc) =>  {
            docId = doc.id
              await db.collection("teamRoster").doc(docId).update({approve: true})
              return true
        });
      let docRef = db.collection('messages').add({
          to: `+1${phone}`,
          body: 'Your team has been approved! - WFFA Team',
          mediaUrl: ['https://raw.githubusercontent.com/abhinavjonnada82/wffawebapp/dev/src/assets/dog.png']
      })
    })
    .catch((error) => {
        console.log("Error getting documents: ", error);
    });
      return true
  }
  catch(error){
      console.error(error);
      return new Error(error);
  }
}

const storeAdminRules = async (data) => {
    try {
        const userId = data.userId
        await db.collection('rulesEngine').add(data.rules);
        const snapshot = await db.collection('users').where('uid', '==', userId).get();
        if (snapshot.empty) return false
        const docId = snapshot.docs[0].id;
        await db.collection("users").doc(docId).update({rulesEngineActive: true})
        return true;
     }
     catch(error){
         console.error(error);
         return new Error(error);
     }
}

const grabAdminRules = async (userId) => {
    try{
        const snapShot = await db.collection('rulesEngine').where('userId', '==', userId).get();
        if(snapShot){
              return snapShot.docs.map(document => document.data());
          }
          else {
              return false;
          }
    }
    catch(error){
        console.error(error);
        return new Error(error);
    }
}

const getResponseJSON = (message, code) => {
    return { message, code };
};

const validateIDToken = async (idToken) => {
    try{
        const decodedToken = await admin.auth().verifyIdToken(idToken, true);
        return decodedToken;
    }
    catch(error){
        console.error(error);
        return new Error(error);
    }
}

module.exports = {
    setHeaders,
    getResponseJSON,
    grabTeamData,
    grabAllTeamData,
    grabAllUserData,
    addTeamData,
    grabUserData,
    validateIDToken,
    setTeamApproval,
    setName,
    updatePaymentSuccess,
    storeAdminRules,
    grabAdminRules,
    integrateRulesEngine,
    processCashAppPayment,
    createOrder,
    capturePayment
  }

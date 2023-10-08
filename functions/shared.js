const admin = require('firebase-admin');
const db = admin.firestore();

require('dotenv').config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

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

const grabAllTeamData = async (PIN) => {
  try{
      const snapShot = await db.collection('teamRoster').where('approve', '==', false).where('PIN', '==', parseInt(PIN)).get();
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
       await db.collection("users").doc(docId).update({
                                    teamSignup: true,
                                    teamName: data.data.teamName
                                  })
       return true;
   }
   catch(error){
       console.error(error);
       return new Error(error);
   }
}

const updatePaymentSuccess = async (userId, transactionId, receiptUrl, paymentMethod, initalDepositPayment) => {
    try {
         const snapshot = await db.collection('users').where('uid', '==', userId).get();
         if (snapshot.empty) return false
         const docId = snapshot.docs[0].id;
         if (paymentMethod === 'initalDeposit') {
          await db.collection("users").doc(docId).update({
            initalPaymentDepositFlag: true,
            initalDepositTransactionId: transactionId,
            initalDepositReceiptUrl: receiptUrl,
            initalDepositPayment
          })
         }
         else {
          await db.collection("users").doc(docId).update({
            payment: true,
            transactionId,
            receiptUrl,
          })
         }

        try {
          client.messages.create({
            body: `Thanks for your payment. Here is your receipt ${receiptUrl} !`,
            from: process.env.PHONE_NUMBER,
            to: processPhoneNumber(snapshot.docs[0].data().phone)
          })
          .then(message => console.log(message.sid));
        } catch(error){
          console.error('Twilio error:', error.message);
          console.error('Twilio moreInfo:', error.moreInfo)
        }
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
      if (snapShot.docs.length) {
        return snapShot.docs.map(document => { return document.data() });
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
    await db.collection("users").doc(docId).update({
      name: data.name,
      phone: data.phone
    })
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
      try {
          client.messages
          .create({
            body: 'Your team has been approved! - WFFA Team',
            from: process.env.PHONE_NUMBER,
            to: processPhoneNumber(phone),
            mediaUrl: ['https://raw.githubusercontent.com/abhinavjonnada82/wffawebapp/dev/src/assets/dog.png']
          })
          .then(message => console.log(message.sid));
        } catch(error){
          console.error('Twilio error:', error.message);
          console.error('Twilio moreInfo:', error.moreInfo)
        }
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
        await db.collection("users").doc(docId).update({
          rulesEngineActive: true,
          PIN: data.rules.PIN
        })
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

const getPendingTeamSignUp = async () => {
  try{
      const snapShot = await db.collection('users').where('teamSignup', '==', false).where('rulesEngineActive', '==', true).get();
      if(snapShot.size > 0){
            return snapShot.docs.map(document => {
              try {
                client.messages
                .create({
                  body: `Remember to sign up your team before registration closes on ${document.data().rules.registrationDates[1]}!`,
                  from: process.env.PHONE_NUMBER,
                  to: processPhoneNumber(document.data().phone)
                })
                .then(message => console.log(message.sid));
            } catch(error){
                console.error('Twilio error:', error.message);
                console.error('Twilio moreInfo:', error.moreInfo)
            }
            });
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

const getUnpaidTeam = async () => {
  try{
      const snapShot = await db.collection('users').where('approve', '==', true).where('payment', '==', false).where('rulesEngineActive', '==', true)
      .orderBy('uid', 'asc').get();
      if(snapShot.size > 0){
            return snapShot.docs.map(document => {
              try {
              client.messages
              .create({
                body: 'Remainder to pay your WFFA dues!',
                from: process.env.PHONE_NUMBER,
                to: processPhoneNumber(document.data().phone)
              })
              .then(message => console.log(message.sid));
            } catch(error){
              console.error('Twilio error:', error.message);
              console.error('Twilio moreInfo:', error.moreInfo)
            }
            });
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

const getPaidTeam = async () => {
  try{
      const snapShot = await db.collection('users').where('payment', '==', true).where('rulesEngineActive', '==', true).get();
      if(snapShot.size > 0){
            return snapShot.docs.map(document => {
              try {
              client.messages
              .create({
                body: 'Get ready to play!',
                from: process.env.PHONE_NUMBER,
                to: processPhoneNumber(document.data().phone),
                mediaUrl: ['https://raw.githubusercontent.com/abhinavjonnada82/wffawebapp/dev/src/assets/football.png']
              })
              .then(message => console.log(message.sid));
            } catch(error){
              console.error('Twilio error:', error.message);
              console.error('Twilio moreInfo:', error.moreInfo)
            }
            });
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

const getUnsignedUpTeam = async () => {
  try{
      const snapShot = await db.collection('users').where('teamSignup', '==', false)
                                                  .where('rulesEngineActive', '==', true).get();
      if(snapShot.size > 0){
            return snapShot.docs.map(document => {
              client.messages
              .create({
                body: 'Remainder to signup your team!',
                from: process.env.PHONE_NUMBER,
                to: processPhoneNumber(document.data().phone)
              })
              .then(message => console.log(message.sid));
            });
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

const processPhoneNumber = (phone) => {
  const hasNoSpecialCharacters = /[+()]/.test(phone);
  if (phone.length === 10 && !hasNoSpecialCharacters) {
    return `+1`+phone
  }
  else if (phone.slice(0,2) === '+1' && phone.length > 10) {
    return phone 
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
    getUnpaidTeam,
    getUnsignedUpTeam,
    getPaidTeam,
    getPendingTeamSignUp
  }

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// https://firebase.google.com/docs/functions/auth-events
exports.initUser = functions.auth.user().onCreate(async (user) => {

let docRef = db.collection('users').doc(user.uid);

  await docRef.set({
    created: admin.firestore.Timestamp.now(),
    name: user.displayName,
    active: true,
    uid: user.uid,
    role: 'user',
    teamSignup: false,
    payment: false,
    approve: false
  });

});

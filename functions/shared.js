const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

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

const setTeamApproval = async (userId) => {
  try {
      let docId = ``
      let docRef = db.collection('users').doc(userId);
      await docRef.update({
        approve: true
      });
      let snapShot = db.collection('teamRoster').where('uid', '==', userId).get()
      .then((querySnapshot) => {
        querySnapshot.forEach(async(doc) =>  {
            // doc.data() is never undefined for query doc snapshots
            docId = doc.id
              await db.collection("teamRoster").doc(docId).update({approve: true})
              return true
        });
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
    setName
  }

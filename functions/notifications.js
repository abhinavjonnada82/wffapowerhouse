const functions = require('firebase-functions');
const { getResponseJSON, setHeaders, validateIDToken } = require('./shared');

const notifications = functions.https.onRequest(async (req, res) => {
    setHeaders(res);

    if(req.method === 'OPTIONS') return res.status(200).json({code: 200});

    const query = req.query;
    if(!query.api) return res.status(400).json(getResponseJSON('Bad request!', 400));
    const api = query.api;

    if(api === 'signUpRemainder') {
        if(req.method !== 'GET') {
            return res.status(405).json(getResponseJSON('Only GET requests are accepted!', 405));
        }
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) {
           return res.status(401).send('You are not authorized to perform this action');
         }
        const decodedToken = await validateIDToken(idToken);
        if(decodedToken) {
            const { getPendingTeamSignUp } = require('./shared');
            const result = await getPendingTeamSignUp(decodedToken.uid);
            if(result instanceof Error){
                return res.status(500).json(getResponseJSON(result.message, 500));
            }
            return res.status(200).json({code: 200})
        }
        else{
            return res.status(400).json(getResponseJSON('Bad request!', 400));
        }
    }

    if(api === 'approveTeamsRemainder') {
        if(req.method !== 'GET') {
            return res.status(405).json(getResponseJSON('Only GET requests are accepted!', 405));
        }
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) {
           return res.status(401).send('You are not authorized to perform this action');
         }
        const decodedToken = await validateIDToken(idToken);
        if(decodedToken) {
            const { approveTeamsRemainder } = require('./shared');
            const result = await approveTeamsRemainder(decodedToken.uid);
            if(result instanceof Error){
                return res.status(500).json(getResponseJSON(result.message, 500));
            }
            return res.status(200).json({code: 200})
        }
        else{
            return res.status(400).json(getResponseJSON('Bad request!', 400));
        }
    }

    if(api === 'paymentRemainder') {
        if(req.method !== 'GET') {
            return res.status(405).json(getResponseJSON('Only GET requests are accepted!', 405));
        }
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) {
           return res.status(401).send('You are not authorized to perform this action');
         }
        const decodedToken = await validateIDToken(idToken);
        if(decodedToken) {
            const { getUnpaidTeam } = require('./shared');
            const result = await getUnpaidTeam(decodedToken.uid);
            if(result instanceof Error){
                return res.status(500).json(getResponseJSON(result.message, 500));
            }
            return res.status(200).json({code: 200})
        }
        else{
            return res.status(400).json(getResponseJSON('Bad request!', 400));
        }
    }

    else if(api === 'paymentSuccess') {
        if(req.method !== 'GET') {
            return res.status(405).json(getResponseJSON('Only GET requests are accepted!', 405));
        }
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) {
           return res.status(401).send('You are not authorized to perform this action');
         }
        const decodedToken = await validateIDToken(idToken);
        if(decodedToken) {
            const { getPaidTeam } = require('./shared');
            const result = await getPaidTeam(decodedToken.uid);
            if(result instanceof Error){
                return res.status(500).json(getResponseJSON(result.message, 500));
            }
            return res.status(200).json({code: 200})
        }
        else{
            return res.status(400).json(getResponseJSON('Bad request!', 400));
        }
    }


    // else if(api === 'signupRemainder') {
    //     if(req.method !== 'GET') {
    //         return res.status(405).json(getResponseJSON('Only GET requests are accepted!', 405));
    //     }
    //     const idToken = req.headers.authorization?.split('Bearer ')[1];
    //     if (!idToken) {
    //        return res.status(401).send('You are not authorized to perform this action');
    //      }
    //     const decodedToken = await validateIDToken(idToken);
    //     if(decodedToken) {
    //         const { getUnsignedUpTeam } = require('./shared');
    //         const result = await getUnsignedUpTeam(decodedToken.uid);
    //         if(result instanceof Error){
    //             return res.status(500).json(getResponseJSON(result.message, 500));
    //         }
    //         return res.status(200).json({code: 200})
    //     }
    //     else{
    //         return res.status(400).json(getResponseJSON('Bad request!', 400));
    //     }
    // }

});

module.exports = {
  notifications
}

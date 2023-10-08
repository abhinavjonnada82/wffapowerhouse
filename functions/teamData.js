const functions = require('firebase-functions');
const { getResponseJSON, setHeaders, validateIDToken } = require('./shared');

const teamData = functions.https.onRequest(async (req, res) => {
    setHeaders(res);

    if(req.method === 'OPTIONS') return res.status(200).json({code: 200});

    const query = req.query;
    if(!query.api) return res.status(400).json(getResponseJSON('Bad request!', 400));
    const api = query.api;

    if(api === 'getData') {
        if(req.method !== 'GET') {
            return res.status(405).json(getResponseJSON('Only GET requests are accepted!', 405));
        }
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) {
           return res.status(401).send('You are not authorized to perform this action');
         }
        const decodedToken = await validateIDToken(idToken);
        if(req.query.type === 'team') {
            const queries = req.query;
            const { grabTeamData } = require('./shared');
            const result = await grabTeamData(decodedToken.uid);
            if(result instanceof Error){
                return res.status(500).json(getResponseJSON(result.message, 500));
            }
            return res.status(200).json({data: result, code: 200})
        }
        if(req.query.type === 'adminVerifyTeam') {
            const queries = req.query;
            const { grabTeamData } = require('./shared');
            const result = await grabTeamData(req.query.param);
            if(result instanceof Error){
                return res.status(500).json(getResponseJSON(result.message, 500));
            }
            return res.status(200).json({data: result, code: 200})
        }
        if(req.query.type === 'allTeams') {
            const PIN = req.query.PIN;
            const { grabAllTeamData } = require('./shared');
            const result = await grabAllTeamData(PIN);
            if(result instanceof Error){
                return res.status(500).json(getResponseJSON(result.message, 500));
            }
            return res.status(200).json({data: result, code: 200})
        }
        if(req.query.type === 'allUsers') {
            const queries = req.query;
            const { grabAllUserData } = require('./shared');
            const result = await grabAllUserData();
            if(result instanceof Error){
                return res.status(500).json(getResponseJSON(result.message, 500));
            }
            return res.status(200).json({data: result, code: 200})
        }
        else{
            return res.status(400).json(getResponseJSON('Bad request!', 400));
        }
      }

      else if(api == 'addData'){
         if(req.method !== 'POST') {
             return res.status(405).json(getResponseJSON('Only POST requests are accepted!', 405));
         }
         const idToken = req.headers.authorization?.split('Bearer ')[1];
         if (!idToken) {
            return res.status(401).send('You are not authorized to perform this action');
          }
         const decodedToken = await validateIDToken(idToken);
         const requestData = req.body;
         if(Object.keys(requestData).length === 0 ) return res.status(400).json(getResponseJSON('Request body is empty!', 400));
         requestData.timeStamp = new Date().toISOString();
         requestData.uid = decodedToken.uid
         requestData.approve = false
         const { addTeamData } = require('./shared');
         const response = await addTeamData(requestData, decodedToken.uid);
         if(!response) return res.status(404).json(getResponseJSON('ERROR!', 404));
         return res.status(200).json({message: `Success!`, code:200})

      }

      else if(api === 'getUserData') {
          if(req.method !== 'GET') {
              return res.status(405).json(getResponseJSON('Only GET requests are accepted!', 405));
          }
          const idToken = req.headers.authorization?.split('Bearer ')[1];
          if (!idToken) {
             return res.status(401).send('You are not authorized to perform this action');
           }
          const decodedToken = await validateIDToken(idToken);
          if(req.query.type === 'user') {
              const { grabUserData } = require('./shared');
              const result = await grabUserData(decodedToken.uid);
              if(result instanceof Error){
                  return res.status(500).json(getResponseJSON(result.message, 500));
              }
              return res.status(200).json({data: result, code: 200})
          }
          else{
              return res.status(400).json(getResponseJSON('Bad request!', 400));
          }
        }

        else if(api == 'updateUserProfile'){
            if(req.query.type === 'addName') {
                if(req.method !== 'POST') {
                    return res.status(405).json(getResponseJSON('Only POST requests are accepted!', 405));
                }
                const idToken = req.headers.authorization?.split('Bearer ')[1];
                if (!idToken) {
                   return res.status(401).send('You are not authorized to perform this action');
                 }
                const decodedToken = await validateIDToken(idToken);
                const requestData = req.body;
                if(Object.keys(requestData).length === 0 ) return res.status(400).json(getResponseJSON('Request body is empty!', 400));
                const { setName } = require('./shared');

                const result = await setName(requestData, decodedToken.uid);
                if(result instanceof Error){
                    return res.status(500).json(getResponseJSON(result.message, 500));
                }
                return res.status(200).json({data: result, code: 200})
              }

              if(req.query.type === 'addRulesEngine') {
                if(req.method !== 'POST') {
                    return res.status(405).json(getResponseJSON('Only POST requests are accepted!', 405));
                }
                const idToken = req.headers.authorization?.split('Bearer ')[1];
                if (!idToken) {
                   return res.status(401).send('You are not authorized to perform this action');
                 }

                const decodedToken = await validateIDToken(idToken);
                const requestData = req.body;
                if(Object.keys(requestData).length === 0 ) return res.status(400).json(getResponseJSON('Request body is empty!', 400));
                const { integrateRulesEngine } = require('./shared');
                const result = await integrateRulesEngine(requestData, decodedToken.uid);
                if(result === `incorrectPin`){
                    return res.status(401).json(getResponseJSON('Incorrect PIN, try again!', 401));
                }
                if(result instanceof Error){
                    return res.status(500).json(getResponseJSON(result.message, 500));
                }
                return res.status(200).json({data: result, code: 200})
              }
            }

        else if(api == 'approveTeam'){
           if(req.method !== 'POST') {
               return res.status(405).json(getResponseJSON('Only POST requests are accepted!', 405));
           }
           const idToken = req.headers.authorization?.split('Bearer ')[1];
           if (!idToken) {
              return res.status(401).send('You are not authorized to perform this action');
            }
           const decodedToken = await validateIDToken(idToken);
           const requestData = req.body;
           if(Object.keys(requestData).length === 0 ) return res.status(400).json(getResponseJSON('Request body is empty!', 400));
           const { setTeamApproval } = require('./shared');
           if (decodedToken) {
            const response = await setTeamApproval(requestData.userId, requestData.phone);
            if(!response) return res.status(404).json(getResponseJSON('ERROR!', 404));
            return res.status(200).json({message: `Success!`, code:200})
          }
        }

        else if(api == 'adminRulesEngine'){
            if(req.method !== 'POST') {
                return res.status(405).json(getResponseJSON('Only POST requests are accepted!', 405));
            }
            const idToken = req.headers.authorization?.split('Bearer ')[1];
            if (!idToken) {
               return res.status(401).send('You are not authorized to perform this action');
             }
            const decodedToken = await validateIDToken(idToken);
            const requestData = req.body;
            if(Object.keys(requestData).length === 0 ) return res.status(400).json(getResponseJSON('Request body is empty!', 400));
            const { storeAdminRules } = require('./shared');
            if (decodedToken) {
                requestData.rules["elminationFormat"] = "Single Elmination"
                requestData.rules["tournamentFormat"] = "5 Man No Contact"
                const response = await storeAdminRules(requestData);
                if(!response) return res.status(404).json(getResponseJSON('ERROR!', 404));
                return res.status(200).json({message: `Success!`, code:200})
           }
        }

        else if(api === 'getRules') {
            if(req.method !== 'GET') {
                return res.status(405).json(getResponseJSON('Only GET requests are accepted!', 405));
            }
            const idToken = req.headers.authorization?.split('Bearer ')[1];
            if (!idToken) {
               return res.status(401).send('You are not authorized to perform this action');
             }
            const decodedToken = await validateIDToken(idToken);
            if(req.query.type === 'admin') {
                const { grabAdminRules } = require('./shared');
                const result = await grabAdminRules(decodedToken.uid);
                if(result instanceof Error){
                    return res.status(500).json(getResponseJSON(result.message, 500));
                }
                return res.status(200).json({data: result, code: 200})
            }
            else{
                return res.status(400).json(getResponseJSON('Bad request!', 400));
            }
          }
});

module.exports = {
  teamData
}

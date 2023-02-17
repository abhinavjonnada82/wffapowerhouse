const functions = require("firebase-functions");


const initUser = require('./initUser');
const teamData = require('./teamData');

exports.initUser = initUser.initUser
exports.teamData = teamData.teamData

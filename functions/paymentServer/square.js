const { ApiError, Client, Environment } = require('square');

const client = new Client({
  environment: Environment.Sandbox,
  accessToken:  process.env.SQUARE_ACCESS_TOKEN
});

module.exports = { ApiError, client };

const {Client} = require('graphql-ld/index');
const getEngine = require('./engine-factory');
const getCountryName = require('country-list').getName;
const fs = require('fs-extra');
const path = require('path');

module.exports = async () => {
  const context = await fs.readJson(path.join(__dirname, 'context.json'));
  const queryEngine = getEngine();
  const client = new Client({context, queryEngine});

  let countries = [];

  // Get all.html events that have at least one battle and have a location.
  let query = `
  query { 
    location @single
    hasBattle @single
  }`;

  const events = (await client.query({query})).data;

  events.forEach(event => {
    if (event.location !== '' && countries.indexOf(event.location) === -1) {
      countries.push(event.location);
    }
  });

  // Get all winners that have at least one win and have a location
  query = `
  query { 
    country @single
    wins 
  }`;

  const winners = (await client.query({query})).data;

  winners.forEach(winner => {
    if (winner.country !== '' && countries.indexOf(winner.country) === -1) {
      countries.push(winner.country);
    }
  });

  countries.sort();

  return countries.map(country => {
    return {
      code: country,
      name: getCountryName(country)
    }
  });
};
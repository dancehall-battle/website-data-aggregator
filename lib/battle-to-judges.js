const {Client} = require('graphql-ld/index');
const getEngine = require('./engine-factory');
const getCountryName = require('country-list').getName;
const fs = require('fs-extra');
const path = require('path');

module.exports = async () => {
  const context = await fs.readJson(path.join(__dirname, 'context.json'));
  const queryEngine = getEngine();
  const client = new Client({context, queryEngine});

  // Get all events that have at least one battle and have a location.
  let query = `
  query { 
    id @single
    hasJudge {
      type # useful for the embedded JSON-LD 
      id @single
      name @single
      country @single
    }
  }`;

  const data = (await client.query({query})).data;
  const map = {};

  data.forEach(element => {
    map[element.id] = element.hasJudge;
  });

  return map;
};

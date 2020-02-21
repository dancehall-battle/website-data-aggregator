const {Client} = require('graphql-ld/index');
const getEngine = require('./engine-factory');
const recursiveJSONKeyTransform = require('recursive-json-key-transform');
const {parseDates, getOrganizerInstagram, useLocalhostInIdsDuringServe} = require('./utils');
const fs = require('fs-extra');
const path = require('path');

let client;

module.exports = async () => {
  const context = await fs.readJson(path.join(__dirname, 'context.json'));

  const originalQueryResults = {
    '@context': JSON.parse(JSON.stringify(context['@context']))
  };

  const queryEngine = getEngine();
  client = new Client({ context, queryEngine });

  const query = `
  query { 
    type # useful for the embedded JSON-LD 
    id @single
    name @single
    location @single
    start @single
    end @single
    instagram @single
  }`;

  let result = (await client.query({ query })).data;
  useLocalhostInIdsDuringServe(result);

  originalQueryResults['@graph'] = recursiveJSONKeyTransform(key => {
    if (key === 'id' || key === 'type') {
      key = '@' + key;
    }

    return key;
  })(JSON.parse(JSON.stringify(result)));

  let today = new Date();
  today = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);

  result = result.filter(event => today <= new Date(event.end));

  for (let i = 0; i < result.length; i ++) {
    const event = result[i];

    if (event.instagram === '') {
      event.instagram = await getOrganizerInstagram(event.id);
    } else {
      event.instagram = [event.instagram];
    }
  }

  result = result.sort((a, b) => {
    const aDate = new Date(a.start);
    const bDate = new Date(b.start);

    if (aDate < bDate) {
      return -1;
    } else if (aDate > bDate) {
      return 1;
    } else {
      return 0;
    }
  });

  result.forEach(event => {
    parseDates(event);
  });

  return {data: result, originalQueryResults};
};
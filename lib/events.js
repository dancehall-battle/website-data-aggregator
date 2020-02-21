const {Client} = require('graphql-ld/index');
const getCountryName = require('country-list').getName;
const recursiveJSONKeyTransform = require('recursive-json-key-transform');
const {parseDates, createNameForBattle, getOrganizerInstagram, useLocalhostInIdsDuringServe} = require('./utils');
const fs = require('fs-extra');
const path = require('path');
const getEngine = require('./engine-factory');

module.exports = async () => {
  const context = await fs.readJson(path.join(__dirname, 'context.json'));
  const originalContext = JSON.parse(JSON.stringify(context['@context']));
  const queryEngine = getEngine();
  const client = new Client({context, queryEngine});
  const query = `
  query { 
    type # useful for the embedded JSON-LD 
    id @single
    name @single
    location @single
    start @single
    end @single
    instagram @single
    hasBattle {
      id @single
      name @single
      level @single
      gender @single
      age @single
      start @single 
      end @single
      participants @single
      inviteOnly @single
      hasWinner {
        type # useful for the embedded JSON-LD 
        id @single
        name @single
        country @single
      }
    }
  }`;

  let events = (await client.query({query})).data;
  useLocalhostInIdsDuringServe(events);

  for (let i = 0; i < events.length; i++) {
    const event = events[i];

    event.originalQueryResults = recursiveJSONKeyTransform(key => {
      if (key === 'id' || key === 'type') {
        key = '@' + key;
      }

      return key;
    })(JSON.parse(JSON.stringify(event)));
    event.originalQueryResults['@context'] = originalContext;

    const indexOfLastSlash = event.id.lastIndexOf('/');
    event.slug = event.id.substr(indexOfLastSlash + 1);
    parseDates(event);
    event.location = {
      code: event.location,
      name: getCountryName(event.location)
    };

    event.hasBattle.forEach(battle => {
      battle.name = createNameForBattle(battle);
      parseDates(battle);
    });

    event.organizers = await getOrganizerInstagram(event.id);
  }

  // TODO parse battles (name, dates...)

  return events;
};
const {Client} = require('graphql-ld/index');
const getEngine = require('./engine-factory');
const {format} = require('date-fns');
const recursiveJSONKeyTransform = require('recursive-json-key-transform');
const {createNameForBattle} = require('./utils');
const fs = require('fs-extra');
const path = require('path');

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
    country @single
    instagram @single
    wins {
      id @single
      type # useful for the embedded JSON-LD 
      name @single
      level @single
      gender @single
      age @single
      start @single 
      end @single
      participants @single
      inviteOnly @single
      atEvent @single {
        type # useful for the embedded JSON-LD 
        id @single
        name @single
        location @single
      }
    }
  }`;

  let dancers = (await client.query({query})).data;

  dancers.forEach(dancer => {
    dancer.originalQueryResults = {
      '@context': originalContext,
      '@graph': recursiveJSONKeyTransform(key => {
        if (key === 'id' || key === 'type') {
          key = '@' + key;
        }

        return key;
      })(JSON.parse(JSON.stringify(dancer)))
    };
  });

  dancers.forEach(dancer => {
    getPostfix(dancer);

    dancer.wins.forEach(battle => {
      battle.date = format(new Date(battle.start), 'MMM d, yyyy', {awareOfUnicodeTokens: true});
      battle.name = createNameForBattle(battle);
    });

    dancer.wins.sort((a, b) => {
      const aDate = new Date(a.start);
      const bDate = new Date(b.start);

      if (aDate < bDate) {
        return 1;
      } else if (aDate > bDate) {
        return -1;
      } else {
        return 0;
      }
    });
  });

  return dancers;
};

function getPostfix(dancer) {
  const indexOfLastSlash = dancer.id.lastIndexOf('/');
  dancer.postfix = dancer.id.substr(indexOfLastSlash + 1);
}
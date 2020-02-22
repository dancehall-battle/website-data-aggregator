const {Client} = require('graphql-ld/index');
const getEngine = require('./engine-factory');
const recursiveJSONKeyTransform = require('recursive-json-key-transform');
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
    wins {
      id @single
    }
  }`;

  let dancers = (await client.query({query})).data;

  const originalQueryResults = {
    '@context': originalContext,
    '@graph': recursiveJSONKeyTransform(key => {
      if (key === 'id' || key === 'type') {
        key = '@' + key;
      }

      return key;
    })(JSON.parse(JSON.stringify(dancers)))
  };

  const perLetter = {};

  dancers.forEach(dancer => {
    getPostfix(dancer);

    const firstLetter = dancer.name[0];

    if (!perLetter[firstLetter]) {
      perLetter[firstLetter] = [];
    }

    perLetter[firstLetter].push(dancer);
  });

  const letters = Object.keys(perLetter).sort();

  letters.forEach(letter => {
    perLetter[letter].sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      } else if (a.name > b.name) {
        return 1;
      } else {
        return 0;
      }
    });
  });

  return {originalQueryResults, perLetter, letters};
};

function getPostfix(dancer) {
  dancer.postfix = dancer.id.replace('https://dancehallbattle.org/dancer/', '');
}
const {Client} = require('graphql-ld/index');
const getEngine = require('./engine-factory');
const {format} = require('date-fns');
const recursiveJSONKeyTransform = require('recursive-json-key-transform');
const {createNameForBattle} = require('./utils');
const fs = require('fs-extra');
const path = require('path');

module.exports = async (rankings, options = {printPerObject: false}) => {
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

  if (options.printPerObject) {

    console.log('[');
    while (dancers.length > 0) {
      const dancer = dancers.shift();

      _updateDancer(dancer, rankings, originalContext);

      console.log(JSON.stringify(dancer));

      if (dancers.length > 0) {
        console.log(',');
      }
    }
    console.log(']');
  } else {
    dancers.forEach(dancer => {
      _updateDancer(dancer, rankings);
    });

    return dancers;
  }

  return dancers;
};

function getPostfix(dancer) {
  const indexOfLastSlash = dancer.id.lastIndexOf('/');
  dancer.postfix = dancer.id.substr(indexOfLastSlash + 1);
}

function getRankForDancer(rankingMap, id) {
  const positions = Object.keys(rankingMap);
  let j = 0;
  let rank = null;

  while (j < positions.length && !rank) {
    const position = positions[j];
    const items = rankingMap[position];

    let i = 0;

    while (i < items.length && items[i].dancer.id !== id) {
      i ++;
    }

    if (i < items.length) {
      rank = items[i];
    }

    j ++;
  }

  if (rank) {
    return {
      points: rank.points,
      position: rank.position
    };
  } else {
    return null;
  }
}

function _updateDancer(dancer, rankings, originalContext){
  dancer.originalQueryResults = {
    '@context': originalContext,
    '@graph': recursiveJSONKeyTransform(key => {
      if (key === 'id' || key === 'type') {
        key = '@' + key;
      }

      return key;
    })(JSON.parse(JSON.stringify(dancer)))
  };

  getPostfix(dancer);
  dancer.ranks = {
    dancerCombined: null,
    dancer2vs2: null,
    dancer1vs1: null
  }

  if (rankings.dancerCombined) {
    dancer.ranks.dancerCombined = getRankForDancer(rankings.dancerCombined.map, dancer.id);
  }

  if (rankings.dancer2vs2) {
    dancer.ranks.dancer2vs2 = getRankForDancer(rankings.dancer2vs2.map, dancer.id);
  }

  if (rankings.dancer1vs1) {
    dancer.ranks.dancer1vs1 = getRankForDancer(rankings.dancer1vs1.map, dancer.id);
  }

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
}
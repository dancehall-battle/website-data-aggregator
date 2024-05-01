const {Client} = require('graphql-ld/index');
const getEngine = require('./engine-factory');
const {format} = require('date-fns');
const recursiveJSONKeyTransform = require('recursive-json-key-transform');
const {createNameForBattle, useLocalhostInIdsDuringServe, setPostfix} = require('./utils');
const fs = require('fs-extra');
const path = require('path');

const yearBattleMap = {};
const winnerCountryBattleMap = {};
const recentBattles = [];
const eventIDsOfRecentBattles = [];

async function main() {
  const queryEngine = getEngine();
  const context = await fs.readJson(path.join(__dirname, 'context.json'));
  const originalQueryResults = {
    '@context': JSON.parse(JSON.stringify(context['@context']))
  };

  const client = new Client({context, queryEngine});

  // Define a query
  const query = `
  query { 
      type # useful for the embedded JSON-LD 
      id @single
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
      hasWinner {
        type # useful for the embedded JSON-LD 
        id @single
        name @single
        country @single
      }
  }`;

  // Execute the query
  let result = (await client.query({query})).data;
  originalQueryResults['@graph'] = recursiveJSONKeyTransform(key => {
    if (key === 'id' || key === 'type') {
      key = '@' + key;
    }

    return key;
  })(JSON.parse(JSON.stringify(result)));

  //console.log(result);
  //console.dir(result, { depth: null });

  useLocalhostInIdsDuringServe(result);

  result = result.sort((a, b) => {
    const aDate = new Date(a.start);
    const bDate = new Date(b.start);

    if (aDate < bDate) {
      return 1;
    } else if (aDate > bDate) {
      return -1;
    } else {
      if (a.atEvent.id < b.atEvent.id) {
        return -1;
      } else if (a.atEvent.id > b.atEvent.id) {
        return 1;
      } else {
        return 0;
      }
    }
  });

  result.forEach(battle => {
    battle.name = createNameForBattle(battle);
    parseDates(battle);
    parseCountry(battle);
    setPostfix(battle);
    setPostfix(battle.atEvent);
    battle.hasWinner.forEach(winner => {
      setPostfix(winner);
    })
  });

  addToRecentBattles(result);

  const recent = {
    perYear: {}
  };

  recentBattles.forEach(battle => {
    if (!recent.perYear[battle.year]) {
      recent.perYear[battle.year] = [];
    }

    recent.perYear[battle.year].push(battle);
  });

  recent.years = Object.keys(recent.perYear);

  return {perYear: yearBattleMap, recent, originalQueryResults};
}

function parseDates(battle) {
  const date = new Date(battle.start);

  battle.date = format(date, 'MMM d', {awareOfUnicodeTokens: true});
  battle.fullDate = format(date, 'MMM d, yyyy', {awareOfUnicodeTokens: true});
  battle.year = (date.getFullYear());

  if (!yearBattleMap[battle.year]) {
    yearBattleMap[battle.year] = [];
  }

  yearBattleMap[battle.year].push(battle);
}

function parseCountry(battle) {
  // This is an array.
  const winnerCountries = battle.hasWinner.map(winner => winner.country);
  const duplicateCountries = [];

  winnerCountries.forEach(country => {
    if (country !== '' && duplicateCountries.indexOf(country) === -1) {
      // To make sure that 2 vs 2 winners from the same country don't add that battle twice to that one country.
      duplicateCountries.push(country);

      if (!winnerCountryBattleMap[country]) {
        winnerCountryBattleMap[country] = {};
      }

      if (!winnerCountryBattleMap[country][battle.year]) {
        winnerCountryBattleMap[country][battle.year] = [];
      }

      winnerCountryBattleMap[country][battle.year].push(battle);
    }
  });
}

function addToRecentBattles(battles) {
  battles.forEach(battle => {
    if (eventIDsOfRecentBattles.indexOf(battle.atEvent.id) !== -1 || eventIDsOfRecentBattles.length <= 20) {
      if (eventIDsOfRecentBattles.indexOf(battle.atEvent.id) === -1) {
        eventIDsOfRecentBattles.push(battle.atEvent.id);
      }

      recentBattles.push(battle);
    }
  });
}

module.exports = main;

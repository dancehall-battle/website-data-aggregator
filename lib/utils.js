const fs = require('fs-extra');
const path = require('path');
const {format, compareAsc} = require('date-fns');
const {Client} = require('graphql-ld/index');
const getEngine = require('./engine-factory');

const queryEngine = getEngine();

function createNameForBattle(battle) {
  let label = battle.name;

  if (!label || label === '(null)') {
    label = `${battle.participants} vs ${battle.participants}`;

    if (battle.level && battle.level !== 'all') {
      label += ` ${capitalize(battle.level)}`;
    }

    if (battle.age && battle.age !== 'all') {
      label += ` ${capitalize(battle.age)}`;
    }

    if (battle.gender && battle.gender !== 'all') {
      label += ` ${capitalize(battle.gender)}`;
    }
  }

  return label;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

async function useCache(main, cacheFilename) {
  const skip = process.env.SKIP !== undefined && process.env.SKIP.toLowerCase().split(',').indexOf(cacheFilename.toLowerCase()) !== -1;

  if (skip) {
    console.log(`Skipping ${cacheFilename}`);
    return {};
  } else {
    const isServing = process.env.ELEVENTY_SERVE === 'true';

    const cacheFilePath = path.resolve(__dirname, '../_cache/' + cacheFilename);
    let dataInCache = null;

    if (isServing && await fs.pathExists(cacheFilePath)) {
      // Read file from cache.
      dataInCache = await fs.readJSON(cacheFilePath);
      console.log('Using from cache: ' + cacheFilename);
    }

    if (!dataInCache) {
      const result = await main();

      if (isServing) {
        // Write data to cache.
        fs.writeJSON(cacheFilePath, result, err => {
          if (err) {
            console.error(err)
          }
        });
      }

      dataInCache = result;
    }

    return dataInCache;
  }
}

function parseDates(event) {
  if (event.start !== '' && event.end !== '') {
    event.originalStart = event.start;
    event.originalEnd = event.end;

    const startDate = new Date(event.start);
    const endDate = new Date(event.end);

    if (compareAsc(startDate, endDate) === 0) {
      event.formattedDate = format(startDate, 'MMM d, yyyy', {awareOfUnicodeTokens: true});
    } else {
      let start;
      //console.log(endDate);
      const end = format(endDate, 'MMM d, yyyy', {awareOfUnicodeTokens: true});

      if (startDate.getFullYear() === endDate.getFullYear()) {
        start = format(startDate, 'MMM d', {awareOfUnicodeTokens: true});
      } else {
        start = format(startDate, 'MMM d, yyyy', {awareOfUnicodeTokens: true});
      }

      event.formattedDate = `${start} - ${end}`;
    }

    event.start = format(new Date(event.start), 'MMM d', {awareOfUnicodeTokens: true});
    event.end = format(new Date(event.end), 'MMM d', {awareOfUnicodeTokens: true});
  }
}

function sortOnStartDate(events) {
  return events.sort((a, b) => {
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

async function getOrganizerInstagram(eventID) {
  const query = `
  query { 
    id(_:EVENT)
    organizer {
      instagram @single
    }
  }`;

  const context = {
    "@context": {
      "instagram": { "@id": "https://dancehallbattle.org/ontology/instagram" },
      "organizer": { "@id": "http://schema.org/organizer" },
      "EVENT": eventID,
    }
  };

  const client = new Client({ context, queryEngine });
  const {data} = await client.query({ query });

  if (data.length > 0) {
    return data[0].organizer.map(organizer => organizer.instagram);
  } else {
    return [];
  }
}

function useLocalhostInIdsDuringServe(data) {
  const isServing = process.env.ELEVENTY_SERVE;

  if (isServing) {
    data.forEach(d => {
      const keys = Object.keys(d);

      keys.forEach(key => {
        if (key === 'id') {
          d[key] = d[key].replace('https://dancehallbattle.org/', 'http://localhost:' + process.env.ELEVENTY_PORT + '/');
        } else if (Array.isArray(d[key])) {
          useLocalhostInIdsDuringServe(d[key]);
        } else if (typeof d[key] === 'object') {
          useLocalhostInIdsDuringServe([d[key]]);
        }
      });
    });
  }
}

function setPostfix(el) {
  const indexOfLastSlash = el.id.lastIndexOf('/');
  el.postfix = el.id.substring(indexOfLastSlash + 1);
}

module.exports = {
  createNameForBattle,
  useCache,
  parseDates,
  getOrganizerInstagram,
  sortOnStartDate,
  useLocalhostInIdsDuringServe,
  setPostfix
};

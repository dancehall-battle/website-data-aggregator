#!/usr/bin/env node

const program = require('commander');
const {getBattles, getUpcoming, getCountries, getCountryToBattles,
  getCountryToEvents, getCountryToJSONLD, getEvents, getDancerList,
  getDancers, getRankings} = require('../index');
const path = require('path');
const fs = require('fs-extra');

main();

async function main() {
  program
    .requiredOption('-d, --data <data>', 'Data to aggregate', validateDataOption)
    .option('-o, --output <path>', 'File to write output to' , makeAbsolute)
    .option('-c, --cache <path>', 'Folder where cached files are stored' , makeAbsolute)
    .option('-v, --verbose', 'Show debug info');

  program.parse(process.argv);

  let result;

  if (program.data === 'battles') {
    result = await getBattles();
  } else if (program.data === 'upcoming') {
    result = await getUpcoming();
  } else if (program.data === 'events') {
    result = await getEvents();
  } else if (program.data === 'countries') {
    result = await getCountries();
  } else if (program.data === 'country-to-battles') {
    let battles = null;

    if (program.cache) {
      battles = await getCachedFile(program.cache, 'battles.json', program.verbose);
    }

    if (!battles) {
      battles = await getBattles();
    }

    result = await getCountryToBattles(battles.perYear);
  } else if (program.data === 'country-to-events') {
    let events = null;

    if (program.cache) {
      events = await getCachedFile(program.cache, 'events.json', program.verbose);
    }

    if (!events) {
      events = await getEvents();
    }

    result = await getCountryToEvents(events);
  } else if (program.data === 'country-to-upcoming') {
    let upcomingEvents = null;

    if (program.cache) {
      upcomingEvents = await getCachedFile(program.cache, 'upcoming.json', program.verbose);
    }

    if (!upcomingEvents) {
      upcomingEvents = await getUpcoming();
    }

    upcomingEvents = upcomingEvents.data;

    upcomingEvents.forEach(event => {
      event.location = {
        code: event.location
      }
    });

    result = await getCountryToEvents(upcomingEvents, true);
  } else if (program.data === 'country-to-jsonld') {
    let battles = null;

    if (program.cache) {
      battles = await getCachedFile(program.cache, 'battles.json', program.verbose);
    }

    if (!battles) {
      battles = await getBattles();
    }

    const {originalQueryResults, perYear} = battles;

    let events = null;

    if (program.cache) {
      events = await getCachedFile(program.cache, 'events.json', program.verbose);
    }

    if (!events) {
      events = await getEvents();
    }

    let countryToBattles = null;

    if (program.cache) {
      countryToBattles = await getCachedFile(program.cache, 'countryToBattles.json', program.verbose);
    }

    if (!countryToBattles) {
      countryToBattles = await getCountryToBattles(perYear);
    }

    let countryToEvents = null;

    if (program.cache) {
      countryToEvents = await getCachedFile(program.cache, 'countryToEvents.json', program.verbose);
    }

    if (!countryToBattles) {
      countryToEvents = await getCountryToEvents(events);
    }

    result = await getCountryToJSONLD(originalQueryResults, countryToBattles, countryToEvents);
  } else if (program.data === 'dancer-list') {
    result = await getDancerList();
  } else if (program.data === 'dancers') {
    result = await getDancers();
  } else if (program.data === 'rankings') {
    result = await getRankings();
  }

  if (program.output) {
    if (program.verbose) {
      console.error(`Writing data to ${program.output}...`);
    }

    fs.writeJson(program.output, result);
  } else {
    console.log(result);
  }

  if (program.verbose) {
    const used = process.memoryUsage().heapUsed / 1024 / 1024;
    console.error(`Approximately ${Math.round(used * 100) / 100} MB memory was used.`);
  }
}

function validateDataOption(data) {
  const validData = ['battles', 'events', 'upcoming',
    'countries', 'country-to-battles', 'country-to-events',
    'country-to-jsonld', 'dancer-list', 'dancers',
    'rankings', 'country-to-upcoming'];
  data = data.trim();

  if (validData.includes(data)) {
    return data;
  } else {
    console.error(`Unknown value "${data}" for -d, --data.`);
    process.exit(1);
  }
}

function makeAbsolute(filePath) {
  if(! path.isAbsolute(filePath)) {
    filePath = path.join(process.cwd(), filePath);
  }

  return filePath;
}

async function getCachedFile(dir, fileName, verbose) {
  const filePath = path.join(dir, fileName);

  if (verbose) {
    console.error(`Looking for ${fileName} in cache folder...`);
  }

  const exists = await fs.pathExists(filePath);

  if (exists) {
    if (verbose) {
      console.error(`File ${fileName} found in cache folder.`);
    }

    return await fs.readJson(filePath);
  } else {
    if (verbose) {
      console.error(`File ${fileName} not found in cache folder.`);
    }

    return null;
  }
}
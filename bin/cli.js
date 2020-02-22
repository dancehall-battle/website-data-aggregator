#!/usr/bin/env node

const program = require('commander');
const {getBattles, getUpcoming, getCountries, getCountryToBattles,
  getCountryToEvents, getCountryToJSONLD, getEvents} = require('../index');
const path = require('path');
const fs = require('fs-extra');

main();

async function main() {
  program
    .requiredOption('-d, --data <data>', 'Data to aggregate', validateDataOption)
    .option('-o, --output <path>', 'File to write output to' , makeAbsolute)
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
    const {perYear} = await getBattles();
    result = await getCountryToBattles(perYear);
  } else if (program.data === 'country-to-events') {
    const events = await getEvents();
    result = await getCountryToEvents(events);
  } else if (program.data === 'country-to-jsonld') {
    const {originalQueryResults, perYear} = await getBattles();
    const countryToBattles = await getCountryToBattles(perYear);
    const events = await getEvents();
    const countryToEvents = await getCountryToEvents(events);

    result = await getCountryToJSONLD(originalQueryResults, countryToBattles, countryToEvents);
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
  const validData = ['battles', 'events', 'upcoming', 'countries', 'country-to-battles', 'country-to-events', 'country-to-jsonld'];
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
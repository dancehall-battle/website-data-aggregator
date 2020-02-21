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
    .option('-o, --output <path>', 'File to write output to' , makeAbsolute);

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
  }

  if (program.output) {
    fs.writeJson(program.output, result);
  } else {
    console.log(result);
  }
}

function validateDataOption(data) {
  const validData = ['battles', 'events', 'upcoming', 'countries', 'country-to-battles', 'country-to-events'];
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
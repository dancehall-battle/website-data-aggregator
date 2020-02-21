const getBattles = require('./lib/battles');
const getCountries = require('./lib/countries');
const getCountryToBattles = require('./lib/country-to-battles');
const getUpcoming = require('./lib/upcoming');
const getEvents = require('./lib/events');
const fs = require('fs-extra');
const path = require('path');

async function main() {
  const battles = await getBattles();
  fs.writeJson(path.join(__dirname, 'output/battles.json'), battles);
  const countryToBattles = await getCountryToBattles(battles.perYear);
  fs.writeJson(path.join(__dirname, 'output/country-to-battles.json'), countryToBattles);
  const data = await getEvents();
  fs.writeJson(path.join(__dirname, 'output/events.json'), data);
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`The script used approximately ${Math.round(used * 100) / 100} MB.`);
}

main();
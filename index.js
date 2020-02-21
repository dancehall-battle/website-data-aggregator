const getBattles = require('./lib/battles');
const getCountries = require('./lib/countries');
const getCountryToBattles = require('./lib/country-to-battles');
const fs = require('fs-extra');
const path = require('path');

async function main() {
  const battles = await getBattles();
  //fs.writeJson(path.join(__dirname, 'output/battles.json'), battles);
  const countryToBattles = await getCountryToBattles(battles.perYear);
  fs.writeJson(path.join(__dirname, 'output/country-to-battles.json'), countryToBattles);
}

main();
const getBattles = require('./lib/battles');
const fs = require('fs-extra');
const path = require('path');

async function main() {
  const battles = await getBattles();
  fs.writeJson(path.join(__dirname, 'output/battles.json'), battles);
}

main();
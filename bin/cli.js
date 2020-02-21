const program = require('commander');
const {getBattles} = require('../index');

main();

async function main() {
  program
    .requiredOption('-d, --data <data>', 'Data to aggregate')
    .option('-o, --output', 'File to write output to');

  program.parse(process.argv);

  if (program.data === 'battles') {
    const battles = await getBattles();
    console.log(battles);
  } else {
    console.error(`Unknown value "${program.data}" for -d, --data.`);
    process.exit(1);
  }
}
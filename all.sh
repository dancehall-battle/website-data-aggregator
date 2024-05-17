export NODE_OPTIONS=--max_old_space_size=4096
mkdir -p ../website-data/data

node bin/cli.js -d dancers -o ../website-data/data/dancers.json
sleep 15
node bin/cli.js -d events -o ../website-data/data/events.json
sleep 15
node bin/cli.js -d battles -o ../website-data/data/battles.json
sleep 15
node bin/cli.js -d upcoming -o ../website-data/data/upcoming.json
sleep 15
node bin/cli.js -d countries -o ../website-data/data/countries.json
sleep 15
node bin/cli.js -d country-to-battles -o ../website-data/data/countryToBattles.json -c ../website-data/data
sleep 15
node bin/cli.js -d country-to-events -o ../website-data/data/countryToEvents.json -c ../website-data/data
sleep 15
node bin/cli.js -d country-to-jsonld -o ../website-data/data/countryToJSONLD.json -c ../website-data/data
sleep 15
node bin/cli.js -d country-to-upcoming -o ../website-data/data/countryToUpcoming.json -c ../website-data/data
sleep 15
node bin/cli.js -d battle-to-judges -o ../website-data/data/battleToJudges.json -c ../website-data/data
sleep 15
node bin/cli.js -d dancer-list -o ../website-data/data/dancerList.json
sleep 15
node bin/cli.js -d rankings -o ../website-data/data/rankings.json
sleep 15
node bin/cli.js -d judge-list -o ../website-data/data/judgeList.json

module.exports = async (originalQueryResultsOfBattles, countryToBattles, countryToEvents) => {
  const countries = Object.keys(countryToBattles).concat(Object.keys(countryToEvents));
  const countryToJSONLD = {};

  countries.forEach(country => {
    const battleJSONLD = {
      '@context': originalQueryResultsOfBattles['@context'],
      '@graph': []
    };
    const battles = countryToBattles[country];

    if (battles) {
      battles.forEach(battle => {
        const allBattles = originalQueryResultsOfBattles['@graph'];
        let i = 0;

        while (i < allBattles.length &&
        allBattles[i]['@id'].substring(allBattles[i]['@id'].lastIndexOf('/') + 1) !==
        battle.id.substring(battle.id.lastIndexOf('/') + 1)) {
          i++;
        }

        if (i < originalQueryResultsOfBattles['@graph'].length) {
          battleJSONLD['@graph'].push(originalQueryResultsOfBattles['@graph'][i]);
        }
      });
    }

    countryToJSONLD[country] = [battleJSONLD];

    const events = countryToEvents[country];

    if (events) {
      events.forEach(event => {
        countryToJSONLD[country].push(event.originalQueryResults);
      });
    }
  });

  return countryToJSONLD;
};
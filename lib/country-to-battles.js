module.exports = async (perYear) => {
  const years = Object.keys(perYear);
  const countryToBattles = {};

  years.forEach(year => {
    const battles = perYear[year];

    battles.forEach(battle => {
      const locations = [];

      battle.hasWinner.forEach(winner => {
        if (winner.country !== '' && locations.indexOf(winner.country) === -1) {
          locations.push(winner.country);
        }
      });

      locations.forEach(location => {
        if (!countryToBattles[location]) {
          countryToBattles[location] = [];
        }

        countryToBattles[location].push(battle);
      });
    })
  });

  const countries = Object.keys(countryToBattles);

  countries.forEach(country => {
    const battles = countryToBattles[country];

    battles.sort((a, b) => {
      a = new Date(a.start);
      b = new Date(b.start);

      if (a < b) {
        return 1;
      } else if (a > b) {
        return -1;
      } else {
        return 0;
      }
    });
  });

  return countryToBattles;
};
module.exports = async (events) => {
  const countryToEvents = {};

  events.forEach(event => {
    if (event.location && event.location.code !== '') {
      if (!countryToEvents[event.location.code]) {
        countryToEvents[event.location.code] = [];
      }

      countryToEvents[event.location.code].push(event);
    }
  });

  const codes = Object.keys(countryToEvents);

  codes.forEach(code => {
    const events = countryToEvents[code];

    countryToEvents[code] = events.sort((a, b) => {
      const aDate = new Date(a.originalStart);
      const bDate = new Date(b.originalStart);

      if (aDate < bDate) {
        return 1;
      } else if (aDate > bDate) {
        return -1;
      } else {
        return 0;
      }
    });
  });

  return countryToEvents;
};
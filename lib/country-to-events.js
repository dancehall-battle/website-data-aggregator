module.exports = async (events, removeLocation = false) => {
  const countryToEvents = {};

  events.forEach(event => {
    if (event.location && event.location.code !== '') {
      if (!countryToEvents[event.location.code]) {
        countryToEvents[event.location.code] = [];
      }

      countryToEvents[event.location.code].push(event);

      if (removeLocation) {
        delete event.location;
      }
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
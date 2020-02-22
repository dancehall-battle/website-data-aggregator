const getBattles = require('./lib/battles');
const getCountries = require('./lib/countries');
const getCountryToBattles = require('./lib/country-to-battles');
const getUpcoming = require('./lib/upcoming');
const getCountryToEvents = require('./lib/country-to-events');
const getEvents = require('./lib/events');
const getCountryToJSONLD = require('./lib/country-to-jsonld');
const getDancerList = require('./lib/dancer-list');
const getDancers = require('./lib/dancers');
const getRankings = require('./lib/rankings');

module.exports = {
  getBattles,
  getCountries,
  getCountryToBattles,
  getUpcoming,
  getCountryToEvents,
  getEvents,
  getCountryToJSONLD,
  getDancerList,
  getDancers,
  getRankings
};
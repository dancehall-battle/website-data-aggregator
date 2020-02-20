const {QueryEngineComunica} = require('graphql-ld-comunica/index');
const tpfServers = require('./tpf-servers.json');

module.exports = (isDev = false) => {
  const comunicaConfig = {};

  if (isDev) {
    comunicaConfig.sources = tpfServers.dev;
    console.log('Using development TPF servers.');
  } else {
    comunicaConfig.sources = tpfServers.live;
  }

  return new QueryEngineComunica(comunicaConfig);
};
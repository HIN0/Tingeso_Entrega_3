import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8090', // Puerto REAL de tu Docker actual
  realm: 'toolrent-realm',      // Tu reino actual
  clientId: 'toolrent-client',  // Tu cliente actual
});

export default keycloak;
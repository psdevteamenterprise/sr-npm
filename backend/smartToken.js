const { secrets } = require("wix-secrets-backend.v2");
const { elevate } = require("wix-auth");

function getSmartToken() {
    const elevatedGetSecretValue = elevate(secrets.getSecretValue);
    return elevatedGetSecretValue("x-smarttoken")
      .then((secret) => {
        return secret;
      })
      .catch((error) => {
        console.error(error);
      });
  }

  module.exports = {
    getSmartToken,
  };
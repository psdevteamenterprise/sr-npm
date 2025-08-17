const { secrets } = require("@wix/secrets");
const { auth } = require('@wix/essentials');


function getSmartToken() {
    const elevatedGetSecretValue = auth.elevate(secrets.getSecretValue);
    return elevatedGetSecretValue("x-smarttoken")
      .then((secret) => {
        return secret;
      })
      .catch((error) => {
        console.error(error);
        throw error;
      });
  }
  
  function getCompanyId() {
    const elevatedGetSecretValue = auth.elevate(secrets.getSecretValue);
    return elevatedGetSecretValue("companyID")
      .then((secret) => {
        return secret;
      })
      .catch((error) => {
        console.error(error);
        throw error;
      });
  }
  module.exports = {
    getSmartToken,
    getCompanyId
  };
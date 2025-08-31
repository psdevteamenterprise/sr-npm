const { secrets } = require("@wix/secrets");
const { auth } = require('@wix/essentials');

const getSecretValue = auth.elevate(secrets.getSecretValue);

function getSmartToken() {
  return getSecretValue("x-smarttoken")
    .then((secret) => {
      return secret;
    })
}

  function getCompanyId() {
    return getSecretValue("companyID")
      .then((secret) => {
        return secret;
      })
  }
  module.exports = {
    getCompanyId,
    getSmartToken
  };
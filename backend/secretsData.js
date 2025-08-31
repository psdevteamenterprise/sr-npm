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
    console.log("Getting the company ID from the secrets");
    return getSecretValue("companyID")
      .then((secret) => {
        return secret;
      }).catch((error) => {
        console.error("Error getting the company ID from the secrets: ", error);
        throw error;
      });
  }
  module.exports = {
    getCompanyId,
    getSmartToken
  };
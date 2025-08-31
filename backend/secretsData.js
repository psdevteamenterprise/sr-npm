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
    const getSecretValue2 = auth.elevate(secrets.getSecretValue);
    console.log("getSecretValue2 is : ", getSecretValue2);

    return getSecretValue2("companyID")
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
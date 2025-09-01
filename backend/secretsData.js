const { secrets } = require("@wix/secrets");
const { auth } = require('@wix/essentials');
const { getTokenFromCMS } = require('./data');
const { TOKEN_NAME } = require('./collectionConsts');

const getSecretValue = auth.elevate(secrets.getSecretValue);

function getSmartToken() {
  return retrieveSecretVal(TOKEN_NAME.SMART_TOKEN)
}

  function getCompanyId() {
    return retrieveSecretVal(TOKEN_NAME.COMPANY_ID)
  }

  async function retrieveSecretVal(tokenName)
  {
    return getSecretValue(tokenName)
    .then((secret) => {
      return secret;
    }).catch(async (error) => {
      console.error("Error retrieving secret value: ", error)
      console.error("Retrying with getTokenFromCMS")
      const secret = await getTokenFromCMS(tokenName);
      return secret
    })
  }

  module.exports = {
    getCompanyId,
    getSmartToken
  };
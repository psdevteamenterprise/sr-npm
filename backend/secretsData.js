const { secrets } = require("@wix/secrets");
const { auth } = require('@wix/essentials');
const { items: wixData } = require('@wix/data');
const { COLLECTIONS,TOKEN_NAME } = require('./collectionConsts');

const getSecretValue = auth.elevate(secrets.getSecretValue);
const elevatedQuery = auth.elevate(wixData.query);

  async function retrieveSecretVal(tokenName)
  {
    return getSecretValue(tokenName)
    .then((secret) => {
      return secret;
    }).catch(async (error) => {
      console.warn("Error retrieving secret value: ", error)
      console.warn("Retrying with getTokenFromCMS")
      const secret = await getTokenFromCMS(tokenName);
      return secret
    })
  }

  async function getTokenFromCMS(tokenName) {
    const result = await elevatedQuery(COLLECTIONS.SECRET_MANAGER_MIRROR).eq('tokenName',tokenName).find();
    if (result.items.length > 0) {
        return result.items[0].value; 
    } else {
        throw new Error(`[getTokenFromCMS], No ${tokenName} found`);
    }
  }
  async function getTemplateTypeFromCMS() {
    const result = await elevatedQuery(COLLECTIONS.TEMPLATE_TYPE).limit(1).find();
    if (result.items.length > 0) {
        return result.items[0].templateType; 
    } else {
        throw new Error('[getTemplateTypeFromCMS], No templateType found');
    }
  }
  
  async function getApiKeys() {
    const companyId = await getTokenFromCMS(TOKEN_NAME.COMPANY_ID);
    const templateType = await getTemplateTypeFromCMS();
    return {companyId,templateType};
  }

  module.exports = {
    getTokenFromCMS,
    getApiKeys,
    retrieveSecretVal
  };
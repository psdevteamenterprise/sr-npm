const { COLLECTIONS } = require('./collectionConsts');
const { items: wixData } = require('@wix/data');


async function getAllPositions() {
  return wixData
    .query(COLLECTIONS.JOBS)
    .limit(1000)
    .find()
    .then(result => result.items);
}

async function getPositionsByField(field, value) {
  return wixData
    .query(COLLECTIONS.JOBS)
    .eq(field, value)
    .find()
    .then(result => result.items);
}

async function getCutomFieldKeys() {
  return wixData
    .query(COLLECTIONS.JOBS)
    .limit(1)
    .find()
    .then(result => result.items.customFields);
}

module.exports = {
  getAllPositions,
  getPositionsByField,
  getCutomFieldKeys
};

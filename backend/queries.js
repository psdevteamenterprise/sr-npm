const { COLLECTIONS,QUERY_MAX_LIMIT} = require('./consts');
const { items: wixData } = require('@wix/data');

async function getAllPositions() {
  return wixData
    .query(COLLECTIONS.JOBS)
    .limit(QUERY_MAX_LIMIT)
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

module.exports = {
  getAllPositions,
  getPositionsByField,
};

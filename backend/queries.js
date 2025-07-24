const { items: wixData } = require('@wix/data');

async function getAllPositions() {
  return wixData
    .query('Jobs')
    .limit(1000)
    .find()
    .then(result => result.items);
}

async function getPositionsByField(field, value) {
  return wixData
    .query('Jobs')
    .eq(field, value)
    .find()
    .then(result => result.items);
}

module.exports = {
  getAllPositions,
  getPositionsByField,
};

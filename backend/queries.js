const { COLLECTIONS,JOBS_COLLECTION_FIELDS } = require('./collectionConsts');
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

async function getPositionWithMultiRefField(jobId)
{
  return wixData
    .queryReferenced(COLLECTIONS.JOBS, jobId,JOBS_COLLECTION_FIELDS.MULTI_REF_JOBS_CUSTOM_VALUES)
    .then(result => result.items);
}

module.exports = { getAllPositions, getPositionsByField, getPositionWithMultiRefField };

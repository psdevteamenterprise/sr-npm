const { COLLECTIONS } = require('./consts');
const { items } = require('@wix/data');


async function getAllPositions() {
    const query = items.query(COLLECTIONS.JOBS);
    const results = await query.find();
    return results.items;
   
}

async function getPositionsByField(field, value) {
    const query = items.query(COLLECTIONS.JOBS)
        .eq(field, value);
    const results = await query.find();
    return results.items;
}


module.exports = {
    getAllPositions,
    getPositionsByField,
};
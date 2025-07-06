const { COLLECTIONS } = require('./consts');
//const { items } = require('@wix/data');
const { wixData } = require('./elevated-modules');



async function getAllPositions() {
    const query = wixData.query(COLLECTIONS.JOBS);
    const results = await query.find();
    return results.items;
   
}

async function getPositionsByField(field, value) {
    const query = wixData.query(COLLECTIONS.JOBS)
        .eq(field, value);
    const results = await query.find();
    return results.items;
}


module.exports = {
    getAllPositions,
    getPositionsByField,
};
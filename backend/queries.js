const { wixData } = require('./elevated-modules');

async function getAllPositions(collectionID) {
    const query = wixData.query(collectionID);
    const results = await query.find();
    return results.items;
   
}

async function getPositionsByField(collectionID, field, value) {
    const query = wixData.query(collectionID)
        .eq(field, value);
    const results = await query.find();
    return results.items;
}


module.exports = {
    getAllPositions,
    getPositionsByField,
};
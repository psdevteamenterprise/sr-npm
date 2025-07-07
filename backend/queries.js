const { COLLECTIONS } = require('./consts');
const { items } = require('@wix/data');


async function getAllPositions() {
    return await items.query(COLLECTIONS.JOBS).find().items;
    
}

async function getPositionsByField(field, value) {
    return await items.query(COLLECTIONS.JOBS).where(field, value).find().items;
    
}


module.exports = {
    getAllPositions,
    getPositionsByField,
};
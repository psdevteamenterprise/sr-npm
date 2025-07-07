const { COLLECTIONS } = require('./consts');
const { items:wixData } = require('@wix/data');



async function getAllPositions() {
    return wixData.query(COLLECTIONS.JOBS).find().then(result=>result.items) 
   
}

async function getPositionsByField(field, value) {
    return wixData.query(COLLECTIONS.JOBS).eq(field, value).find().then(result=>result.items) 
}


module.exports = {
    getAllPositions,
    getPositionsByField,
};
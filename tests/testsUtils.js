const { executeApiRequest } = require('tests-utils');
const { COLLECTIONS } = require('./consts');
const { items: wixData } = require('@wix/data');

function getRandomPosition(positions) {
    return positions[Math.floor(Math.random() * positions.length)];
}
async function executeRequestAndTest(requestBody) {
    try{
        response = await executeApiRequest(requestBody);
        expect(response.status).not.toBe(500);
    }catch(error){
        expect(error.message).toBe('Request failed with status code 500');
    }
}

async function clearCollections() {

    for (const collection of Object.values(COLLECTIONS)) {
        await wixData.truncate(collection);
    }
}

module.exports = {
    getRandomPosition, 
    executeRequestAndTest,
    clearCollections
}
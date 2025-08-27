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

module.exports = {
    getRandomPosition, executeRequestAndTest
}
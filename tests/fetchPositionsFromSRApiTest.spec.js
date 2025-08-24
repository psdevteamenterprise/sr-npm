const { executeApiRequest } = require('tests-utils');
const { getRandomPosition } = require('./testsUtils');

describe('Job details fetch from SR API Tests', () => {
  
      test('should successfully fetch job details from SR API', async () => {
        const requestBody = `fetchPositionsFromSRAPI();`;
        const wixDataResponse = await executeApiRequest(requestBody);
        const randomPosition = getRandomPosition(wixDataResponse.data.result.content);
        console.log("randomPosition: ", randomPosition);
        expect(wixDataResponse.data.result.totalFound).toBeGreaterThan(0);
        expect(wixDataResponse.data.result.content.length).toBeGreaterThan(0);
        expect(randomPosition.id.length).toBeGreaterThan(0);
        expect(randomPosition.name.length).toBeGreaterThan(0);
        expect(randomPosition.jobAdId.length).toBeGreaterThan(0);
        expect(randomPosition.location).toBeDefined();
        expect(randomPosition.department).toBeDefined();
      });
  
  

  });
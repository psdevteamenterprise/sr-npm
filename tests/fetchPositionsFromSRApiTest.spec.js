const { executeApiRequest } = require('tests-utils');
const { getRandomPosition } = require('./testsUtils');

describe('Job details fetch from SR API Tests', () => {
  
      test('should successfully fetch job details from SR API', async () => {
        const requestBody = `fetchPositionsFromSRAPI();`;
        const fetchJobsResponse = await executeApiRequest(requestBody);
        const randomPosition = getRandomPosition(fetchJobsResponse.data.result.content);
        console.log("randomPosition: ", randomPosition);
        expect(fetchJobsResponse.data.result.totalFound).toBeGreaterThan(0);
        expect(fetchJobsResponse.data.result.content.length).toBeGreaterThan(0);
        expect(randomPosition.id.length).toBeGreaterThan(0);
        expect(randomPosition.name.length).toBeGreaterThan(0);
        expect(randomPosition.jobAdId.length).toBeGreaterThan(0);
        expect(randomPosition.location).toBeDefined();
        expect(randomPosition.department).toBeDefined();
      });

      test('should successfully fetch job description from SR API', async () => {
        const fetchPositionsRequestBody = `fetchPositionsFromSRAPI();`;
        const positions = await executeApiRequest(fetchPositionsRequestBody);
        const randomPosition = getRandomPosition(positions.data.result.content);
        const fetchJobDescriptionRequestBody = `fetchJobDescription(${randomPosition.id});`;
        const jobFetchResponse = await executeApiRequest(fetchJobDescriptionRequestBody);
        console.log("jobFetchResponse: ", jobFetchResponse.data.result);
        expect(jobFetchResponse.data.result.id).toBe(randomPosition.id);
        expect(jobFetchResponse.data.result.jobAd.sections.jobDescription).toBeDefined();
        expect(jobFetchResponse.data.result.jobAd.sections.jobDescription.text.length).toBeGreaterThan(0);
        expect(jobFetchResponse.data.result.applyUrl.length).toBeGreaterThan(0);
        expect(jobFetchResponse.data.result.location).toBeDefined();
      });
  
  

  });
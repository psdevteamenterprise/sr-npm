const { executeApiRequest } = require('tests-utils');
const { getRandomPosition, executeRequestAndTest } = require('./testsUtils');

describe('Job details fetch from SR API Tests', () => {

    let positions;
    beforeAll(async () => {
        const requestBody = `fetchPositionsFromSRAPI();`;
        positions = await executeApiRequest(requestBody);
    });
  
      test('should successfully fetch job details from SR API', async () => {
        const randomPosition = getRandomPosition(positions.data.result.content);
        expect(positions.data.result.totalFound).toBeGreaterThan(0);
        expect(positions.data.result.content.length).toBeGreaterThan(0);
        expect(randomPosition.id.length).toBeGreaterThan(0);
        expect(randomPosition.name.length).toBeGreaterThan(0);
        expect(randomPosition.jobAdId.length).toBeGreaterThan(0);
        expect(randomPosition.location).toBeDefined();
        expect(randomPosition.department).toBeDefined();
      });

      test('should successfully fetch job description from SR API', async () => {
        const randomPosition = getRandomPosition(positions.data.result.content);
        const fetchJobDescriptionRequestBody = `fetchJobDescription(${randomPosition.id});`;
        const jobFetchResponse = await executeApiRequest(fetchJobDescriptionRequestBody);
        expect(jobFetchResponse.data.result.id).toBe(randomPosition.id);
        expect(jobFetchResponse.data.result.jobAd.sections.jobDescription).toBeDefined();
        expect(jobFetchResponse.data.result.jobAd.sections.jobDescription.text.length).toBeGreaterThan(0);
        expect(jobFetchResponse.data.result.applyUrl.length).toBeGreaterThan(0);
        expect(jobFetchResponse.data.result.location).toBeDefined();
      });
  });

describe('fetchPositionsFromSRAPI error handling', () => {
  test('should throw error if invalid companyId is found', async () => {
    const requestBody = `fetchPositionsFromSRAPI('invalid_company_id');`;
    executeRequestAndTest(requestBody)
  });

  test('should throw error when a bad URL is used', async () => {
    const requestBody = `makeSmartRecruitersRequest('/v1/error/companyId/postings');`;
    executeRequestAndTest(requestBody)
  });



});

describe('fetchJobDescription error handling', () => {
  test('should throw error if invalid jobId is found', async () => {
    const requestBody = `fetchJobDescription('invalid_job_id');`;
    executeRequestAndTest(requestBody)
  });
  test('should throw error when given a valid jobId but no jobAdId is found', async () => {
    const requestBody = `fetchJobDescription('1234567890');`;
    executeRequestAndTest(requestBody)
  });
});
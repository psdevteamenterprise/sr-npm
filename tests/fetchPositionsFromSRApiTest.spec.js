const { executeApiRequest } = require('tests-utils');
const { getRandomPosition, executeRequestAndTest } = require('./testsUtils');

describe('Job details fetch from SR API Tests', () => {

    const templateTypes = [
      { templatename: 'External', templateType: 'PUBLIC'},
      { templatename: 'Internal', templateType: 'INTERNAL'}
    ];
    
    templateTypes.forEach(({ templateType ,templatename}) => {
      describe(`Job details fetch from SR API Tests - ${templatename}`, () => {
        let positions;
        beforeAll(async () => {
          const fetchPositionsFromSRAPIRequestBody = `fetchPositionsFromSRAPI({companyId:'WixTest',templateType: '${templateType}'});`;
           positions = await executeApiRequest(fetchPositionsFromSRAPIRequestBody);
        });
        

        test(`should successfully fetch job details from SR API (${templatename})`, async () => {
          const randomPosition = getRandomPosition(positions.data.result.content);
          expect(positions.data.result.totalFound).toBeGreaterThan(0);
          expect(positions.data.result.content.length).toBeGreaterThan(0);
          expect(randomPosition.id.length).toBeGreaterThan(0);
          expect(randomPosition.name.length).toBeGreaterThan(0);
          expect(randomPosition.jobAdId.length).toBeGreaterThan(0);
          expect(randomPosition.location).toBeDefined();
          expect(randomPosition.department).toBeDefined();
        });

        test(`should successfully fetch job description from SR API (${templatename})`, async () => {
          const randomPosition = getRandomPosition(positions.data.result.content);
          console.log("randomPosition is : ", randomPosition);
          const fetchJobDescriptionRequestBody = `fetchJobDescription(${randomPosition.id});`;
          const jobFetchResponse = await executeApiRequest(fetchJobDescriptionRequestBody);
          expect(jobFetchResponse.data.result.id).toBe(randomPosition.id);
          expect(jobFetchResponse.data.result.jobAd.sections.jobDescription).toBeDefined();
          expect(jobFetchResponse.data.result.jobAd.sections.jobDescription.text.length).toBeGreaterThan(0);
          expect(jobFetchResponse.data.result.applyUrl.length).toBeGreaterThan(0);
          expect(jobFetchResponse.data.result.location).toBeDefined();
        });
      });
    });
  });

describe('fetchPositionsFromSRAPI error handling', () => {
  test('should throw error if invalid companyId is found external template', async () => {
    const requestBody = `fetchPositionsFromSRAPI({companyId: 'invalid_company_id',templateType: 'EXTERNAL'});`;
    executeRequestAndTest(requestBody)
  });

  test('should throw error if invalid companyId is found internal template', async () => {
    const requestBody = `fetchPositionsFromSRAPI({companyId: 'invalid_company_id',templateType: 'INTERNAL'});`;
    executeRequestAndTest(requestBody)
  });

  test('should throw error when a bad URL is used', async () => {
    const requestBody = `makeSmartRecruitersRequest('/v1/error/companyId/postings');`;
    executeRequestAndTest(requestBody)
  });



});

describe('fetchJobDescription error handling', () => {
  test('should throw error if invalid jobId is given', async () => {
    const requestBody = `fetchJobDescription('invalid_job_id');`;
    executeRequestAndTest(requestBody)
  });
  test('should throw error when given a valid but wrong jobId is given', async () => {
    const requestBody = `fetchJobDescription('1234567890');`;
    executeRequestAndTest(requestBody)
  });
});
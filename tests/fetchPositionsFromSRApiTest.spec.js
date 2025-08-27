const { fetch } = require('wix-fetch');
const { items: wixData } = require('@wix/data');
const { executeApiRequest } = require('tests-utils');
const { getRandomPosition } = require('./testsUtils');

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
    let mockFetch;

    beforeEach(() => {
        jest.resetModules();
        mockFetch = jest.fn();

        jest.doMock('wix-fetch', () => ({
            fetch: mockFetch,
        }));

        jest.doMock('@wix/data', () => ({
            items: {
                query: () => ({
                    limit: () => ({
                        find: () => Promise.resolve({ items: [{ companyId: 'company-123' }] }),
                    }),
                }),
            },
        }));
    });

    test('throws on 400 Bad Request from SmartRecruiters', async () => {
        mockFetch.mockResolvedValue({ ok: false, status: 400 });
        const { fetchPositionsFromSRAPI } = require('../backend/fetchPositionsFromSRAPI');
        await expect(fetchPositionsFromSRAPI()).rejects.toThrow('HTTP error! status: 400');
    });

    test('throws on network failure while fetching positions', async () => {
        mockFetch.mockRejectedValue(new Error('Network failure'));
        const { fetchPositionsFromSRAPI } = require('../backend/fetchPositionsFromSRAPI');
        await expect(fetchPositionsFromSRAPI()).rejects.toThrow('Network failure');
    });
});
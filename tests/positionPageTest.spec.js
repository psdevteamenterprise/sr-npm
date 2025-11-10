// Mock query chain at the top
const MockJobBuilder = require('./mockJobBuilder');
const { positionPageOnReady } = require('../pages/positionPage');
const { getPositionWithMultiRefField } = require('../backend/queries');
const { items: wixData } = require('@wix/data');

const mockQueryChain = {
  eq: jest.fn().mockReturnThis(),
  find: jest.fn(),
  include: jest.fn().mockReturnThis(),
  hasSome: jest.fn().mockReturnThis(),
  ne: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  then: jest.fn()
};

// Jest mocks (hoisted automatically)
jest.mock('wix-location-frontend', () => ({
  query: {}
}), { virtual: true });
jest.mock('@wix/data', () => ({
  items: {
    query: jest.fn(() => mockQueryChain),
    queryReferenced: jest.fn()
  }
}));
jest.mock('@wix/site-location', () => ({
  location: {
    to: jest.fn()
  }
}));

// Mock the backend queries module as well
jest.mock('../backend/queries', () => ({
  getPositionWithMultiRefField: jest.fn()
}));

// Mock utils
jest.mock('../public/utils', () => ({
  htmlToText: jest.fn((text) => text.replace(/<[^>]*>/g, '')),
  appendQueryParams: jest.fn((url) => url)
}));

// Mock isElementExistOnPage
jest.mock('psdev-utils', () => ({
  isElementExistOnPage: jest.fn(() => true)
}));






describe('related jobs show jobs with the same category value test', () => {
  let mockW;
  let mockRealtedJobsRepeater;

  beforeEach(() => {
    // Create a proper repeater mock that allows data to be set
    mockRealtedJobsRepeater = { 
      data: null,
      onItemReady: jest.fn()
    };
  });

  it('should show related jobs with the same category value', async () => {
    const CATEGORY_FIELD_ID = `category-field-${Date.now()}`;
    const TECH_CATEGORY_VALUE_ID = `tech-category-${Math.floor(Math.random() * 10000)}`;

    const currentJob = new MockJobBuilder()
      .withTitle('Senior Developer')
      .withDepartment('Technology')
      .withMultiRefCustomValues([{ _id: TECH_CATEGORY_VALUE_ID }])
      .forPositionPage()
      .build();

    // create 0-5 related jobs with same category value(0 for the case when there is no related jobs)
    const relatedJobsCount = Math.floor(Math.random() * 6);
    const relatedJobs = MockJobBuilder.createJobsWithSameField(TECH_CATEGORY_VALUE_ID, relatedJobsCount);

    const currentJobCustomValues = [
      { _id: TECH_CATEGORY_VALUE_ID, customField: CATEGORY_FIELD_ID, title: 'Technology' }
    ];

    const categoryCustomField = {
      _id: CATEGORY_FIELD_ID,
      title: 'Category'
    };

    let datasetReadyCallback;
    const mockDataset = {
      onReady: jest.fn((callback) => {
        datasetReadyCallback = callback;
      }),
      getCurrentItem: jest.fn().mockResolvedValue(currentJob)
    };

    mockW = jest.fn((selector) => {
      const mocks = {
        '#datasetJobsItem': mockDataset,
        '#relatedJobsRepNoDepartment': mockRealtedJobsRepeater,
        '#companyDescriptionText': { text: '' },
        '#responsibilitiesText': { text: '' },
        '#qualificationsText': { text: '' },
        '#relatedJobsTitleText': { text: '' },
        '#additionalInfoText': { text: '' },
        '#applyButton': { target: '', link: '' },
        '#relatedJobsNoDepartmentItem': { onClick: jest.fn() },
        '#relatedJobsDataset': { onReady: jest.fn(), getTotalCount: jest.fn() },
        '#relatedJobsSection': { collapse: jest.fn() },
        '#referFriendButton': { hide: jest.fn() }
      };
      return mocks[selector] || { text: '', hide: jest.fn(), onClick: jest.fn() };
    });

    getPositionWithMultiRefField.mockResolvedValue(currentJobCustomValues);
    
    mockQueryChain.find.mockImplementation(() => {
      const queryArg = wixData.query.mock.calls[wixData.query.mock.calls.length - 1][0];
      if (queryArg === 'CustomFields') {
        return Promise.resolve({ items: [categoryCustomField] });
      }
      return Promise.resolve({ items: relatedJobs });
    });

    await positionPageOnReady(mockW);
    await datasetReadyCallback();

    expect(mockRealtedJobsRepeater.data).not.toBeNull();
    expect(mockRealtedJobsRepeater.data).toHaveLength(relatedJobsCount);
    
    const allHaveSameCategory = mockRealtedJobsRepeater.data.every(job => 
      job.multiRefJobsCustomValues && 
      job.multiRefJobsCustomValues.some(val => val._id === TECH_CATEGORY_VALUE_ID)
    );
    expect(allHaveSameCategory).toBe(true);
  });

});
 

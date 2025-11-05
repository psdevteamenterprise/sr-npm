const rewire = require('rewire');
const MockJobBuilder = require('./mockJobBuilder');
const { CAREERS_MULTI_BOXES_PAGE_CONSTS, CATEGORY_CUSTOM_FIELD_ID_IN_CMS } = require('../backend/careersMultiBoxesPageIds');

// Mock Wix modules
const mockQueryParams = {
  add: jest.fn(),
  remove: jest.fn()
};

const mockLocation = {
  url: 'https://test.com',
  path: '/test',
  query: {}
};

// Temporarily mock require for Wix modules
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id === 'wix-location-frontend') {
    return { queryParams: mockQueryParams };
  }
  if (id === '@wix/site-location') {
    return { location: mockLocation };
  }
  return originalRequire.apply(this, arguments);
};

const careersMultiBoxesPage = rewire('../pages/careersMultiBoxesPage');

// Restore original require
Module.prototype.require = originalRequire;

const secondarySearch = careersMultiBoxesPage.__get__('secondarySearch');
const primarySearch = careersMultiBoxesPage.__get__('primarySearch');
const loadCategoriesListPrimarySearch = careersMultiBoxesPage.__get__('loadCategoriesListPrimarySearch');



describe('secondarySearch function tests', () => {
  let mockW;
  let mockJobsRepeater;
  let mockPaginationCurrentText;
  let mockPaginationTotalCountText;
  let mockPageButtonNext;
  let mockPageButtonPrevious;
  let mockTotalJobsCountText;
  let mockJobsMultiStateBox;

  beforeEach(() => {
    mockJobsRepeater = { data: null };
    mockPaginationCurrentText = { text: '' };
    mockPaginationTotalCountText = { text: '' };
    mockPageButtonNext = { 
      enable: jest.fn(), 
      disable: jest.fn() 
    };
    mockPageButtonPrevious = { 
      enable: jest.fn(), 
      disable: jest.fn() 
    };
    mockTotalJobsCountText = { text: '' };
    mockJobsMultiStateBox = { changeState: jest.fn() };

    mockW = jest.fn((selector) => {
      const mocks = {
        [CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER]: mockJobsRepeater,
        [CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationCurrentText]: mockPaginationCurrentText,
        [CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationTotalCountText]: mockPaginationTotalCountText,
        [CAREERS_MULTI_BOXES_PAGE_CONSTS.PAGE_BUTTON_NEXT]: mockPageButtonNext,
        [CAREERS_MULTI_BOXES_PAGE_CONSTS.PAGE_BUTTON_PREVIOUS]: mockPageButtonPrevious,
        [CAREERS_MULTI_BOXES_PAGE_CONSTS.TotalJobsCountText]: mockTotalJobsCountText,
        [CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_MULTI_STATE_BOX]: mockJobsMultiStateBox
      };
      return mocks[selector] || {
        data: null,
        text: '',
        value: '',
        onClick: jest.fn(),
        onChange: jest.fn(),
        onInput: jest.fn(),
        enable: jest.fn(),
        disable: jest.fn(),
        changeState: jest.fn()
      };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    careersMultiBoxesPage.__set__('currentJobs', []);
  });

  it('should return count > 0 when searching for existing job title', async () => {
    
    
    let mockJobs = MockJobBuilder.createMultiple(11, (builder, index) => {
      builder.withTitle(`Product Manager ${index}`);
    });

    mockJobs.push(new MockJobBuilder().withTitle('Backend Engineer').build());
    mockJobs.push(new MockJobBuilder().withTitle('Frontend Engineer').build());

    careersMultiBoxesPage.__set__('currentJobs', mockJobs);

    const result = await secondarySearch(mockW, 'product');

    expect(result.length).toBe(11);
    expect(mockTotalJobsCountText.text).toContain('11');
    expect(mockPaginationCurrentText.text).toBe('10');
    expect(mockPaginationTotalCountText.text).toBe('11');
    expect(mockPageButtonNext.enable).toHaveBeenCalled();
    expect(mockPageButtonPrevious.disable).toHaveBeenCalled();
  });

  it('should return 0 when searching for non-existing job title', async () => {
    let mockJobs = MockJobBuilder.createMultiple(11, (builder, index) => {
      builder.withTitle(`random job ${index}`);
    });
    careersMultiBoxesPage.__set__('currentJobs', mockJobs);

    const result = await secondarySearch(mockW, 'unicorn hunter');

    expect(result.length).toBe(0);
    expect(mockTotalJobsCountText.text).toContain('0 Jobs');
    expect(mockPaginationTotalCountText.text).toBe('0');
    expect(mockPageButtonNext.disable).toHaveBeenCalled();
    expect(mockPageButtonPrevious.disable).toHaveBeenCalled();

  });

  });


describe('primarySearch function tests', () => {
  let mockW;
  let mockprimarySearcJobResult;
  let mockprimarySearchMultiBox;
  let mockCategoryResultsRepeater;

  beforeEach(() => {
    mockprimarySearcJobResult = { data: null };
    mockprimarySearchMultiBox = { changeState: jest.fn() };
    mockCategoryResultsRepeater = { data: null };

    mockW = jest.fn((selector) => {
      const mocks = {
        [CAREERS_MULTI_BOXES_PAGE_CONSTS.JOB_RESULTS_REPEATER]: mockprimarySearcJobResult,
        [CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_MULTI_BOX]: mockprimarySearchMultiBox,
        [CAREERS_MULTI_BOXES_PAGE_CONSTS.CATEGORY_RESULTS_REPEATER]: mockCategoryResultsRepeater
      };
      return mocks[selector]
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    careersMultiBoxesPage.__set__('currentJobs', []);
  });

  it('should show job results for existing job title', async () => {
    let mockJobs = MockJobBuilder.createMultiple(11, (builder, index) => {
      builder.withTitle(`Product Manager ${index}`);
    });
    careersMultiBoxesPage.__set__('alljobs', mockJobs);

    await primarySearch(mockW, 'product');
    
    expect(mockprimarySearchMultiBox.changeState).toHaveBeenCalledWith('jobResults');
    expect(mockprimarySearcJobResult.data).toHaveLength(11);
    expect(mockprimarySearcJobResult.data).toEqual(mockJobs);
  });

   it('should show no results for non-existing job title', async () => {
     let mockJobs = MockJobBuilder.createMultiple(11, (builder, index) => {
       builder.withTitle(`Product Manager ${index}`);
     });
     careersMultiBoxesPage.__set__('alljobs', mockJobs);
 
     await primarySearch(mockW, 'unicorn hunter');
     
     expect(mockprimarySearchMultiBox.changeState).toHaveBeenCalledWith('noResults');
     expect(mockprimarySearcJobResult.data).toBeNull();
   });

   it('should fill category repeater when clicking on empty primary search input', async () => {
     const mockCategoryValues = [
       { _id: 'cat1', title: 'Engineering', customField: CATEGORY_CUSTOM_FIELD_ID_IN_CMS, totalJobs: 5 },
       { _id: 'cat2', title: 'Marketing', customField: CATEGORY_CUSTOM_FIELD_ID_IN_CMS, totalJobs: 3 },
       { _id: 'cat3', title: 'Sales', customField: CATEGORY_CUSTOM_FIELD_ID_IN_CMS, totalJobs: 7 }
     ];
     
     careersMultiBoxesPage.__set__('allvaluesobjects', mockCategoryValues);

     await loadCategoriesListPrimarySearch(mockW);

     expect(mockprimarySearchMultiBox.changeState).toHaveBeenCalledWith('categoryResults');
     expect(mockCategoryResultsRepeater.data).toHaveLength(3);
     expect(mockCategoryResultsRepeater.data[0].title).toContain('Engineering (5)');
     expect(mockCategoryResultsRepeater.data[1].title).toContain('Marketing (3)');
     expect(mockCategoryResultsRepeater.data[2].title).toContain('Sales (7)');
   });
 
 });
 

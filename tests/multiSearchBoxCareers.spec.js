const rewire = require('rewire');
const MockJobBuilder = require('./mockJobBuilder');
const { CAREERS_MULTI_BOXES_PAGE_CONSTS, CATEGORY_CUSTOM_FIELD_ID_IN_CMS } = require('../backend/careersMultiBoxesPageIds');

// Load modules with rewire
const careersMultiBoxesPage = rewire('../pages/careersMultiBoxesPage');
const pagesUtils = rewire('../pages/pagesUtils');

const secondarySearch = careersMultiBoxesPage.__get__('secondarySearch');
const primarySearch = pagesUtils.__get__('primarySearch');
const loadCategoriesListPrimarySearch = pagesUtils.__get__('loadCategoriesListPrimarySearch');


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
    careersMultiBoxesPage.__set__('allsecondarySearchJobs', []);
    careersMultiBoxesPage.__set__('currentSecondarySearchJobs', []);
    careersMultiBoxesPage.__set__('secondarySearchIsFilled', false);
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
    careersMultiBoxesPage.__set__('alljobs', []);
    careersMultiBoxesPage.__set__('allvaluesobjects', []);
  });

  it('should show job results for existing job title', async () => {
    let mockJobs = MockJobBuilder.createMultiple(11, (builder, index) => {
      builder.withTitle(`Product Manager ${index}`);
    });
    careersMultiBoxesPage.__set__('alljobs', mockJobs);

    await primarySearch(mockW, 'product',mockJobs);
    
    expect(mockprimarySearchMultiBox.changeState).toHaveBeenCalledWith('jobResults');
    expect(mockprimarySearcJobResult.data).toHaveLength(11);
    expect(mockprimarySearcJobResult.data).toEqual(mockJobs);
  });

   it('should show no results for non-existing job title', async () => {
     let mockJobs = MockJobBuilder.createMultiple(11, (builder, index) => {
       builder.withTitle(`Product Manager ${index}`);
     });
     careersMultiBoxesPage.__set__('alljobs', mockJobs);
 
     await primarySearch(mockW, 'unicorn hunter',mockJobs);
     
     
     expect(mockprimarySearchMultiBox.changeState).toHaveBeenCalledWith('noResults');
     expect(mockprimarySearcJobResult.data).toBeNull();
   });

   it('should fill category repeater when clicking on empty primary search input', async () => {
     const mockCategoryValues = [
       { _id: 'cat1', title: 'Engineering', customField: CATEGORY_CUSTOM_FIELD_ID_IN_CMS, count: 5 },
       { _id: 'cat2', title: 'Marketing', customField: CATEGORY_CUSTOM_FIELD_ID_IN_CMS, count: 3 },
       { _id: 'cat3', title: 'Sales', customField: CATEGORY_CUSTOM_FIELD_ID_IN_CMS, count: 7 }
     ];
     
     careersMultiBoxesPage.__set__('allvaluesobjects', mockCategoryValues);

     await loadCategoriesListPrimarySearch(mockW,mockCategoryValues);

     expect(mockprimarySearchMultiBox.changeState).toHaveBeenCalledWith('categoryResults');
     expect(mockCategoryResultsRepeater.data).toHaveLength(3);
     expect(mockCategoryResultsRepeater.data[0].title).toContain('Engineering (5)');
     expect(mockCategoryResultsRepeater.data[1].title).toContain('Marketing (3)');
     expect(mockCategoryResultsRepeater.data[2].title).toContain('Sales (7)');
   });
 
 });

describe('url params apply filters test', () => {
  const categoryId = 'category-field-id';
  const brandId = 'brand-field-id';
  const categoryValueId = 'cat-value-123';
  const brandValueId = 'brand-value-456';

  let mockCategoryCheckbox;
  let mockBrandsCheckbox;
  let mockJobsRepeater;
  let mockJobsMultiStateBox;
  

  beforeEach(() => {

    mockJobsRepeater = { data: null };
    mockJobsMultiStateBox = { changeState: jest.fn() };


    mockCategoryCheckbox = {
      options: [
        { label: 'Engineering (5)', value: categoryValueId },
        { label: 'Sales (3)', value: 'other-cat' }
      ],
      selectedIndices: [],
      value: []
    };

    mockBrandsCheckbox = {
      options: [
        { label: 'Brand A (10)', value: brandValueId },
        { label: 'Brand B (5)', value: 'other-brand' }
      ],
      selectedIndices: [],
      value: []
    };

    const mockFields = [
      { _id: categoryId, title: 'Category' },
      { _id: brandId, title: 'Brands' }
    ];

    const mockOptionsMap = new Map([
      [categoryId, [
        { label: 'Engineering', value: categoryValueId },
        { label: 'Sales', value: 'other-cat' }
      ]],
      [brandId, [
        { label: 'Brand A', value: brandValueId },
        { label: 'Brand B', value: 'other-brand' }
      ]]
    ]);

    careersMultiBoxesPage.__set__('allfields', mockFields);
    careersMultiBoxesPage.__set__('optionsByFieldId', mockOptionsMap);
  });

  afterEach(() => {
    jest.clearAllMocks();
    careersMultiBoxesPage.__set__('currentJobs', []);
    careersMultiBoxesPage.__set__('alljobs', []);
    careersMultiBoxesPage.__set__('allfields', []);
    careersMultiBoxesPage.__set__('allvaluesobjects', []);
    careersMultiBoxesPage.__set__('selectedByField', new Map());
    careersMultiBoxesPage.__set__('valueToJobs', {});
    careersMultiBoxesPage.__set__('countsByFieldId', new Map());
    careersMultiBoxesPage.__set__('optionsByFieldId', new Map());
    careersMultiBoxesPage.__set__('secondarySearchIsFilled', false);
  });

  it.each([
    {
      paramName: 'brand',
      paramValue: 'Brand A',
      expectedCheckbox: 'brands',
      expectedKeyword: 'brand a'
    },
    {
      paramName: 'category',
      paramValue: 'Engineering',
      expectedCheckbox: 'category',
      expectedKeyword: 'engineer'
    },
    {
      paramName: 'keyword',
      paramValue: 'senior',
      expectedCheckbox: null,
      expectedKeyword: 'senior'
    }
  ])('should apply $paramName filter when $paramName url param is present', async ({ paramName, paramValue, expectedCheckbox, expectedKeyword }) => {
    const handleUrlParams = careersMultiBoxesPage.__get__('handleUrlParams');
    const selectedByField = careersMultiBoxesPage.__get__('selectedByField');
    const categoryValueId = 'cat-value-123';
    const categoryId = 'category-field-id';
    const brandId = 'brand-field-id';
    const brandValueId = 'brand-value-456';

    let mockPrimarySearchInput = { value: '' };
    let mockPrimarySearchMultiBox = { changeState: jest.fn() };
    let mockJobResultsRepeater = { data: null };

    const mockWAll = jest.fn((selector) => {
      const mocks = {
        '#CategoryCheckBox': mockCategoryCheckbox,
        '#BrandsCheckBox': mockBrandsCheckbox,
        [CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT]: mockPrimarySearchInput,
        [CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_MULTI_BOX]: mockPrimarySearchMultiBox,
        [CAREERS_MULTI_BOXES_PAGE_CONSTS.JOB_RESULTS_REPEATER]: mockJobResultsRepeater,
        [CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER]: mockJobsRepeater,
        [CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_MULTI_STATE_BOX]: mockJobsMultiStateBox
      };
      return mocks[selector] || {
        text: '',
        value: '',
        data: null,
        changeState: jest.fn(),
        onClick: jest.fn(),
        enable: jest.fn(),
        disable: jest.fn()
      };
    });

    const seniorEngineerBrandACount = Math.floor(Math.random() * 5) + 1;
    const juniorEngineerBrandACount = Math.floor(Math.random() * 3) + 1;
    const seniorSalesBrandBCount = Math.floor(Math.random() * 3) + 1;
    const managerBrandBCount = Math.floor(Math.random() * 3) + 1;

    const seniorEngineerBrandAJobs = MockJobBuilder.createJobsWithSameField(categoryValueId, seniorEngineerBrandACount, { titlePrefix: 'Senior Engineer Brand A' });
    const juniorEngineerBrandAJobs = MockJobBuilder.createJobsWithSameField(categoryValueId, juniorEngineerBrandACount, { titlePrefix: 'Junior Engineer Brand A' });
    const seniorSalesBrandBJobs = MockJobBuilder.createJobsWithSameField('other-cat', seniorSalesBrandBCount, { titlePrefix: 'Senior Sales Brand B' });
    const managerBrandBJobs = MockJobBuilder.createJobsWithSameField('other-cat', managerBrandBCount, { titlePrefix: 'Manager Brand B' });

    seniorEngineerBrandAJobs.forEach(job => job.multiRefJobsCustomValues.push({ _id: brandValueId }));
    juniorEngineerBrandAJobs.forEach(job => job.multiRefJobsCustomValues.push({ _id: brandValueId }));
    seniorSalesBrandBJobs.forEach(job => job.multiRefJobsCustomValues.push({ _id: 'other-brand' }));
    managerBrandBJobs.forEach(job => job.multiRefJobsCustomValues.push({ _id: 'other-brand' }));

    const mockJobs = [...seniorEngineerBrandAJobs, ...juniorEngineerBrandAJobs, ...seniorSalesBrandBJobs, ...managerBrandBJobs];

    const brandAJobs = [...seniorEngineerBrandAJobs, ...juniorEngineerBrandAJobs];
    const engineerJobs = [...seniorEngineerBrandAJobs, ...juniorEngineerBrandAJobs];
    const seniorJobs = [...seniorEngineerBrandAJobs, ...seniorSalesBrandBJobs];

    const valueToJobs = {
      [categoryValueId]: engineerJobs.map(j => j._id),
      'other-cat': [...seniorSalesBrandBJobs, ...managerBrandBJobs].map(j => j._id),
      [brandValueId]: brandAJobs.map(j => j._id),
      'other-brand': [...seniorSalesBrandBJobs, ...managerBrandBJobs].map(j => j._id)
    };

    const countsByFieldId = new Map([
      [categoryId, new Map([
        [categoryValueId, engineerJobs.length],
        ['other-cat', seniorSalesBrandBCount + managerBrandBCount]
      ])],
      [brandId, new Map([
        [brandValueId, brandAJobs.length],
        ['other-brand', seniorSalesBrandBCount + managerBrandBCount]
      ])]
    ]);

    careersMultiBoxesPage.__set__('alljobs', mockJobs);
    careersMultiBoxesPage.__set__('currentJobs', mockJobs);
    careersMultiBoxesPage.__set__('valueToJobs', valueToJobs);
    careersMultiBoxesPage.__set__('countsByFieldId', countsByFieldId);

    await handleUrlParams(mockWAll, { [paramName]: paramValue });

    if (expectedCheckbox === 'brands') {
      expect(mockBrandsCheckbox.selectedIndices).toEqual([0]);
      expect(selectedByField.size).toBe(1);
      expect(mockJobsRepeater.data).toHaveLength(brandAJobs.length);
    } else if (expectedCheckbox === 'category') {
      expect(mockCategoryCheckbox.selectedIndices).toEqual([0]);
      expect(selectedByField.size).toBe(1);
      expect(mockJobsRepeater.data).toHaveLength(engineerJobs.length);
    } else {
      expect(mockPrimarySearchInput.value).toBe(paramValue);
      expect(mockPrimarySearchMultiBox.changeState).toHaveBeenCalledWith('jobResults');
      expect(mockJobResultsRepeater.data).toHaveLength(seniorJobs.length);
    }

    const dataToCheck = expectedCheckbox ? mockJobsRepeater.data : mockJobResultsRepeater.data;
    expect(dataToCheck.every(job => job.title.toLowerCase().includes(expectedKeyword))).toBe(true);
  });
});
 

const rewire = require('rewire');
const MockJobBuilder = require('./mockJobBuilder');
const { CAREERS_MULTI_BOXES_PAGE_CONSTS } = require('../backend/careersMultiBoxesPageIds');

const careersMultiBoxesPage = rewire('../pages/careersMultiBoxesPage');
const secondarySearch = careersMultiBoxesPage.__get__('secondarySearch');



describe('secondarySearch function tests', () => {
  let mockW;
  let mockJobsRepeater;
  let mockPaginationCurrentText;
  let mockPaginationTotalCountText;
  let mockPageButtonNext;
  let mockPageButtonPrevious;
  let mockTotalJobsCountText;

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

    mockW = jest.fn((selector) => {
      const mocks = {
        [CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER]: mockJobsRepeater,
        [CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationCurrentText]: mockPaginationCurrentText,
        [CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationTotalCountText]: mockPaginationTotalCountText,
        [CAREERS_MULTI_BOXES_PAGE_CONSTS.PAGE_BUTTON_NEXT]: mockPageButtonNext,
        [CAREERS_MULTI_BOXES_PAGE_CONSTS.PAGE_BUTTON_PREVIOUS]: mockPageButtonPrevious,
        [CAREERS_MULTI_BOXES_PAGE_CONSTS.TotalJobsCountText]: mockTotalJobsCountText
      };
      return mocks[selector] || {
        data: null,
        text: '',
        value: '',
        onClick: jest.fn(),
        onChange: jest.fn(),
        onInput: jest.fn(),
        enable: jest.fn(),
        disable: jest.fn()
      };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    careersMultiBoxesPage.__set__('currentJobs', []);
  });

  it('should return count > 0 when searching for existing job title', () => {
    
    
    let mockJobs = MockJobBuilder.createMultiple(11, (builder, index) => {
      builder.withTitle(`Product Manager ${index}`);
    });

    mockJobs.push(new MockJobBuilder().withTitle('Backend Engineer').build());
    mockJobs.push(new MockJobBuilder().withTitle('Frontend Engineer').build());

    careersMultiBoxesPage.__set__('currentJobs', mockJobs);

    const result = secondarySearch(mockW, 'product');

    expect(result.length).toBe(11);
    expect(mockTotalJobsCountText.text).toContain('11 Jobs');
    expect(mockPaginationCurrentText.text).toBe('10');
    expect(mockPaginationTotalCountText.text).toBe('11');
    expect(mockPageButtonNext.enable).toHaveBeenCalled();
    expect(mockPageButtonPrevious.disable).toHaveBeenCalled();
  });

  it('should return 0 when searching for non-existing job title', () => {
    let mockJobs = MockJobBuilder.createMultiple(11, (builder, index) => {
      builder.withTitle(`random job ${index}`);
    });
    careersMultiBoxesPage.__set__('currentJobs', mockJobs);

    const result = secondarySearch(mockW, 'unicorn hunter');

    expect(result.length).toBe(0);
    expect(mockTotalJobsCountText.text).toContain('0 Jobs');
    expect(mockPaginationCurrentText.text).toBe('0');
    expect(mockPaginationTotalCountText.text).toBe('0');
    expect(mockPageButtonNext.disable).toHaveBeenCalled();
    expect(mockPageButtonPrevious.disable).toHaveBeenCalled();

  });

  });


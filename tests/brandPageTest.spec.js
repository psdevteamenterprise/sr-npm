const mockLocation = {
  to: jest.fn()
};

jest.mock('@wix/site-location', () => ({
  location: mockLocation
}));

const { brandPageOnReady } = require('../pages/brandPage');

describe('Brand Page Tests', () => {
  let mockW;
  let mockButton;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockButton = {
      onClick: jest.fn()
    };

    mockW = jest.fn((selector) => {
      if (selector === '#seeJobsButton') {
        return mockButton;
      }
      return {};
    });
  });

  it('should navigate to search page with brand param when all jobs button is clicked', async () => {
    const brandName = 'TestBrand';
    
    await brandPageOnReady(mockW, brandName);
    
    expect(mockButton.onClick).toHaveBeenCalled();
    
    const onClickCallback = mockButton.onClick.mock.calls[0][0];
    await onClickCallback();
    
    expect(mockLocation.to).toHaveBeenCalledWith(`/search?brand=${brandName}`);
  });


});


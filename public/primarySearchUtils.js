const { location } = require("@wix/site-location");

const { CAREERS_MULTI_BOXES_PAGE_CONSTS, CATEGORY_CUSTOM_FIELD_ID_IN_CMS, PRIMARY_SEARCH_STATES } = require('../backend/careersMultiBoxesPageIds');
const { GLOBAL_SECTIONS_SELECTORS } = require('../public/selectors');
const { getFilter } = require('../public/filterUtils');
const { debounce } = require('../pages/pagesUtils');

async function handlePrimarySearch(_$w, allvaluesobjects) {
    // load the categories list before clicking on the primary search input
    loadCategoryRepeaterData(_$w, allvaluesobjects);

    // wait for the jobs dataset to be ready
    await _$w(GLOBAL_SECTIONS_SELECTORS.JOBS_DATASET).onReadyAsync();

    await bindPrimarySearch(_$w);
}

function loadCategoryRepeaterData(_$w, allvaluesobjects) {
    let categoryValues=[]
    for(const value of allvaluesobjects) {
      if(value.customField === CATEGORY_CUSTOM_FIELD_ID_IN_CMS) {
        categoryValues.push({title: value.title+` (${value.count})` , _id: value.valueId});
      }
    }
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.CATEGORY_RESULTS_REPEATER).data = categoryValues; 
}

async function bindPrimarySearch(_$w) {
    handleCategoryEvents(_$w);

    await handleSearchInput(_$w);

    // on mouse out collapse the results container
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.RESULTS_CONTAINER).onMouseOut(async () => {
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.RESULTS_CONTAINER).collapse();
    });
    
    // handle the click on the search button
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_BUTTON).onClick(async () => {
      if(_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value.trim()==='') {
        const baseUrl = await location.baseUrl();
        location.to(`${baseUrl}/search`);
      }
      else {
        let encodedKeyWord=encodeURIComponent(_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value);
        const baseUrl = await location.baseUrl();
        location.to(`${baseUrl}/search?keyword=${encodedKeyWord}`);
      }
    });
}

function handleCategoryEvents(_$w) {
    // set the label of the category repeater item
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.CATEGORY_RESULTS_REPEATER).onItemReady(async ($item, itemData) => {
    $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_CATEGORY_BUTTON).label = itemData.title || '';
  }); 
  
  // handle the category repeater item on click
  _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.CATEGORY_RESULTS_REPEATER_ITEM).onClick(async (event) => {
    const data = _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.CATEGORY_RESULTS_REPEATER).data;
    const clickedItemData = data.find(
      (item) => item._id === event.context.itemId,
    );
    const baseUrl = await location.baseUrl();
      const encodedCategory=encodeURIComponent(clickedItemData._id);
      location.to(`${baseUrl}/search?category=${encodedCategory}`);
  });
  
}

function getSearchQuery(_$w) {
    return _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value?.toLowerCase().trim() || '';
}

async function handleSearchInput(_$w) {
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).enable();

    // on Input call the queryPrimarySearchResults function
    const callQueryPrimarySearchResults = async () => { 
        await queryPrimarySearchResults(_$w, getSearchQuery(_$w));
      } 
          
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).onInput(async () => { 
        await debounce(() => callQueryPrimarySearchResults(), 300)();
    });

    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).onClick(async () => {
        _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.RESULTS_CONTAINER).expand();
        
        const searchQuery = getSearchQuery(_$w);
        if(searchQuery !== '') {
            await queryPrimarySearchResults(_$w, searchQuery);
        }
        else {
            _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_MULTI_BOX).changeState(PRIMARY_SEARCH_STATES.CATEGORY_RESULTS);
        }
    });

    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).onKeyPress(async (event) => {
        if( event.key === 'Enter') {
            if(getSearchQuery(_$w) === '') {
            // _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.RESULTS_CONTAINER).collapse();
            const baseUrl = await location.baseUrl();
            location.to(`${baseUrl}/search`);
        
            } 
            else {
            let encodedKeyWord=encodeURIComponent(_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value);
            const baseUrl = await location.baseUrl();
            location.to(`${baseUrl}/search?keyword=${encodedKeyWord}`);
            }
        }
    });
}
    
async function queryPrimarySearchResults(_$w, query) {
    if(query === undefined || query === '') {
        _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_MULTI_BOX).changeState(PRIMARY_SEARCH_STATES.CATEGORY_RESULTS);
        return false;
    }

    const searchByTitle = [{field: 'title', searchTerm: query}];
    const searchByCity = [{field: 'location.fullLocation', searchTerm: query}];

    let filter = await getFilter(searchByTitle);    

    await _$w(GLOBAL_SECTIONS_SELECTORS.JOBS_DATASET).setFilter(filter); 
    await _$w(GLOBAL_SECTIONS_SELECTORS.JOBS_DATASET).refresh();

    let count = _$w(GLOBAL_SECTIONS_SELECTORS.JOBS_DATASET).getTotalCount();

    if( count > 0 ) {
        _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.RESULTS_CONTAINER).expand();
        _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_MULTI_BOX).changeState(PRIMARY_SEARCH_STATES.JOB_RESULTS);
    }
    else {
        filter = await getFilter(searchByCity);
        await _$w(GLOBAL_SECTIONS_SELECTORS.JOBS_DATASET).setFilter(filter);
        await _$w(GLOBAL_SECTIONS_SELECTORS.JOBS_DATASET).refresh();

        count = _$w(GLOBAL_SECTIONS_SELECTORS.JOBS_DATASET).getTotalCount();
        if  (count > 0) {
        _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.RESULTS_CONTAINER).expand();
        _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_MULTI_BOX).changeState(PRIMARY_SEARCH_STATES.JOB_RESULTS);
        }
        else{
        _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_MULTI_BOX).changeState(PRIMARY_SEARCH_STATES.NO_RESULTS);
        }
}

return count > 0;
}

module.exports = {
  handlePrimarySearch,
  queryPrimarySearchResults
}
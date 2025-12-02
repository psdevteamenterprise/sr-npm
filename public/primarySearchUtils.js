const { location } = require("@wix/site-location");

const { CAREERS_MULTI_BOXES_PAGE_CONSTS, CATEGORY_CUSTOM_FIELD_ID_IN_CMS } = require('../backend/careersMultiBoxesPageIds');
const { getFilter } = require('../public/filterUtils');
const { debounce } = require('../pages/pagesUtils');

async function handlePrimarySearch(_$w, allvaluesobjects) {
    // wait for the jobs dataset to be ready
    await _$w("#jobsDataset").onReadyAsync();

    await bindPrimarySearch(_$w, allvaluesobjects);
}

function loadPrimarySearchRepeater(_$w) {
  // handle category state
  _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.CATEGORY_RESULTS_REPEATER).onItemReady(async ($item, itemData) => {
    $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_CATEGORY_BUTTON).label = itemData.title || '';
  }); 
  
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

async function handleSearchInput(_$w, allvaluesobjects) {
    const callQueryPrimarySearchResults = async () => { 
        const query = _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value?.toLowerCase().trim() || '';
        await queryPrimarySearchResults(_$w, query);
      } 
      
    const primarySearchDebounced = debounce(() => callQueryPrimarySearchResults(), 400);
    
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).onInput(async () => { 
    await primarySearchDebounced();
    });
    
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).onClick(async () => {
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.RESULTS_CONTAINER).expand();
    
    if(_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value.trim()!=='') {
        const query = _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value?.toLowerCase().trim() || '';
        await queryPrimarySearchResults(_$w, query);
    }
    else {
        await loadCategoriesListPrimarySearch(_$w, allvaluesobjects);
    }
    });

    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).onKeyPress(async (event) => {
    if( event.key === 'Enter') {
        if(_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value.trim()==='') {
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
async function bindPrimarySearch(_$w, allvaluesobjects) {

    loadPrimarySearchRepeater(_$w);

    await handleSearchInput(_$w, allvaluesobjects);

    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.RESULTS_CONTAINER).onMouseOut(async () => {
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.RESULTS_CONTAINER).collapse();
    });
    
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

async function loadCategoriesListPrimarySearch(_$w, allvaluesobjects) {
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_MULTI_BOX).changeState("categoryResults");
    
    let categoryValues=[]
    for(const value of allvaluesobjects) {
      if(value.customField === CATEGORY_CUSTOM_FIELD_ID_IN_CMS) {
        categoryValues.push({title: value.title+` (${value.count})` , _id: value.valueId});
      }
    }
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.CATEGORY_RESULTS_REPEATER).data = categoryValues;
    }
    
async function queryPrimarySearchResults(_$w, query) {
    if(query === undefined || query === '') {
        _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_MULTI_BOX).changeState("categoryResults");
        return false;
    }

    const searchByTitle = [{field: 'title', searchTerm: query}];
    const searchByCity = [{field: 'location.fullLocation', searchTerm: query}];

    let filter = await getFilter(searchByTitle);

    await _$w('#jobsDataset').setFilter(filter);
    await _$w('#jobsDataset').refresh();

    let count = _$w('#jobsDataset').getTotalCount();

    if( count > 0 ) {
        _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.RESULTS_CONTAINER).expand();
        _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_MULTI_BOX).changeState("jobResults");
    }
    else {
        filter = await getFilter(searchByCity);
        await _$w('#jobsDataset').setFilter(filter);
        await _$w('#jobsDataset').refresh();

        count = _$w('#jobsDataset').getTotalCount();
        if  (count > 0) {
        _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.RESULTS_CONTAINER).expand();
        _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_MULTI_BOX).changeState("jobResults");
        }
        else{
        _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_MULTI_BOX).changeState("noResults");
        }
}

return count > 0;
}

module.exports = {
  loadPrimarySearchRepeater,
  bindPrimarySearch,
  queryPrimarySearchResults,
  handlePrimarySearch,
}
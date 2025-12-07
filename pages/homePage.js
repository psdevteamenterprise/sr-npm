const { debounce, getFilter } = require('../public/filterUtils');
const { handleOnLocationClick } = require('../public/mapUtils');
const { filterBrokenMarkers } = require('../public/utils');
const { location } = require('@wix/site-location');
const {wixData} = require('wix-data');
const { COLLECTIONS } = require('../backend/collectionConsts');
const { getAllRecords } = require('./pagesUtils');
const { handlePrimarySearch } = require('../public/primarySearchUtils');
const { GLOBAL_SECTIONS_SELECTORS } = require('../public/selectors');
const { isElementExistOnPage } = require('psdev-utils');

let thisObjectVar;
let searchByCityFlag=false;
let loadedCategories=false;

async function homePageOnReady(_$w,thisObject = null) {
    const queryResult = await wixData.query(COLLECTIONS.SITE_CONFIGS).find();
    const siteconfig = queryResult.items[0];


    if(siteconfig.twg) {
        const allvaluesobjects  = await getAllRecords(COLLECTIONS.CUSTOM_VALUES);
        handlePrimarySearch(_$w, allvaluesobjects);
        console.log("siteconfig.twg: ",siteconfig.twg);

        if(siteconfig.twg === "external") {
            bindTeamRepeater(_$w)
            bindViewAllButton(_$w)
        }
    }
    else{
        thisObjectVar = thisObject;
        bind(_$w);
        init(_$w);
    }
    
}

function bind(_$w) {
    bindTeamRepeater(_$w);

    _$w('#citiesDataset').onReady(async () => {
        const numOfItems = await _$w('#citiesDataset').getTotalCount();
        const items = await _$w('#citiesDataset').getItems(0, numOfItems);
        let baseUrl = await location.baseUrl();
        const markers = filterBrokenMarkers(items.items).map(item => {
            const location = item.locationAddress.location;
            const cityName = encodeURIComponent(item.title); // Use the city name from the item
            const cityLinkUrl = `${baseUrl}/positions?location=${cityName}`; // Add city as search parameter
            return {
                location: {
                    latitude: location.latitude,
                    longitude: location.longitude
                },
                address: item.locationAddress.formatted,
                title: item.title,
                link: cityLinkUrl,
                linkTitle:`View ${item.count} Open Positions`
            };
        });
        //@ts-ignore
        _$w('#googleMaps').setMarkers(markers);
    });
}

function bindTeamRepeater(_$w) {
    _$w('#teamRepeater').onItemReady(($item, itemData) => {
        $item('#teamButton').label = `View ${itemData.count} Open Positions`;
       // const department = encodeURIComponent(itemData.title);
        // if (itemData.customField) {
        //     [$item('#teamButton'), $item('#teamButton2')].forEach(btn => {
        //         btn.onClick(() => {
        //             location.to(`/search?category=${department}`);
        //         });
        //     });

        // }
        // else{
        //     $item('#teamButton').onClick(()=>{
        //         location.to(`/positions?department=${department}`);
        //     });
        // }
    });
    
    _$w("#teamRepeaterItem").onClick((event) => {
       
            const $item = _$w.at(event.context);
            
            if(isElementExistOnPage(_$w("#categoriesDataset"))) {
                const clickedItemData = $item("#categoriesDataset").getCurrentItem();
                const department = encodeURIComponent(clickedItemData.title);
                location.to(`/search?category=${department}`);
            }      
            else
            {
                const clickedItemData =  $item("#dataset1").getCurrentItem()
                const department = encodeURIComponent(clickedItemData.title);
                location.to(`/positions?department=${department}`);
            } 
      });


}

function bindViewAllButton(_$w) {
    _$w('#viewAllCategoriesButton').onClick(()=>{
        if(!loadedCategories) {
            loadedCategories=true;
            _$w('#viewAllCategoriesButton').label = "View Less";
            _$w("#categoriesDataset").loadMore();
        }
        else{
            loadedCategories=false;
            _$w('#viewAllCategoriesButton').label = "View All";
            _$w("#categoriesDataset").loadPage(1);
        }
    });
}




function init(_$w) {
    const debouncedInput = debounce(() => handleSearchInput(_$w), 400, thisObjectVar);

    _$w('#searchInput').onInput(debouncedInput);
    _$w('#searchInput').maxLength = 40;
    _$w('#searchButton').onClick(() => handleSearch(_$w('#searchInput').value));

    _$w('#searchInput').onKeyPress((event) => {
        if (event.key === 'Enter') {
            handleSearch(_$w('#searchInput').value);
        }
    });

    _$w('#searchInput').onFocus(() => {
        if (_$w(`#resultsContainer`).collapsed) {
            _$w(`#resultsContainer`).expand();
        }
    });

    _$w('#searchInput').onBlur(() => {
        setTimeout(() => {
            if (!_$w(`#resultsContainer`).collapsed) {
                _$w(`#resultsContainer`).collapse();
            }
        }, 250);
    });

    _$w('#locationItem').onClick((event)=>{
        handleOnLocationClick(event, '#locationsRepeater', '#googleMaps', _$w);
    });
}

async function handleSearchInput(_$w) {
    let searchInput;
    let count;

    searchInput = _$w('#searchInput').value;
    const trimmedInput = searchInput.trim();
    const searchByTitle=[{field: 'title', searchTerm: trimmedInput}];
    const searchByCity=[{field: 'cityText', searchTerm: trimmedInput}];

    
    let filter = await getFilter(searchByTitle);

    await _$w(GLOBAL_SECTIONS_SELECTORS.JOBS_DATASET).setFilter(filter);
    await _$w(GLOBAL_SECTIONS_SELECTORS.JOBS_DATASET).refresh();

    count = _$w(GLOBAL_SECTIONS_SELECTORS.JOBS_DATASET).getTotalCount();

    if (count > 0) {
        searchByCityFlag = false;
        _$w('#resultsContainer').expand();
        _$w('#searchMultiStateBox').changeState('results');
    } else {    
        filter = await getFilter(searchByCity);
        await _$w(GLOBAL_SECTIONS_SELECTORS.JOBS_DATASET).setFilter(filter);
        await _$w(GLOBAL_SECTIONS_SELECTORS.JOBS_DATASET).refresh();
        count = _$w(GLOBAL_SECTIONS_SELECTORS.JOBS_DATASET).getTotalCount();
        if( count > 0 )
        {
            searchByCityFlag = true;
            _$w('#resultsContainer').expand();
            _$w('#searchMultiStateBox').changeState('results');
        }
        else{
            searchByCityFlag=false;
            _$w('#searchMultiStateBox').changeState('noResults');
        }
    }
}

function handleSearch(searchInput) {
    const trimmedInput = searchInput.trim();
    if (trimmedInput) {
        if(searchByCityFlag){
            location.to(`/positions?location=${trimmedInput}`);
        }
        else{
            location.to(`/positions?keyWord=${trimmedInput}`);
        }
    }
}


module.exports = {
    homePageOnReady,
  };
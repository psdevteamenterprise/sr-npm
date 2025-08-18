const {
    debounce,
    getFilter,
  } = require('../public/filterUtils');
  const { handleOnLocationClick } = require('../public/mapUtils');
  const { filterBrokenMarkers } = require('../public/utils');
const { location } = require('@wix/site-location');
let thisObjectVar;
let searchByCityFlag=false;
async function homePageOnReady(_$w,thisObject) {
    thisObjectVar=thisObject;
    await bind(_$w);
    await init(_$w);
    
  }

  function bind(_$w) {
    _$w('#teamRepeater').onItemReady(($item, itemData) => {
        $item('#teamButton').label = `View ${itemData.count} Open Positions`;
        $item('#teamButton').onClick(()=>{
            const department = encodeURIComponent(itemData.title);
            location.to(`/positions?department=${department}`);
        });
    });

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

function init(_$w) {
    const debouncedInput = debounce(()=>handleSearchInput(_$w), 400,thisObjectVar);

    _$w('#searchInput').onInput(debouncedInput);
    _$w('#searchInput').maxLength = 40;
    _$w('#searchButton').onClick(()=>handleSearch(_$w('#searchInput').value));

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

    // const fieldsToSearch = [
    //     { field: 'title', searchTerm: trimmedInput }, 
    //     { field: 'cityText', searchTerm: trimmedInput }
    // ];
    
    let filter = await getFilter(searchByTitle);

    await _$w('#jobsDataset').setFilter(filter);
    await _$w('#jobsDataset').refresh();

    count = _$w('#jobsDataset').getTotalCount();

    if (count > 0) {
        searchByCityFlag=false;
        _$w('#resultsContainer').expand();
        _$w('#searchMultiStateBox').changeState('results');
    } else {    
        filter=await getFilter(searchByCity);
        await _$w('#jobsDataset').setFilter(filter);
        await _$w('#jobsDataset').refresh();
        count = _$w('#jobsDataset').getTotalCount();
        if(count > 0)
        {
            searchByCityFlag=true;
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
        if(searchByCity){
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
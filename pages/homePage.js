const {
    debounce,
    getFilter,
  } = require('../public/filterUtils');
  const { handleOnLocationClick } = require('../public/mapUtils');
const { location } = require('@wix/site-location');
let thisObjectVar;
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
        const linkUrl = `${baseUrl}/positions`;
        console.log("items#@#@$$#@#$$$#######");
        const markers = items.items.map(item => {
            const location = item.locationAddress.location;
            const cityName = encodeURIComponent(item.title); // Use the city name from the item
            const cityLinkUrl = `${linkUrl}?keyWord=${cityName}`; // Add city as search parameter
            return {
                location: {
                    latitude: location.latitude,
                    longitude: location.longitude
                },
                 address: item.locationAddress.formatted,
                description: `View ${item.count} Open Positions`,
                title: item.title, // Show the actual city name in title
                linkUrl: cityLinkUrl
            };
        });
        //@ts-ignore
        _$w('#googleMaps').setMarkers(markers);
    });
    _$w('#googleMaps').onClick((event) => {
        console.log("event: ", event);
        // if (event.marker && event.marker.linkUrl) {
        //     location.to(event.marker.linkUrl);
        // }
    });
}

function init(_$w) {
    const debouncedInput = debounce(()=>handleSearchInput(_$w), 400,thisObjectVar);

    _$w('#searchInput').onInput(debouncedInput);
    _$w('#searchInput').maxLength = 40;
    _$w('#searchButton').onClick(()=>{
        const trimmedInput = _$w('#searchInput').value.trim();
        if (trimmedInput) {
            location.to(`/positions?keyWord=${trimmedInput}`);
        }
    });

    _$w('#searchInput').onKeyPress((event) => {
        if (event.key === 'Enter') {
            handleEnterPress(_$w('#searchInput').value);
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

    const fieldsToSearch = [
        { field: 'title', searchTerm: trimmedInput }, 
        { field: 'cityText', searchTerm: trimmedInput }
    ];
    
    const filter = await getFilter(fieldsToSearch, 'or');

    await _$w('#jobsDataset').setFilter(filter);
    await _$w('#jobsDataset').refresh();

    count = _$w('#jobsDataset').getTotalCount();

    if (count > 0) {
        _$w('#resultsContainer').expand();
        _$w('#searchMultiStateBox').changeState('results');
    } else {
        _$w('#searchMultiStateBox').changeState('noResults');
    }
}

function handleEnterPress(searchInput) {
    const trimmedInput = searchInput.trim();
    
    if (trimmedInput) {
        location.to(`/positions?keyWord=${trimmedInput}`);
    }
}

module.exports = {
    homePageOnReady,
  };
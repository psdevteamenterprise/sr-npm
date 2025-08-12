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
            console.log("teamButton clicked@@@@@", itemData.title);
            const department = encodeURIComponent(itemData.title);
            console.log("department##########", department);
            
            location.to(`/positions?department=${department}`);
        });
    });

    _$w('#citiesDataset').onReady(async () => {
        const numOfItems = await _$w('#citiesDataset').getTotalCount();
        const items = await _$w('#citiesDataset').getItems(0, numOfItems);
        let baseUrl = await location.baseUrl();
        const linkUrl = `${baseUrl}/positions`;

        const markers = items.items.map(item => {
            const location = item.locationAddress.location;
            return {
                location: {
                    latitude: location.latitude,
                    longitude: location.longitude
                },
                address: item.locationAddress.formatted,
                description: `<a href=${linkUrl} target="_parent" rel="noopener noreferrer" style="color:#000000;text-decoration:underline;font-weight:bold;">View ${item.count} Open Positions</a>`
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
const { getAllPositions } = require('../backend/queries');
//const { items: wixData } = require('@wix/data');
const {wixData} = require('wix-data');
const { window } = require('@wix/site-window');
//const { location,queryParams } = require('@wix/site-location');
const { query,queryParams,to } = require("wix-location-frontend");
const {
    debounce,
    getFilter,
  } = require('../public/filterUtils');

  let currentLoadedItems =100;
  const itemsPerPage = 100;
  let allJobs=[]
  const RESET_ALL = 'RESET_ALL';
  let pageParamSet=0;
  let thisObjectVar;




async function careersPageOnReady(_$w,thisObject) {
 
thisObjectVar=thisObject;
allJobs=await getAllPositions();
await handleUrlParams(_$w);
await activateAutoLoad(_$w);
await bind(_$w);
await init(_$w);

}

  
function activateAutoLoad(_$w)
{
    _$w("#jobsDataset").onReady(() => {
        updateCount(_$w);
        _$w("#section2").onViewportEnter(() => {
            if (currentLoadedItems<_$w("#jobsDataset").getTotalCount()) {
                loadMoreJobs(_$w);  
            }   
            else {
                console.log("no more jobs")
            }        
        });
    });  
}

async function loadMoreJobs(_$w) {
    //const query = await location.query();
    let shouldLoad = false;
    if (pageParamSet == 0) {
        shouldLoad = true;
    } else if (query.page % 2 == pageParamSet % 2) {
        shouldLoad = true;
    } else {
        pageParamSet = Number(pageParamSet) + 1;
    }
    if (shouldLoad) {
        _$w("#jobsDataset").loadMore();
        console.log("loading more jobs");
        currentLoadedItems = currentLoadedItems + itemsPerPage;
        const data = _$w("#positionsRepeater").data;
        console.log("data length is :    ", data.length);
        setPageParamInUrl();
    }
}


async function setPageParamInUrl() {
    query.page ? queryParams.add({ page: Number(query.page) + 1 }) : queryParams.add({ page: 2 });
}
async function handleUrlParams(_$w) {
   // const query = await location.query();
    if (query.keyWord) {
        await handleKeyWordParam(_$w,query.keyWord);
    }
    if (query.page) {
        await handlePageParam(_$w,query.page);
        
    }
}

async function handleKeyWordParam(_$w,keyWord) {
    _$w('#searchInput').value = keyWord;
    //const filter = await wixData.query("Jobs").contains("title", keyWord);
    await $w("#jobsDataset").setFilter(wixData.filter().contains("title", keyWord));
    await _$w("#jobsDataset").refresh();
}

async function handlePageParam(_$w,page) {
    
    if(allJobs.length/itemsPerPage<page){
        console.log(`max page is: ${allJobs.length/itemsPerPage}`)
        queryParams.add({ page: allJobs.length/itemsPerPage }) 
    }
    if(page<=1){
        console.log("min page is  : 2")
        pageParamSet=2;
        queryParams.add({ page: 2 })
    }
    if (page) {   
        pageParamSet=page;
        //scrolls a bit to load the dataset data
        await window.scrollTo(0, 200,{scrollAnimation:false});
        for (let i = 2; i <= page; i++) {
           await _$w("#jobsDataset").loadMore();
            currentLoadedItems=currentLoadedItems+itemsPerPage
        }
        // the timeout is to wait for the repeater to render, then scroll to the last item.
            setTimeout(() => {
            const data = _$w("#positionsRepeater").data;
            if (data && data.length > 0) {
                //the dataset each time it loads 100 items
                const lastIndex = data.length - itemsPerPage;
                _$w("#positionsRepeater").forEachItem(async ($item, itemData, index) => {
                    if (index === lastIndex) {
                        await $item("#positionItem").scrollTo();
                        console.log("finishied scrolling inside handlePageParam")
                    }
                });
            }
        }, 200); 
        }
    
}

async function bind(_$w) {
	await _$w('#jobsDataset').onReady(async () => {
		await updateCount(_$w);
		
	});

	if (await window.formFactor === "Mobile") {
		_$w('#dropdownsContainer').collapse();
    } 

	_$w('#positionsRepeater').onItemReady(async ($item, itemData) => {
		$item('#positionItem').onClick(() => {
			to(`${itemData['link-jobs-title']}`);
		});
	});
}

function init(_$w) {
    const debouncedSearch = debounce(()=>applyFilters(_$w), 400,thisObjectVar);
    
    _$w('#searchInput').onInput(debouncedSearch);
    _$w('#dropdownDepartment, #dropdownLocation, #dropdownJobType').onChange(()=>applyFilters(_$w));
	_$w('#resetFiltersButton, #clearSearch').onClick(()=>resetFilters(_$w));

	_$w('#openFiltersButton').onClick(()=>{
		_$w('#dropdownsContainer, #closeFiltersButton').expand();
	});

	_$w('#closeFiltersButton').onClick(()=>{
		_$w('#dropdownsContainer, #closeFiltersButton').collapse();
	});
}

async function applyFilters(_$w) {

	const dropdownFiltersMapping = [
		{ elementId: '#dropdownDepartment', field: 'department', value: _$w('#dropdownDepartment').value },
		{ elementId: '#dropdownLocation', field: 'cityText', value: _$w('#dropdownLocation').value },
		{ elementId: '#dropdownJobType', field: 'remote', value: _$w('#dropdownJobType').value},
		{ elementId: '#searchInput', field: 'title', value: _$w('#searchInput').value }
		];

	let filters = [];
	let value;
	
	dropdownFiltersMapping.forEach(filter => {
		// Handle RESET_ALL values
		if (filter.value === RESET_ALL) {
			_$w(filter.elementId).value = '';
			filter.value = '';
		}

		// build filters
		if (filter.value && filter.value.trim() !== '') {
      if(filter.field === 'title'){
         queryParams.add({ keyWord: filter.value });
      }
			if(filter.field === 'remote') {	
				value = filter.value === 'true';
			} else {
				value = filter.value;
			}
			filters.push({ field: filter.field, searchTerm: value });
		}
    else{
        queryParams.remove(["keyWord" ]);
    }
	});
	
	const filter = await getFilter(filters, 'and');
	
    await _$w('#jobsDataset').setFilter(filter);
    await _$w('#jobsDataset').refresh();
    
	const count = await updateCount();
    
    count ? _$w('#resultsMultiState').changeState('results') : _$w('#resultsMultiState').changeState('noResults');
    
    // Update reset button state
	const hasActiveFilters = filters.length > 0;
	hasActiveFilters? _$w('#resetFiltersButton').enable() : _$w('#resetFiltersButton').disable();
}

async function resetFilters(_$w) {
	_$w('#searchInput, #dropdownDepartment, #dropdownLocation, #dropdownJobType').value = '';

    await _$w('#jobsDataset').setFilter(wixData.filter());
    await _$w('#jobsDataset').refresh();

	_$w('#resultsMultiState').changeState('results');

	_$w('#resetFiltersButton').disable();

	await updateCount(_$w);
}

async function updateCount(_$w) {
	const count = await _$w('#jobsDataset').getTotalCount();
    _$w('#numOfPositionText').text = `Showing ${count} Open Positions`;

	return count;
}




module.exports = {
    careersPageOnReady,
  };
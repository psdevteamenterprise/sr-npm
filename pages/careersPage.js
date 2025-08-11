const { getAllPositions } = require('../backend/queries');
const {wixData} = require('wix-data');
const { window } = require('@wix/site-window');
const { query,queryParams,to,url } = require("wix-location-frontend");
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
  let queryPageVar;
  let queryKeyWordVar;
  let queryDepartmentVar;

async function careersPageOnReady(_$w,thisObject,query) {
queryPageVar=query.page;
queryKeyWordVar=query.keyWord;
queryDepartmentVar=query.department;
console.log("query", query);
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
    if(queryPageVar){
        queryParams.add({ page: Number(queryPageVar) + 1 })
        queryPageVar=Number(queryPageVar) + 1
    }
    else{
        queryParams.add({ page: 2 })
        queryPageVar=2
    }

   
}
async function handleUrlParams(_$w) {
   // const query = await location.query();
    if (queryKeyWordVar) {
        await handleKeyWordParam(_$w,queryKeyWordVar);
    }
    if (queryPageVar) {
        await handlePageParam(_$w);    
    }
    if (queryDepartmentVar) {
        await handleDepartmentParam(_$w,queryDepartmentVar);
    }
}

async function handleKeyWordParam(_$w,keyWord) {
    _$w('#searchInput').value = keyWord;
    // Use applyFilters to maintain consistency instead of directly setting filter
    await applyFilters(_$w, true); // Skip URL update since we're handling initial URL params
}

async function handlePageParam(_$w) {
    
    if(allJobs.length/itemsPerPage<queryPageVar){
        console.log(`max page is: ${allJobs.length/itemsPerPage}`)
        queryParams.add({ page: allJobs.length/itemsPerPage }) 
    }
    if(queryPageVar<=1){
        console.log("min page is  : 2")
        pageParamSet=2;
        queryParams.add({ page: 2 })
    }
    if (queryPageVar) {   
        pageParamSet=queryPageVar;
        //scrolls a bit to load the dataset data
        await window.scrollTo(0, 200,{scrollAnimation:false});
        for (let i = 2; i <= queryPageVar; i++) {
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

async function applyFilters(_$w, skipUrlUpdate = false) {
    console.log("applyFilters");
    console.log("after applyFilters_$w('#dropdownDepartment').value", _$w('#dropdownDepartment').value);
	const dropdownFiltersMapping = [
		{ elementId: '#dropdownDepartment', field: 'department', value: _$w('#dropdownDepartment').value },
		{ elementId: '#dropdownLocation', field: 'cityText', value: _$w('#dropdownLocation').value },
		{ elementId: '#dropdownJobType', field: 'remote', value: _$w('#dropdownJobType').value},
		{ elementId: '#searchInput', field: 'title', value: _$w('#searchInput').value }
		];
    
        console.log("dropdownFiltersMapping:###### ", dropdownFiltersMapping);

	let filters = [];
	let value;
	
	dropdownFiltersMapping.forEach(filter => {
		// Handle RESET_ALL values
		if (filter.value === RESET_ALL) {
			_$w(filter.elementId).value = '';
			filter.value = '';
            if (!skipUrlUpdate) {
                queryParams.remove(["keyWord", "department","page"]);
            }
		}

		// build filters
		if (filter.value && filter.value.trim() !== '') {
            if (!skipUrlUpdate) {
                if(filter.field === 'title'){
                    queryParams.add({ keyWord: filter.value });
                }
                if(filter.field === 'department'){
                    queryParams.add({ department: filter.value });
                }
            }
			if(filter.field === 'remote') {	
				value = filter.value === 'true';
			} else {
				value = filter.value;
			}
			filters.push({ field: filter.field, searchTerm: value });
		}
    else{
        if (!skipUrlUpdate) {
            if(filter.field === 'title'){
                queryParams.remove(["keyWord" ]);
            }
            if(filter.field === 'department'){
                queryParams.remove(["department" ]);
            }
        }
    }
	});
	
	const filter = await getFilter(filters, 'and');
    await _$w('#jobsDataset').setFilter(filter);
    await _$w('#jobsDataset').refresh();
    
	const count = await updateCount(_$w);
    
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

    queryParams.remove(["keyWord", "department","page"]);

	await updateCount(_$w);
}

async function updateCount(_$w) {
	const count = await _$w('#jobsDataset').getTotalCount();
    _$w('#numOfPositionText').text = `Showing ${count} Open Positions`;

	return count;
}

async function handleDepartmentParam(_$w,department) {
    const departmentValue = department.replace('-', ' ');
    console.log("department inside handleDepartmentParam", departmentValue);
    
    // Debug: Check dropdown options
    
    console.log("after refresh");
    let dropdownOptions = _$w('#dropdownDepartment').options;
    console.log("dropdown options:", dropdownOptions);
    const optionsFromCMS=await wixData.query("AmountOfJobsPerDepartment").find();
    //+1 because of the "All" option

    if(dropdownOptions.length!==optionsFromCMS.items.length+1){
        dropdownOptions={
            label: "All",
            value: "RESET_ALL"
        }
        dropdownOptions.push(...optionsFromCMS.items.map(item=>({
            label: item.title,
            value: item.title
        })));
        console.warn("something is wrong with the dropdown options, fixing it");
    }

    
    // Try setting the value
    _$w('#dropdownDepartment').value = departmentValue;
    console.log("after setting, dropdown value:", _$w('#dropdownDepartment').value);
    
    console.log("before applyFilters_$w('#dropdownDepartment').value", _$w('#dropdownDepartment').value);

     await applyFilters(_$w, true); // Skip URL update since we're handling initial URL params
    // console.log("url", url);
    // await to(url);
}




module.exports = {
    careersPageOnReady,
  };
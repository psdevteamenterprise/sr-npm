const { getAllPositions } = require('../backend/queries');
const {wixData} = require('wix-data');
const { window } = require('@wix/site-window');
const { query,queryParams,onChange} = require("wix-location-frontend");
const { location } = require("@wix/site-location");

const {
    debounce,
    getFilter,
  } = require('../public/filterUtils');
  const { filterBrokenMarkers } = require('../public/utils');
  let currentLoadedItems =100;
  const itemsPerPage = 100;
  let allJobs=[]
  const RESET_ALL = 'RESET_ALL';
  let pageParamSet=0;
  let myQueryParams;
  let thisObjectVar;

  let searchInputBlurredFirstTime=true;
async function careersPageOnReady(_$w,thisObject,myQueryParams) {

myQueryParams=myQueryParams;
thisObjectVar=thisObject;
allJobs=await getAllPositions();
await activateAutoLoad(_$w);
await bind(_$w);
await init(_$w);
await handleUrlParams(_$w);

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
    if (myQueryParams.keyWord) {
        await handleKeyWordParam(_$w,myQueryParams.keyWord);
    }
    if (myQueryParams.page) {
        await handlePageParam(_$w);    
    }
    if (myQueryParams.department) {
        await handleDepartmentParam(_$w,myQueryParams.department);
    }
    if (myQueryParams.location) {
        await handleLocationParam(_$w,myQueryParams.location);
    }
    if (myQueryParams.jobType) {
        await handleJobTypeParam(_$w,myQueryParams.jobType);
    }
    await applyFilters(_$w, true); // Skip URL update since we're handling initial URL params
}

async function handleKeyWordParam(_$w,keyWord) {
    _$w('#searchInput').value = keyWord;
    // Use applyFilters to maintain consistency instead of directly setting filter

}

async function handlePageParam(_$w) {
    
    if(allJobs.length/itemsPerPage<myQueryParams.page){
        console.log(`max page is: ${allJobs.length/itemsPerPage}`)
        queryParams.add({ page: allJobs.length/itemsPerPage }) 
    }
    if(myQueryParams.page<=1){
        console.log("min page is  : 2")
        pageParamSet=2;
        queryParams.add({ page: 2 })
    }
    if (myQueryParams.page) {   
        pageParamSet=myQueryParams.page;
        //scrolls a bit to load the dataset data
        await window.scrollTo(0, 200,{scrollAnimation:false});
        for (let i = 2; i <= myQueryParams.page; i++) {
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
        await updateMapMarkers(_$w);
		
	});

	if (await window.formFactor() === "Mobile") {
		_$w('#dropdownsContainer').collapse();
    } 

}

function init(_$w) {
    const debouncedSearch = debounce(()=>applyFilters(_$w), 400,thisObjectVar);
    _$w('#searchInput').onInput(debouncedSearch);
    _$w('#searchInput').onBlur(()=>{
        if(searchInputBlurredFirstTime && _$w('#searchInput').value.trim() !== '')
        {
        _$w('#searchInput').focus();
        searchInputBlurredFirstTime=false;
        }
    });
    _$w('#dropdownDepartment, #dropdownLocation, #dropdownJobType').onChange(applyFilters(_$w));
	_$w('#resetFiltersButton, #clearSearch').onClick(()=>resetFilters(_$w));

	_$w('#openFiltersButton').onClick(()=>{
		_$w('#dropdownsContainer, #closeFiltersButton').expand();
	});

	_$w('#closeFiltersButton').onClick(()=>{
		_$w('#dropdownsContainer, #closeFiltersButton').collapse();
	});

    //URL onChange
    onChange(async ()=>{
       await handleBackAndForth(_$w);
    });




}


async function handleBackAndForth(_$w){
        const newQueryParams=await location.query();
        console.log("newQueryParams: ", newQueryParams);
        if(newQueryParams.department){
            myQueryParams.department=newQueryParams.department;
        }
        else{
            myQueryParams.department=undefined;
            deletedParam=true;
            _$w('#dropdownDepartment').value = '';
        }
        if(newQueryParams.location){
            myQueryParams.location=newQueryParams.location;
        }
        else{
            myQueryParams.location=undefined;
            deletedParam=true
            _$w('#dropdownLocation').value = '';
        }
        if(newQueryParams.keyWord){
            myQueryParams.keyWord=newQueryParams.keyWord;
        }
        else{
            myQueryParams.keyWord=undefined;
            deletedParam=true;
            _$w('#searchInput').value = '';
        }
        if(newQueryParams.jobType){
            myQueryParams.jobType=newQueryParams.jobType;
        }
        else{
            myQueryParams.jobType=undefined;
            deletedParam=true;
            _$w('#dropdownJobType').value = '';
        }
        await handleUrlParams(_$w);
        
}

async function applyFilters(_$w, skipUrlUpdate = false) {
    console.log("applying filters");
	const dropdownFiltersMapping = [
		{ elementId: '#dropdownDepartment', field: 'department', value: _$w('#dropdownDepartment').value },
		{ elementId: '#dropdownLocation', field: 'cityText', value: _$w('#dropdownLocation').value },
		{ elementId: '#dropdownJobType', field: 'remote', value: _$w('#dropdownJobType').value},
		{ elementId: '#searchInput', field: 'title', value: _$w('#searchInput').value }
		];
    console.log("dropdownFiltersMapping: ", dropdownFiltersMapping);
    


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
            if (!skipUrlUpdate) {
                if(filter.field === 'title'){
                    queryParams.add({ keyWord: filter.value });
                }
                if(filter.field === 'department'){
                    queryParams.add({ department: encodeURIComponent(filter.value) });
                }
                if(filter.field === 'cityText'){
                    queryParams.add({ location:  encodeURIComponent(filter.value) });
                }
                if(filter.field === 'remote'){
                    if(filter.value === 'true'){
                        queryParams.add({ jobType: encodeURIComponent("remote") });
                    }
                    else{
                        queryParams.add({ jobType: encodeURIComponent("onsite") });
                    }
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
                console.log("removing department from url")
                queryParams.remove(["department" ]);
            }
            if(filter.field === 'cityText'){
                console.log("removing location from url")
                queryParams.remove(["location" ]);
            }
            if(filter.field === 'remote'){
                console.log("removing jobType from url")
                queryParams.remove(["jobType" ]);
            }
        }
    }
	});
	
	const filter = await getFilter(filters, 'and');
    await _$w('#jobsDataset').setFilter(filter);
    await _$w('#jobsDataset').refresh();
    
	const count = await updateCount(_$w);
    console.log("updating map markers");
    await updateMapMarkers(_$w);
    console.log("updating map markers completed");
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

    queryParams.remove(["keyWord", "department","page","location"]);
    

	await updateCount(_$w);
    console.log("reseting map markers");
    await updateMapMarkers(_$w);
    console.log("reseting map markers completed");
}

async function updateCount(_$w) {
	const count = await _$w('#jobsDataset').getTotalCount();
    _$w('#numOfPositionText').text = `Showing ${count} Open Positions`;

	return count;
}

async function handleDepartmentParam(_$w,department) {
    const departmentValue = decodeURIComponent(department);
    
        
    
    let dropdownOptions = _$w('#dropdownDepartment').options;
    console.log("dropdown options:", dropdownOptions);
    const optionsFromCMS=await wixData.query("AmountOfJobsPerDepartment").find();
    //+1 because of the "All" option

    if(dropdownOptions.length!==optionsFromCMS.items.length+1){
        fixDropdownOptions('#dropdownDepartment',optionsFromCMS, _$w);
    }

    if (_$w('#dropdownDepartment').options.find(option => option.value === departmentValue))
    {
        console.log("department value found in dropdown options ",departmentValue);
        _$w('#dropdownDepartment').value = departmentValue;
    }
    else{
        console.warn("department value not found in dropdown options");
        queryParams.remove(["department" ]);

    }
    
    
     
}

function fixDropdownOptions(dropdown,optionsFromCMS, _$w){
    let dropdownOptions = [];
    dropdownOptions=[{
        label: "All",
        value: "RESET_ALL"
    }]
    dropdownOptions.push(...optionsFromCMS.items.map(item=>({
        label: item.title,
        value: item.title
    })));
    _$w(dropdown).options=dropdownOptions;
    console.warn("something is wrong with the dropdown options, fixing it");

}

async function handleLocationParam(_$w,location) {
    const locationValue = decodeURIComponent(location);
    let dropdownOptions = _$w('#dropdownLocation').options;
    console.log("location dropdown options:", dropdownOptions);
    const optionsFromCMS=await wixData.query("cities").find();
    //+1 because of the "All" option
    if(dropdownOptions.length!==optionsFromCMS.items.length+1){
        fixDropdownOptions('#dropdownLocation',optionsFromCMS, _$w);
    }
    
    const option=_$w('#dropdownLocation').options.find(option => option.value.toLowerCase() === locationValue.toLowerCase())

    if(option){
        _$w('#dropdownLocation').value = option.value;
    }
    else{
        console.warn("location value not found in dropdown options");
        queryParams.remove(["location"]);
    }
    
}

async function handleJobTypeParam(_$w,jobType) {
    const jobTypeValue = decodeURIComponent(jobType);
    let dropdownOptions = _$w('#dropdownJobType').options;
    console.log("jobType dropdown options:", dropdownOptions);
    const option=_$w('#dropdownJobType').options.find(option => option.value.toLowerCase() === jobTypeValue.toLowerCase())
    if(option){
        _$w('#dropdownJobType').value = option.value;
    }
    else{
        console.warn("jobType value not found in dropdown options");
        queryParams.remove(["jobType"]);
    }
}

async function updateMapMarkers(_$w){
    const numOfItems = await _$w('#jobsDataset').getTotalCount();
    const items = await _$w('#jobsDataset').getItems(0, numOfItems);
    const markers = filterBrokenMarkers(items.items).map(item => {
            const location = item.locationAddress.location;
            return {
                location: {
                    latitude: location.latitude,
                    longitude: location.longitude
                },
                address: item.locationAddress.formatted,
                title: item.title
            };
        });
    //@ts-ignore
    _$w('#googleMaps').setMarkers(markers);

}


module.exports = {
    careersPageOnReady,
  };
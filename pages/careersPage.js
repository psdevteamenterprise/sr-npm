const { getAllPositions } = require('../backend/queries');
const {wixData} = require('wix-data');
const { window } = require('@wix/site-window');
const { query,queryParams,onChange} = require("wix-location-frontend");
const { location } = require("@wix/site-location");
const { COLLECTIONS } = require('../backend/collectionConsts');
const { careersMultiBoxesPageOnReady } = require('./careersMultiBoxesPage');
const { debounce, getFilter} = require('../public/filterUtils');
const { CAREERS_PAGE_SELECTORS, FILTER_FIELDS } = require('../public/selectors');
  const { filterBrokenMarkers } = require('../public/utils');
  
  let currentLoadedItems =100;
  const itemsPerPage = 100;
  let allJobs=[]
  const RESET_ALL = 'RESET_ALL';
  let pageParamSet=0;
  let thisObjectVar;
  let queryPageVar;
  let queryKeyWordVar;
  let queryDepartmentVar;
  let queryLocationVar;
  let queryJobTypeVar;
  let queryBrandVar;
  let searchInputBlurredFirstTime=true;
  let siteconfig;

async function careersPageOnReady(_$w,thisObject=null,queryParams=null) {
    if(siteconfig===undefined) {
        const queryResult = await wixData.query(COLLECTIONS.SITE_CONFIGS).find();
        siteconfig = queryResult.items[0];
    }

    if(siteconfig.customFields==="true") {
        await careersMultiBoxesPageOnReady(_$w,queryParams);
    }
    else{
        console.log("queryParams: ", queryParams);
        const { page, keyWord, department, location,jobType,brand } = queryParams;
        queryPageVar=page;
        queryKeyWordVar=keyWord;
        queryDepartmentVar=department;
        queryLocationVar=location;
        queryJobTypeVar=jobType;
        queryBrandVar=brand;
        thisObjectVar=thisObject;
        allJobs = await getAllPositions();

        activateAutoLoad(_$w);
        await bind(_$w);
        init(_$w);
        await handleBrandDropdown(_$w);
        await handleUrlParams(_$w);

    }


}
  
function activateAutoLoad(_$w)
{
    _$w(CAREERS_PAGE_SELECTORS.JOBS_DATASET).onReady(() => {
        updateCount(_$w);
        _$w(CAREERS_PAGE_SELECTORS.FOOTER).onViewportEnter(() => {
            if (currentLoadedItems<_$w(CAREERS_PAGE_SELECTORS.JOBS_DATASET).getTotalCount()) {
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
        _$w(CAREERS_PAGE_SELECTORS.JOBS_DATASET).loadMore();
        console.log("loading more jobs");

        currentLoadedItems = currentLoadedItems + itemsPerPage;
        const data = _$w(CAREERS_PAGE_SELECTORS.POSITIONS_REPEATER).data;

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
    if (queryKeyWordVar) {
        await handleKeyWordParam(_$w,queryKeyWordVar);
    }
    if (queryBrandVar && _$w(CAREERS_PAGE_SELECTORS.DROPDOWN_BRAND).isVisible) { //if it is not visible, ignore it
        await handleBrandParam(_$w,queryBrandVar);
    }
    if (queryPageVar) {
        await handlePageParam(_$w);    
    }
    if (queryDepartmentVar) {
        await handleDepartmentParam(_$w,queryDepartmentVar);
    }
    if (queryLocationVar) {
        await handleLocationParam(_$w,queryLocationVar);
    }
    if (queryJobTypeVar) {
        await handleJobTypeParam(_$w,queryJobTypeVar);
    }
    await applyFilters(_$w, true); // Skip URL update since we're handling initial URL params
}

async function handleKeyWordParam(_$w,keyWord) {
    _$w(CAREERS_PAGE_SELECTORS.SEARCH_INPUT).value = keyWord;
    // Use applyFilters to maintain consistency instead of directly setting filter
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
           await _$w(CAREERS_PAGE_SELECTORS.JOBS_DATASET).loadMore();
            currentLoadedItems=currentLoadedItems+itemsPerPage
        }
        // the timeout is to wait for the repeater to render, then scroll to the last item.
            setTimeout(() => {
            const data = _$w(CAREERS_PAGE_SELECTORS.POSITIONS_REPEATER).data;
            if (data && data.length > 0) {
                //the dataset each time it loads 100 items
                const lastIndex = data.length - itemsPerPage;
                _$w(CAREERS_PAGE_SELECTORS.POSITIONS_REPEATER).forEachItem(async ($item, itemData, index) => {
                    if (index === lastIndex) {
                        await $item(CAREERS_PAGE_SELECTORS.POSITION_ITEM).scrollTo();
                        console.log("finishied scrolling inside handlePageParam")
                    }
                });
            }
        }, 200); 
        }
    
}

async function bind(_$w) {
	await _$w(CAREERS_PAGE_SELECTORS.JOBS_DATASET).onReady(async () => {
		await updateCount(_$w);
        await updateMapMarkers(_$w);
		
	});

	if (await window.formFactor() === "Mobile") {
		_$w(CAREERS_PAGE_SELECTORS.DROPDOWN_CONTAINER).collapse();
    } 

}

function init(_$w) {
    const debouncedSearch = debounce(()=>applyFilters(_$w), 400,thisObjectVar);
    _$w(CAREERS_PAGE_SELECTORS.SEARCH_INPUT).onInput(debouncedSearch);
    _$w(CAREERS_PAGE_SELECTORS.SEARCH_INPUT).onBlur(()=>{
        if(searchInputBlurredFirstTime && _$w(CAREERS_PAGE_SELECTORS.SEARCH_INPUT).value.trim() !== '')
        {
        _$w(CAREERS_PAGE_SELECTORS.SEARCH_INPUT).focus();
        searchInputBlurredFirstTime=false;
        }
    });
    _$w(CAREERS_PAGE_SELECTORS.DROPDOWN_DEPARTMENT, CAREERS_PAGE_SELECTORS.DROPDOWN_LOCATION, CAREERS_PAGE_SELECTORS.DROPDOWN_JOB_TYPE, CAREERS_PAGE_SELECTORS.DROPDOWN_BRAND).onChange(()=>{
        console.log("dropdown onChange is triggered");
        applyFilters(_$w);
    });
	_$w(CAREERS_PAGE_SELECTORS.RESET_FILTERS_BUTTON, CAREERS_PAGE_SELECTORS.CLEAR_SEARCH).onClick(()=>resetFilters(_$w));

	_$w(CAREERS_PAGE_SELECTORS.OPEN_FILTERS_BUTTON).onClick(()=>{
		_$w(CAREERS_PAGE_SELECTORS.DROPDOWN_CONTAINER, CAREERS_PAGE_SELECTORS.CLOSE_FILTERS_BUTTON).expand();
	});

	_$w(CAREERS_PAGE_SELECTORS.CLOSE_FILTERS_BUTTON).onClick(()=>{
		_$w(CAREERS_PAGE_SELECTORS.DROPDOWN_CONTAINER, CAREERS_PAGE_SELECTORS.CLOSE_FILTERS_BUTTON).collapse();
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
            queryDepartmentVar=newQueryParams.department;
        }
        else{
            queryDepartmentVar=undefined;
            _$w(CAREERS_PAGE_SELECTORS.DROPDOWN_DEPARTMENT).value = '';
        }
        if(newQueryParams.location){
            queryLocationVar=newQueryParams.location;
        }
        else{
            queryLocationVar=undefined;
            _$w(CAREERS_PAGE_SELECTORS.DROPDOWN_LOCATION).value = '';
        }
        if(newQueryParams.keyWord){
            queryKeyWordVar=newQueryParams.keyWord;
        }
        else{
            queryKeyWordVar=undefined;
            _$w(CAREERS_PAGE_SELECTORS.SEARCH_INPUT).value = '';
        }
        if(newQueryParams.jobType){
            queryJobTypeVar=newQueryParams.jobType;
        }
        else{
            queryJobTypeVar=undefined;
            _$w(CAREERS_PAGE_SELECTORS.DROPDOWN_JOB_TYPE).value = '';
        }
        if(_$w(CAREERS_PAGE_SELECTORS.DROPDOWN_BRAND).isVisible){
        if(newQueryParams.brand){
            queryBrandVar=newQueryParams.brand;
        }
        else{
            queryBrandVar=undefined;
            _$w(CAREERS_PAGE_SELECTORS.DROPDOWN_BRAND).value = '';
        }
    }
        await handleUrlParams(_$w);
        
}

async function applyFilters(_$w, skipUrlUpdate = false) {
    console.log("applying filters");
	const dropdownFiltersMapping = [
        { elementId: CAREERS_PAGE_SELECTORS.DROPDOWN_DEPARTMENT, field: 'department', value: _$w(CAREERS_PAGE_SELECTORS.DROPDOWN_DEPARTMENT).value },
		{ elementId: CAREERS_PAGE_SELECTORS.DROPDOWN_LOCATION, field: 'cityText', value: _$w(CAREERS_PAGE_SELECTORS.DROPDOWN_LOCATION).value },
		{ elementId: CAREERS_PAGE_SELECTORS.DROPDOWN_JOB_TYPE, field: 'remote', value: _$w(CAREERS_PAGE_SELECTORS.DROPDOWN_JOB_TYPE).value},
		{ elementId: CAREERS_PAGE_SELECTORS.DROPDOWN_BRAND, field: 'brand', value: _$w(CAREERS_PAGE_SELECTORS.DROPDOWN_BRAND).value},
		{ elementId: CAREERS_PAGE_SELECTORS.SEARCH_INPUT, field: 'title', value: _$w(CAREERS_PAGE_SELECTORS.SEARCH_INPUT).value }
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
                if(filter.field === FILTER_FIELDS.SEARCH){
                    queryParams.add({ keyWord: filter.value });
                }
                if(filter.field === FILTER_FIELDS.DEPARTMENT){
                    queryParams.add({ department: encodeURIComponent(filter.value) });
                }
                if(filter.field === FILTER_FIELDS.LOCATION){
                    queryParams.add({ location:  encodeURIComponent(filter.value) });
                }
                if(filter.field === FILTER_FIELDS.JOB_TYPE){
                    if(filter.value === 'true'){
                        queryParams.add({ jobType: encodeURIComponent("remote") });
                    }
                    else{
                        queryParams.add({ jobType: encodeURIComponent("onsite") });
                    }
                }
                if(filter.field === FILTER_FIELDS.BRAND){
                    queryParams.add({ brand: encodeURIComponent(filter.value) });
                }
            }
			if(filter.field === FILTER_FIELDS.JOB_TYPE) {	
				value = filter.value === 'true';
			} else {
				value = filter.value;
			}
			filters.push({ field: filter.field, searchTerm: value });
		}
    else{
        if (!skipUrlUpdate) {
            if(filter.field === FILTER_FIELDS.SEARCH){
                queryParams.remove(["keyWord" ]);
            }
            if(filter.field === FILTER_FIELDS.DEPARTMENT){
                console.log("removing department from url")
                queryParams.remove(["department" ]);
            }
            if(filter.field === FILTER_FIELDS.LOCATION){
                console.log("removing location from url")
                queryParams.remove(["location" ]);
            }
            if(filter.field === FILTER_FIELDS.JOB_TYPE){
                console.log("removing jobType from url")
                queryParams.remove(["jobType" ]);
            }
            if(filter.field === FILTER_FIELDS.BRAND){
                console.log("removing brand from url")
                queryParams.remove(["brand" ]);
            }
        }
    }
	});
	
	const filter = await getFilter(filters, 'and');
    await _$w(CAREERS_PAGE_SELECTORS.JOBS_DATASET).setFilter(filter);
    await _$w(CAREERS_PAGE_SELECTORS.JOBS_DATASET).refresh();
    
	const count = await updateCount(_$w);
    console.log("updating map markers");
    await updateMapMarkers(_$w);
    console.log("updating map markers completed");
    count ? _$w(CAREERS_PAGE_SELECTORS.RESULTS_MULTI_STATE).changeState('results') : _$w(CAREERS_PAGE_SELECTORS.RESULTS_MULTI_STATE).changeState('noResults');
    
    
    // Update reset button state
	const hasActiveFilters = filters.length > 0;
	hasActiveFilters? _$w(CAREERS_PAGE_SELECTORS.RESET_FILTERS_BUTTON).enable() : _$w(CAREERS_PAGE_SELECTORS.RESET_FILTERS_BUTTON).disable();
    
    
}

async function resetFilters(_$w) {
	_$w(CAREERS_PAGE_SELECTORS.SEARCH_INPUT, CAREERS_PAGE_SELECTORS.DROPDOWN_DEPARTMENT, CAREERS_PAGE_SELECTORS.DROPDOWN_LOCATION, CAREERS_PAGE_SELECTORS.DROPDOWN_JOB_TYPE, CAREERS_PAGE_SELECTORS.DROPDOWN_BRAND).value = '';

    await _$w(CAREERS_PAGE_SELECTORS.JOBS_DATASET).setFilter(wixData.filter());
    await _$w(CAREERS_PAGE_SELECTORS.JOBS_DATASET).refresh();

	_$w(CAREERS_PAGE_SELECTORS.RESULTS_MULTI_STATE).changeState('results');

	_$w(CAREERS_PAGE_SELECTORS.RESET_FILTERS_BUTTON).disable();

    queryParams.remove(["keyWord", "department","page","location","jobType","brand"]);
    

	await updateCount(_$w);
    console.log("reseting map markers");
    await updateMapMarkers(_$w);
    console.log("reseting map markers completed");
}

async function updateCount(_$w) {
	const count = await _$w(CAREERS_PAGE_SELECTORS.JOBS_DATASET).getTotalCount();
    _$w('#numOfPositionText').text = `Showing ${count} Open Positions`;

	return count;
}

async function handleDepartmentParam(_$w,department) {
    const departmentValue = decodeURIComponent(department);
    
        
    
    let dropdownOptions = _$w(CAREERS_PAGE_SELECTORS.DROPDOWN_DEPARTMENT).options;
    console.log("dropdown options:", dropdownOptions);
    const optionsFromCMS=await wixData.query("AmountOfJobsPerDepartment").find();
    //+1 because of the "All" option

    if(dropdownOptions.length!==optionsFromCMS.items.length+1){
        fixDropdownOptions(CAREERS_PAGE_SELECTORS.DROPDOWN_DEPARTMENT,optionsFromCMS, _$w);
    }

    if (_$w(CAREERS_PAGE_SELECTORS.DROPDOWN_DEPARTMENT).options.find(option => option.value === departmentValue))
    {
        console.log("department value found in dropdown options ",departmentValue);
        _$w(CAREERS_PAGE_SELECTORS.DROPDOWN_DEPARTMENT).value = departmentValue;
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
    let dropdownOptions = _$w(CAREERS_PAGE_SELECTORS.DROPDOWN_LOCATION).options;
    console.log("location dropdown options:", dropdownOptions);
    const optionsFromCMS=await wixData.query("cities").find();
    //+1 because of the "All" option
    if(dropdownOptions.length!==optionsFromCMS.items.length+1){
        fixDropdownOptions(CAREERS_PAGE_SELECTORS.DROPDOWN_LOCATION,optionsFromCMS, _$w);
    }
    
    const option=_$w(CAREERS_PAGE_SELECTORS.DROPDOWN_LOCATION).options.find(option => option.value.toLowerCase() === locationValue.toLowerCase())

    if(option){
        _$w(CAREERS_PAGE_SELECTORS.DROPDOWN_LOCATION).value = option.value;
    }
    else{
        console.warn("location value not found in dropdown options");
        queryParams.remove(["location"]);
    }
    
}

async function handleBrandParam(_$w,brand){
    const brandValue = decodeURIComponent(brand);
    let dropdownOptions = _$w(CAREERS_PAGE_SELECTORS.DROPDOWN_BRAND).options;
    console.log("brand dropdown options:", dropdownOptions);
    const optionsFromCMS=await wixData.query(COLLECTIONS.BRANDS).find();
    if(dropdownOptions.length!==optionsFromCMS.items.length+1){
        fixDropdownOptions(CAREERS_PAGE_SELECTORS.DROPDOWN_BRAND,optionsFromCMS, _$w);
    }
    const option=_$w(CAREERS_PAGE_SELECTORS.DROPDOWN_BRAND).options.find(option => option.value.toLowerCase() === brandValue.toLowerCase())
    if(option){
        _$w(CAREERS_PAGE_SELECTORS.DROPDOWN_BRAND).value = option.value;
    }
    else{
        console.warn("brand value not found in dropdown options");
        queryParams.remove(["brand"]);
    }
}

async function handleJobTypeParam(_$w,jobType) {
    const jobTypeValue = decodeURIComponent(jobType);
    let dropdownOptions = _$w(CAREERS_PAGE_SELECTORS.DROPDOWN_JOB_TYPE).options;
    console.log("jobType dropdown options:", dropdownOptions);
    let option;
    if(jobTypeValue.toLowerCase()==="remote"){
        option="true";
    }
    if(jobTypeValue.toLowerCase()==="onsite"){
        option="false";
    }
    if(option){
        _$w(CAREERS_PAGE_SELECTORS.DROPDOWN_JOB_TYPE).value = option;
    }
    else{
        console.warn("jobType value not found in dropdown options");
        queryParams.remove(["jobType"]);
    }
}

async function updateMapMarkers(_$w){
    const numOfItems = await _$w(CAREERS_PAGE_SELECTORS.JOBS_DATASET).getTotalCount();
    const items = await _$w(CAREERS_PAGE_SELECTORS.JOBS_DATASET).getItems(0, numOfItems);
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
    _$w(CAREERS_PAGE_SELECTORS.GOOGLE_MAPS).setMarkers(markers);

}

async function handleBrandDropdown(_$w){
    if(siteconfig.disableMultiBrand==="false"){
        const brands=await wixData.query(COLLECTIONS.BRANDS).find();
        if(brands.items.length>1){
            console.log("showing brand dropdown");
            _$w(CAREERS_PAGE_SELECTORS.DROPDOWN_BRAND).show();
        }
    }
    else{
        _$w(CAREERS_PAGE_SELECTORS.DROPDOWN_BRAND).hide();
    }
}  
module.exports = {
    careersPageOnReady,
  };
const { COLLECTIONS,CUSTOM_VALUES_COLLECTION_FIELDS,JOBS_COLLECTION_FIELDS } = require('../backend/collectionConsts');
const { CAREERS_PAGE_SELECTORS, GLOBAL_SECTIONS_SELECTORS } = require('../public/selectors');

const { window } = require('@wix/site-window');
const { queryParams,onChange} = require('wix-location-frontend');
const { location } = require("@wix/site-location");
const {
  CAREERS_MULTI_BOXES_PAGE_CONSTS,
  FiltersIds,
  fieldTitlesInCMS,
  possibleUrlParams,
  TWG_JOBS_COLLECTION_FIELDS
} = require('../backend/careersMultiBoxesPageIds');
const { groupValuesByField, 
        debounce, 
        getAllRecords, 
        getFieldById, 
        getFieldByTitle,
        getCorrectOption,
        getOptionIndexFromCheckBox,
        getAllDatasetItems 
      } = require('./pagesUtils');
const { handlePrimarySearch, queryPrimarySearchResults } = require('../public/primarySearchUtils');


let dontUpdateThisCheckBox;
const selectedByField = new Map(); // fieldId -> array of selected value IDs
const optionsByFieldId = new Map(); // fieldId -> [{label, value}] array of objects with label which is the valueLabel and value which is the valueId
const countsByFieldId = new Map(); // fieldId -> {valueId: count} map of counts for each valueId
let allfields=[] // all fields in the database
let alljobs=[] // all jobs in the database
let allvaluesobjects=[] // all values in the database
let cities=[] // all cities in the database
let valueToJobs={} // valueId -> array of jobIds
let currentJobs=[] // current jobs that are displayed in the jobs repeater
let allsecondarySearchJobs=[] // secondary search results that are displayed in the jobs repeater
let currentSecondarySearchJobs=[] // current secondary search results that are displayed in the jobs repeater
let secondarySearchIsFilled=false // whether the secondary search is filled with results
let keywordAllJobs; // all jobs that are displayed in the jobs repeater when the keyword is filled
let ActivateURLOnchange=true; // whether to activate the url onchange
let considerAllJobs=false; // whether to consider all jobs or not
let urlOnchangeIsActive=false
const pagination = {
  pageSize: 10,
  currentPage: 1,
};

async function careersMultiBoxesPageOnReady(_$w,urlParams) {
  //to handle back and forth , url changes
  onChange(async ()=>{
    urlOnchangeIsActive=true;
    await handleBackAndForth(_$w);
    urlOnchangeIsActive=false;

  });
  await loadData(_$w);
  await loadJobsRepeater(_$w); // if we remove the await here the job list will be flaky , it doesn't fill it properly
  handlePrimarySearch(_$w, allvaluesobjects);
  await loadFilters(_$w);
  loadSelectedValuesRepeater(_$w);
  bindSearchInput(_$w);
  loadPaginationButtons(_$w);

    await handleUrlParams(_$w, urlParams);
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.CLEAR_ALL_BUTTON_ID).onClick(async () => {
      await clearAll(_$w);
    });
    if (await window.formFactor() === "Mobile") {
      handleFilterInMobile(_$w);
  }
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.RESULTS_MULTI_STATE_BOX).changeState("results");
}

async function handleBackAndForth(_$w){
  if(ActivateURLOnchange) {
    const newQueryParams=await location.query();
      console.log("newQueryParams: ", newQueryParams);
      ActivateURLOnchange=false;
      await clearAll(_$w,true);
      await handleUrlParams(_$w,newQueryParams,true); 
      ActivateURLOnchange=true;
      

    }
    else{
      ActivateURLOnchange=true;
    }
}

async function clearAll(_$w,urlOnChange=false) {
    
    for(const field of allfields) {
      _$w(`#${FiltersIds[field.title]}CheckBox`).selectedIndices = [];
      _$w(`#${FiltersIds[field.title]}input`).value='';
    }
    selectedByField.clear();
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.SECONDARY_SEARCH_INPUT).value='';
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value='';
    secondarySearchIsFilled=false;
    currentJobs=alljobs;
    keywordAllJobs=undefined;
    if(!urlOnChange) {
      console.log("inside clearAll removing url params");
      ActivateURLOnchange=false;
      queryParams.remove(possibleUrlParams.concat(["keyword", "page"]));

      await updateJobsAndNumbersAndFilters(_$w,true);
    }
    
}

function handleFilterInMobile(_$w) {
  const searchResultsSelectors = [
      CAREERS_PAGE_SELECTORS.RESULT_BOX,
      CAREERS_PAGE_SELECTORS.PAGINATION_BTN, 
      CAREERS_PAGE_SELECTORS.HEAD_BTNS, 
      CAREERS_PAGE_SELECTORS.SELECTED_VALUES_REPEATER, 
      CAREERS_PAGE_SELECTORS.BUTTOM_TXT, 
      CAREERS_PAGE_SELECTORS.SECTION_24, 
      CAREERS_PAGE_SELECTORS.SECTION_3, 
      CAREERS_PAGE_SELECTORS.LINE_3,
      CAREERS_PAGE_SELECTORS.FILTER_ICON];
    
  const mobileFilterBoxSelectors = [
    CAREERS_PAGE_SELECTORS.FILTER_BOX,
    CAREERS_PAGE_SELECTORS.REFINE_SEARCH_BUTTON,
    CAREERS_PAGE_SELECTORS.EXIT_BUTTON,
  ];

  _$w(CAREERS_PAGE_SELECTORS.FILTER_ICON).onClick(()=>{
      mobileFilterBoxSelectors.forEach(selector => {
        _$w(selector).expand();
      });
      searchResultsSelectors.forEach(selector => {
          _$w(selector).collapse();
      });
  });

  const exitFilterBox = () => {
      mobileFilterBoxSelectors.forEach(selector => {
        _$w(selector).collapse();
      });
      searchResultsSelectors.forEach(selector => {
          _$w(selector).expand();
      });
  }

  _$w(CAREERS_PAGE_SELECTORS.EXIT_BUTTON).onClick(()=>{
      exitFilterBox();
  });

  _$w(CAREERS_PAGE_SELECTORS.REFINE_SEARCH_BUTTON).onClick(()=>{
      exitFilterBox();
  });

  //onmobile we should collapse the filter box and the refine search button by default 
  mobileFilterBoxSelectors.forEach(selector => {
    _$w(selector).collapse();
  });
}


async function handleUrlParams(_$w,urlParams,handleBackAndForth=false) {
  try { 
  let applyFiltering=false;
  let currentApplyFilterFlag=false;
  //apply this first to determine all jobs
  if(urlParams.keyword) {
    applyFiltering = await queryPrimarySearchResults(_$w, decodeURIComponent(urlParams.keyword));
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value = decodeURIComponent(urlParams.keyword);

    const items = await getAllDatasetItems(_$w, GLOBAL_SECTIONS_SELECTORS.JOBS_DATASET);

    currentJobs = items;   
    keywordAllJobs = items;
  }
  
  for (const url of possibleUrlParams)
  {
    if(urlParams[url])
    {
      currentApplyFilterFlag=await handleParams(_$w,url,urlParams[url])
      if(currentApplyFilterFlag) {
        applyFiltering=true;
      }
    }
    currentApplyFilterFlag=false;
  }

  if(applyFiltering || keywordAllJobs || handleBackAndForth) {
    await updateJobsAndNumbersAndFilters(_$w);
    
  }
  
    if(urlParams.page) {
      if(Number.isNaN(Number(urlParams.page)) || Number(urlParams.page)<=1 || Number(urlParams.page)>Math.ceil(currentJobs.length/pagination.pageSize)) {
        console.warn("page number is invalid, removing page from url");
        queryParams.remove(["page"]);
        return;
      }
        pagination.currentPage=Number(urlParams.page);
        //let paginationCurrentText=urlParams.page;
        let startSlicIndex=pagination.pageSize*(pagination.currentPage-1);
        let endSlicIndex=(pagination.pageSize)*(pagination.currentPage);
        if(Number(urlParams.page)==Math.ceil(currentJobs.length/pagination.pageSize)) {
         // paginationCurrentText=(paginationCurrentText-(pagination.pageSize-(currentJobs.length%pagination.pageSize))).toString();          
          endSlicIndex=currentJobs.length;
        }
        _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationCurrentText).text = urlParams.page
        const jobsFirstPage=currentJobs.slice(startSlicIndex,endSlicIndex);
        _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).data = jobsFirstPage;
        handlePaginationButtons(_$w);

      }
  } catch (error) {
    console.error('Failed to handle url params:', error);
  }
}

async function handleParams(_$w,param,values) {
  let applyFiltering=false;
  let valuesAsArray = values.split(',')
  valuesAsArray=valuesAsArray.filter(value=>value.trim()!=='');

  let selectedIndices=[];
  const field=getFieldByTitle(fieldTitlesInCMS[param],allfields);

  let existing = selectedByField.get(field._id) || [];
  for(const value of valuesAsArray) {
    
       const decodedValue = decodeURIComponent(value);
      const options = optionsByFieldId.get(field._id);
      const option = getCorrectOption(decodedValue, options, param);
    
      if(option) {
        const optionIndex = getOptionIndexFromCheckBox(_$w(`#${FiltersIds[field.title]}CheckBox`).options,option.value);
        selectedIndices.push(optionIndex);
        existing.push(option.value);
        applyFiltering = true;
        dontUpdateThisCheckBox = field._id;
      }
      else {
        console.warn(`${param} value not found in dropdown options`);
      }
    }

    selectedByField.set(field._id, existing);
    _$w(`#${FiltersIds[field.title]}CheckBox`).selectedIndices=selectedIndices;

    return applyFiltering;

}

 function loadPaginationButtons(_$w) {
  try {
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PAGE_BUTTON_NEXT).onClick(async () => {
      let nextPageJobs=currentJobs.slice(pagination.pageSize*pagination.currentPage,pagination.pageSize*(pagination.currentPage+1));
      
      pagination.currentPage++;
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationCurrentText).text = pagination.currentPage.toString();
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).data = nextPageJobs;
      handlePaginationButtons(_$w);
      await _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).scrollTo();
    });

    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PAGE_BUTTON_PREVIOUS).onClick(async () => {
      let previousPageJobs=currentJobs.slice(pagination.pageSize*(pagination.currentPage-2),pagination.pageSize*(pagination.currentPage-1));
      pagination.currentPage--;
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationCurrentText).text =   pagination.currentPage.toString();
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).data = previousPageJobs;
      handlePaginationButtons(_$w);
      await _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).scrollTo();
    });
  } catch (error) {
    console.error('Failed to load pagination buttons:', error);
  }
}

 function loadSelectedValuesRepeater(_$w) {
  try {
       _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.SELECTED_VALUES_REPEATER).onItemReady(($item, itemData) => {
        $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.SELECTED_VALUES_REPEATER_ITEM_LABEL).text = itemData.label || '';
        // Deselect this value from both the selected map and the multibox
          $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.DESELECT_BUTTON_ID).onClick(async () => {
            const currentQueryParams=await location.query();
            if(currentQueryParams.page)
            {
              queryParams.remove(["page"]);
            }
            const fieldId = itemData.fieldId;
            const valueId = itemData.valueId;
            dontUpdateThisCheckBox=fieldId;
            if (!fieldId || !valueId) return;
            const existing = selectedByField.get(fieldId) || [];
            const updated = existing.filter(v => v !== valueId);
            const field=getFieldById(fieldId,allfields);
            let fieldTitle=field.title.toLowerCase().replace(' ', '');
            fieldTitle==="brands"? fieldTitle="brand":fieldTitle;
            ActivateURLOnchange=false;
            const previousSelectedSize=selectedByField.size;
            if (updated.length) {
              selectedByField.set(fieldId, updated);

              
              queryParams.add({ [fieldTitle] : updated.map(val=>encodeURIComponent(val)).join(',') });
            } else {
              selectedByField.delete(fieldId);
              handleConsiderAllJobs(previousSelectedSize,selectedByField.size);
            
              queryParams.remove([fieldTitle ]);
            }

            const currentVals = _$w(`#${FiltersIds[field.title]}CheckBox`).value || [];
            const nextVals = currentVals.filter(v => v !== valueId);
            _$w(`#${FiltersIds[field.title]}CheckBox`).value = nextVals;
            await updateJobsAndNumbersAndFilters(_$w);
           
          });
    });
     updateSelectedValuesRepeater(_$w);
  } catch (error) {
    console.error('Failed to load selected values repeater:', error);
  }
}

async function loadData() {
  try {
    if(alljobs.length===0) {
        alljobs=await getAllRecords(COLLECTIONS.JOBS);
        currentJobs=alljobs;
      }
    if(Object.keys(valueToJobs).length === 0){
        allvaluesobjects = await getAllRecords(COLLECTIONS.CUSTOM_VALUES);
        for (const value of allvaluesobjects) {
            valueToJobs[value.valueId]= value.jobIds;
        }
    }
    if(allfields.length===0) {
        allfields = await getAllRecords(COLLECTIONS.CUSTOM_FIELDS);
        allfields.push({ _id:"Location", title:"Location" }); 
    }
  } catch (error) {
    console.error('Failed to load data:', error);
  }
}
async function loadJobsRepeater(_$w) {
  try {
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).onItemReady(($item, itemData) => {
      $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER_ITEM_TITLE).text = itemData.title;
      $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER_ITEM_TITLE).onClick(() => {
        location.to(itemData[TWG_JOBS_COLLECTION_FIELDS.LINK_JOBS_TITLE] || itemData[TWG_JOBS_COLLECTION_FIELDS.LINK_JOBS_REF_ID_SLUG]);
      });
      $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER_ITEM_LOCATION).text=itemData.location.fullLocation
      $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER_ITEM_EMPLOYMENT_TYPE).text=itemData.employmentType

    });

    const jobsFirstPage=alljobs.slice(0,pagination.pageSize);
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).data = jobsFirstPage;
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationCurrentText).text = "1"
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationTotalCountText).text = Math.ceil(currentJobs.length/pagination.pageSize).toString();
    updateTotalJobsCountText(_$w);
    handlePaginationButtons(_$w);
  } catch (error) {
    console.error('Failed to load jobs repeater:', error);
  }
}

  function updateTotalJobsCountText(_$w) {
    secondarySearchIsFilled? _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.TotalJobsCountText).text = `${currentSecondarySearchJobs.length} Jobs`:
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.TotalJobsCountText).text = `${currentJobs.length} Jobs`;
  }

  async function loadFilters(_$w) {
    try {
      // 1) Load all categories (fields)
      cities = await getAllRecords(COLLECTIONS.CITIES);
      for(const city of cities) {
        valueToJobs[city._id] = city.jobIds;
      }
      // 2) Load all values once and group them by referenced field
      let valuesByFieldId = groupValuesByField(allvaluesobjects, CUSTOM_VALUES_COLLECTION_FIELDS.CUSTOM_FIELD);
      valuesByFieldId.set("Location",cities)
          // Build CheckboxGroup options for this field  
      const counter={}
      for(const city of cities) {
        counter[city.city]=city.count
      }

      for(const [key, value] of valuesByFieldId) {
        const field = getFieldById(key,allfields);
        let originalOptions=[];
        if(key === "Location") {
          originalOptions = value.map(city=>({
              label: city.city,
              value: city._id
          }));
        }
        else{
            originalOptions = value
        }

        optionsByFieldId.set(key, originalOptions);

        for (const val of allvaluesobjects) {
          counter[val.title]=val.count
        }
        countsByFieldId.set(key, new Map(originalOptions.map(o => [o.value, counter[o.label]])));
        updateOptionsUI(_$w, field.title, field._id, ''); // no search query

        _$w(`#${FiltersIds[field.title]}CheckBox`).selectedIndices = []; // start empty
        _$w(`#${FiltersIds[field.title]}CheckBox`).onChange(async (ev) => {
          const currentQueryParams=await location.query();
          if(currentQueryParams.page)
          {
            //try instead of removing to add page = 1
            queryParams.remove(["page"]);
          }
          dontUpdateThisCheckBox=field._id;
        const selected = ev.target.value; // array of selected value IDs
        let fieldTitle=field.title.toLowerCase().replace(' ', '');
        fieldTitle==="brands"? fieldTitle="brand":fieldTitle;
        ActivateURLOnchange=false;
        const previousSelectedSize=selectedByField.size;

        if (selected && selected.length) {
          selectedByField.set(field._id, selected); 
 

          if(fieldTitle==="brand" || fieldTitle==="storename") {
            //in this case we need the label not valueid
            const valueLabels=getValueFromValueId(selected,value);
            queryParams.add({ [fieldTitle] : valueLabels.map(val=>encodeURIComponent(val)).join(',') });
          }
          else{
            queryParams.add({ [fieldTitle] : selected.map(val=>encodeURIComponent(val)).join(',') });
          }
          
        } else {
          selectedByField.delete(field._id); 
          handleConsiderAllJobs(previousSelectedSize,selectedByField.size);
          queryParams.remove([fieldTitle ]);
        }
       
        console.log("selectedByField: ",selectedByField)
        await updateJobsAndNumbersAndFilters(_$w);
      });

      const runFilter = debounce(() => {
      const query = (_$w(`#${FiltersIds[field.title]}input`).value || '').toLowerCase().trim();
      updateOptionsUI(_$w, field.title, field._id, query);
    }, 150);
      _$w(`#${FiltersIds[field.title]}input`).onInput(runFilter);         
      
    }
    await refreshFacetCounts(_$w);

    } catch (err) {
      console.error('Failed to load filters:', err);
    }
  }

function getValueFromValueId(valueIds, value) {
  let valueLabels = [];
  let currentVal
  for (const valueId of valueIds) {
    currentVal = value.find(val => val.value === valueId);
    if(currentVal) {
      valueLabels.push(currentVal.label);
    }
  }
  return valueLabels
}
 
  async function updateJobsAndNumbersAndFilters(_$w,clearAll=false) {
    await applyJobFilters(_$w,clearAll); // re-query jobs
    await refreshFacetCounts(_$w,clearAll);    // recompute and update counts in all lists
    await updateSelectedValuesRepeater(_$w);
    updateTotalJobsCountText(_$w);  
  }

  function handleConsiderAllJobs(previousSelectedSize,currentSelectedSize) {
    if(previousSelectedSize===2 && currentSelectedSize===1) {

      considerAllJobs=true;
    }
    else{
      considerAllJobs=false;
    }
  }

  function updateOptionsUI(_$w,fieldTitle, fieldId, searchQuery,clearAll=false) {
    let base = optionsByFieldId.get(fieldId) || [];
    let countsMap=countsByFieldId.get(fieldId) || new Map();
    if(considerAllJobs)
    {
      const selectedFieldId=Array.from( selectedByField.keys() )[0]
      if(selectedFieldId===fieldId) {
        if(selectedFieldId==="Location") {
          countsMap = new Map(cities.map(city=>[city._id, city.count]));
        }
        else{
        const relevantFields=allvaluesobjects.filter(val=>val.customField===selectedFieldId)
        countsMap = new Map(relevantFields.map(val=>[val.valueId, val.count]));
        }
        considerAllJobs=false;
      }
    }
    if(dontUpdateThisCheckBox===fieldId && !clearAll && selectedByField.has(fieldId) )
    {
          dontUpdateThisCheckBox=null;
          return;
    }

    let filteredbase=[]
    for (const element of base)
    {
        if(countsMap.get(element.value))
        {
          if(countsMap.get(element.value)==-1)
          {
            countsMap.set(element.value,0);
          }
            filteredbase.push(element)
        }
    }
    // Build display options with counts
    const withCounts = filteredbase.map(o => {
      const count = countsMap.get(o.value)
      return {
        label: `${o.label} (${count})`,
        value: o.value
      };
    });
    // Apply search
    const filtered = searchQuery
      ? withCounts.filter(o => (o.label || '').toLowerCase().includes(searchQuery))
      : withCounts;

    // Sort alphabetically by label
    filtered.sort((a, b) => (a.label || '').localeCompare(b.label || ''));
    const visibleSet = new Set(filtered.map(o => o.value));
    if(filtered.length===0) {
      _$w(`#${FiltersIds[fieldTitle]}MultiBox`).changeState(`${FiltersIds[fieldTitle]}NoResults`);
    }
    else{
      _$w(`#${FiltersIds[fieldTitle]}MultiBox`).changeState(`${FiltersIds[fieldTitle]}Results`);
    _$w(`#${FiltersIds[fieldTitle]}CheckBox`).options = filtered;
    clearAll?_$w(`#${FiltersIds[fieldTitle]}CheckBox`).value=[]:_$w(`#${FiltersIds[fieldTitle]}CheckBox`).value = visibleSet
    if(visibleSet.size>0 && selectedByField.has(fieldId)) {
      let selectedindices=[];
      for(const  value of selectedByField.get(fieldId)) {
        const options = optionsByFieldId.get(fieldId) || [];
        const option = getCorrectOption(value,options,fieldTitle);
        if(option) {
          const optionIndex = getOptionIndexFromCheckBox(_$w(`#${FiltersIds[fieldTitle]}CheckBox`).options,option.value);
          selectedindices.push(optionIndex);
        }
      }
      _$w(`#${FiltersIds[fieldTitle]}CheckBox`).selectedIndices = selectedindices;
    }
  }
}

  async function applyJobFilters(_$w) {
    let tempFilteredJobs=[];
    let finalFilteredJobs=[];
    secondarySearchIsFilled? finalFilteredJobs=allsecondarySearchJobs:finalFilteredJobs=alljobs;
    if(keywordAllJobs) {
      finalFilteredJobs=keywordAllJobs
    }
    let addedJobsIds=new Set();
    // AND across categories, OR within each category
    for (const [key, values] of selectedByField.entries()) {
        for(const job of finalFilteredJobs) {
            if(key==="Location"){
                //if it is location then we check if selecred values (which is an array) have job city text
                if(values.includes(job[JOBS_COLLECTION_FIELDS.CITY_TEXT])) {
                    if(!addedJobsIds.has(job._id)) {
                        tempFilteredJobs.push(job);
                        addedJobsIds.add(job._id);
                    }
                }
            }
            else{
            //if it is not location then we check if selecred values (which is an array) have one of the job values (whcih is also an array)
            if(job[JOBS_COLLECTION_FIELDS.MULTI_REF_JOBS_CUSTOM_VALUES].some(value=>values.includes(value.valueId))) {
                if(!addedJobsIds.has(job._id)) {
                    tempFilteredJobs.push(job);
                    addedJobsIds.add(job._id);
                }
            }
        }
        }
        addedJobsIds.clear();
        finalFilteredJobs=tempFilteredJobs;
        tempFilteredJobs=[];
    }
    secondarySearchIsFilled? currentSecondarySearchJobs=finalFilteredJobs:currentJobs=finalFilteredJobs;
   
    
    let jobsFirstPage=[];
    console.log("currentSecondarySearchJobs: ",currentSecondarySearchJobs)
    secondarySearchIsFilled? jobsFirstPage=currentSecondarySearchJobs.slice(0,pagination.pageSize):jobsFirstPage=currentJobs.slice(0,pagination.pageSize);
    console.log("jobsFirstPage: ",jobsFirstPage)
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).data = jobsFirstPage;
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationCurrentText).text = "1";
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationTotalCountText).text = secondarySearchIsFilled? Math.ceil(currentSecondarySearchJobs.length/pagination.pageSize).toString():Math.ceil(currentJobs.length/pagination.pageSize).toString();
    if(jobsFirstPage.length===0) {
      await _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_MULTI_STATE_BOX).changeState("noJobs");
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationCurrentText).text = "0";
      pagination.currentPage=0;
    }
    else{
      await _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_MULTI_STATE_BOX).changeState("searchResult");
      pagination.currentPage=1;
    }
    if(!urlOnchangeIsActive)
    {
      handlePaginationButtons(_$w);
    }
    
}

function handlePaginationButtons(_$w)
{
  console.log("iamhere")
  handlePageUrlParam();

  pagination.currentPage===1 || pagination.currentPage===0? _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PAGE_BUTTON_PREVIOUS).disable():_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PAGE_BUTTON_PREVIOUS).enable();
  if(secondarySearchIsFilled) {
    if(currentSecondarySearchJobs.length===0) {
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PAGE_BUTTON_NEXT).disable();
      return;
    }
    pagination.currentPage>=Math.ceil(currentSecondarySearchJobs.length/pagination.pageSize)? _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PAGE_BUTTON_NEXT).disable():_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PAGE_BUTTON_NEXT).enable();
  }
  else {
    if(currentJobs.length===0) {
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PAGE_BUTTON_NEXT).disable();
      return;
    }
  pagination.currentPage>=Math.ceil(currentJobs.length/pagination.pageSize)? _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PAGE_BUTTON_NEXT).disable():_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PAGE_BUTTON_NEXT).enable();
  }
}

function handlePageUrlParam() {
  ActivateURLOnchange=false;
  if(pagination.currentPage==1 || pagination.currentPage==0)
  {
      queryParams.remove(["page"]);
  }
  else{
    queryParams.add({ page: pagination.currentPage });
  }
}
async function refreshFacetCounts(_$w,clearAll=false) { 

  secondarySearchIsFilled? countJobsPerField(currentSecondarySearchJobs):countJobsPerField(currentJobs);
    for(const field of allfields) {

        const query = (_$w(`#${FiltersIds[field.title]}input`).value || '').toLowerCase().trim();
        clearAll? updateOptionsUI(_$w,field.title, field._id, '',true):updateOptionsUI(_$w,field.title, field._id, query);
        // no search query
    }
  }


  function countJobsPerField(jobs) {
    const fieldIds = Array.from(optionsByFieldId.keys());
  
    const currentJobsIds=jobs.map(job=>job._id);
    for (const fieldId of fieldIds) {
        let currentoptions = optionsByFieldId.get(fieldId)
        let counter=new Map();
        for(const option of currentoptions) {
            for (const jobId of currentJobsIds) {
                if (valueToJobs[option.value].includes(jobId)) {
                    counter.set(option.value, (counter.get(option.value) || 0) + 1);
                }
            }
        
        }
        if(selectedByField.has(fieldId)) {
        for (const value of selectedByField.get(fieldId)) {
          console.log("value: ",value)
          if(counter.get(value)===undefined)
          {
            //it is -1 as a flag, so in case it was selected and after selecting more filters from different field and  suddenly no more jobs have it, we will show 0
            counter.set(value, -1);
          }
        }
      }
        countsByFieldId.set(fieldId, counter);
    }
  }
 
function updateSelectedValuesRepeater(_$w) {
    const selectedItems = [];
    for (const [fieldId, valueIds] of selectedByField.entries()) {
      const opts = optionsByFieldId.get(fieldId) || [];
      for (const id of valueIds) {
        const found = opts.find((option) => option.value === id);
        const label = found.label;
          selectedItems.push({ _id: `${fieldId}:${id}`, label, fieldId, valueId: id });
      }
    }
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.SELECTED_VALUES_REPEATER).data = selectedItems;
}



async function secondarySearch(_$w,query) {
  if(query.length===0 || query===undefined || query==='') {
    secondarySearchIsFilled=false;
    await updateJobsAndNumbersAndFilters(_$w); // we do this here because of the case when searching the list and adding filters from the side, and we delete the search query, so we need to refresh the counts and the jobs
    return;
  }
  else {
    allsecondarySearchJobs=currentJobs.filter(job=>job.title.toLowerCase().includes(query));
    currentSecondarySearchJobs=allsecondarySearchJobs;
    const jobsFirstPage=allsecondarySearchJobs.slice(0,pagination.pageSize);
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).data = jobsFirstPage;
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationCurrentText).text = "1";
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationTotalCountText).text = Math.ceil(allsecondarySearchJobs.length/pagination.pageSize).toString();
    pagination.currentPage=1;

    if(jobsFirstPage.length===0) {
      await _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_MULTI_STATE_BOX).changeState("noJobs");
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationCurrentText).text = "0";
      pagination.currentPage=0;
    }
    else{
      await _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_MULTI_STATE_BOX).changeState("searchResult");
    }
    secondarySearchIsFilled=true
  }
    handlePaginationButtons(_$w);
    updateTotalJobsCountText(_$w);
    await refreshFacetCounts(_$w); 
    return allsecondarySearchJobs;
}
  function bindSearchInput(_$w) {
    try {
      const secondarySearchDebounced = debounce(async () => {
      const query = (_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.SECONDARY_SEARCH_INPUT).value || '').toLowerCase().trim();
      await secondarySearch(_$w, query);
    }, 150);

    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.SECONDARY_SEARCH_INPUT).onInput(secondarySearchDebounced);

  } catch (error) {
    console.error('Failed to bind search input:', error);
  }
}



module.exports = {
    careersMultiBoxesPageOnReady,
    secondarySearch
};

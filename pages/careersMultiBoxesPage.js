const { COLLECTIONS,CUSTOM_VALUES_COLLECTION_FIELDS,JOBS_COLLECTION_FIELDS } = require('../backend/collectionConsts');

const { queryParams} = require('wix-location-frontend');
const { location } = require("@wix/site-location");
const {CAREERS_MULTI_BOXES_PAGE_CONSTS,FiltersIds,fieldTitlesInCMS,possibleUrlParams} = require('../backend/careersMultiBoxesPageIds');
const { groupValuesByField, debounce, getAllRecords, getFieldById, getFieldByTitle,getCorrectOption,getOptionIndexFromCheckBox,loadPrimarySearchRepeater,bindPrimarySearch,primarySearch } = require('./pagesUtils');

let dontUpdateThisCheckBox;
const selectedByField = new Map(); // fieldId -> array of selected value IDs
const optionsByFieldId = new Map(); // fieldId -> [{label, value}] array of objects with label which is the valueLabel and value which is the valueId
const countsByFieldId = new Map(); // fieldId -> {valueId: count} map of counts for each valueId
let allfields=[] // all fields in the database
let alljobs=[] // all jobs in the database
let allvaluesobjects=[] // all values in the database
let valueToJobs={} // valueId -> array of jobIds
let currentJobs=[] // current jobs that are displayed in the jobs repeater
let allsecondarySearchJobs=[] // secondary search results that are displayed in the jobs repeater
let currentSecondarySearchJobs=[] // current secondary search results that are displayed in the jobs repeater
let secondarySearchIsFilled=false // whether the secondary search is filled with results
let keywordAllJobs; // all jobs that are displayed in the jobs repeater when the keyword is filled
const pagination = {
  pageSize: 10,
  currentPage: 1,
};
async function careersMultiBoxesPageOnReady(_$w,urlParams) {
  console.log("urlParams is inside multi boxes page on ready ",urlParams);
    await loadData(_$w);
    loadJobsRepeater(_$w);
    loadPrimarySearchRepeater(_$w);
    await loadFilters(_$w);
    loadSelectedValuesRepeater(_$w);
    bindSearchInput(_$w);
    loadPaginationButtons(_$w);
    
    await handleUrlParams(_$w, urlParams);
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.CLEAR_ALL_BUTTON_ID).onClick(async () => {
      await clearAll(_$w);
    });

}

async function clearAll(_$w) {
  if(selectedByField.size>0 || _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.SECONDARY_SEARCH_INPUT).value || _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value) {
    for(const field of allfields) {
      _$w(`#${FiltersIds[field.title]}CheckBox`).selectedIndices = [];
    }
    selectedByField.clear();
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.SECONDARY_SEARCH_INPUT).value='';
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value='';
    secondarySearchIsFilled=false;
    currentJobs=alljobs;
    keywordAllJobs=undefined;
    queryParams.remove(possibleUrlParams.concat(["keyword", "page"]));
    await updateJobsAndNumbersAndFilters(_$w,true);
    }
}


async function handleUrlParams(_$w,urlParams) {
  try { 
    console.log("currentJobs: ",currentJobs);
    console.log("currentJobs.length: ",currentJobs.length);
  let applyFiltering=false;
  let currentApplyFilterFlag=false;

  //apply this first to determine all jobs
  if(urlParams.keyword) {
    applyFiltering=await primarySearch(_$w, decodeURIComponent(urlParams.keyword), alljobs);
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value=decodeURIComponent(urlParams.keyword);
    currentJobs=_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOB_RESULTS_REPEATER).data;   
    keywordAllJobs=_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOB_RESULTS_REPEATER).data;
  }
  console.log("possibleUrlParams: ",possibleUrlParams)
  console.log("urlParams: ",urlParams)
  for (const url of possibleUrlParams)
  {
    console.log(url)
    console.log("urlParams[url]: ",urlParams[url])

    if(urlParams[url])
    {
      console.log("urlParams[url]: ",urlParams[url])
      currentApplyFilterFlag=await handleParams(_$w,url,urlParams[url])
      if(currentApplyFilterFlag) {
        applyFiltering=true;
      }
    }
    currentApplyFilterFlag=false;
  }
  console.log("inside handleUrlParams, applyFiltering: ",applyFiltering);

    if(applyFiltering || keywordAllJobs) {
      console.log("inside handlePageUrlParam, applyFiltering: ",applyFiltering);
      await updateJobsAndNumbersAndFilters(_$w);
    }
    console.log("currentJobs: ",currentJobs);
    console.log("currentJobs.length: ",currentJobs.length);
    console.log("Math.ceil(currentJobs.length/pagination.pageSize): ",Math.ceil(currentJobs.length/pagination.pageSize));
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
  console.log("valuesAsArray: ",valuesAsArray);
  console.log("param: ",param);

  let selectedIndices=[];
  const field=getFieldByTitle(fieldTitlesInCMS[param],allfields);
  console.log("allfields: ",allfields);
  console.log("field: ",field);
  let existing = selectedByField.get(field._id) || [];
  for(const value of valuesAsArray) {
    console.log("value: ",value);
       const decodedValue = decodeURIComponent(value);
       console.log("decodedValue: ",decodedValue);
      const options=optionsByFieldId.get(field._id);
      console.log("options: ",options);
      const option=getCorrectOption(decodedValue,options,param);
      console.log("option: ",option);
      if(option) {
       const optionIndex=getOptionIndexFromCheckBox(_$w(`#${FiltersIds[field.title]}CheckBox`).options,option.value);
       selectedIndices.push(optionIndex);
       existing.push(option.value);
        applyFiltering=true;
        dontUpdateThisCheckBox=field._id;
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
    });

    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PAGE_BUTTON_PREVIOUS).onClick(async () => {
      let previousPageJobs=currentJobs.slice(pagination.pageSize*(pagination.currentPage-2),pagination.pageSize*(pagination.currentPage-1));
      pagination.currentPage--;
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationCurrentText).text =   pagination.currentPage.toString();
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).data = previousPageJobs;
      handlePaginationButtons(_$w);
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
            const fieldId = itemData.fieldId;
            const valueId = itemData.valueId;
            dontUpdateThisCheckBox=fieldId;
            if (!fieldId || !valueId) return;

            const existing = selectedByField.get(fieldId) || [];
            const updated = existing.filter(v => v !== valueId);
            const field=getFieldById(fieldId,allfields);
            console.log("field: ",field);
            let fieldTitle=field.title.toLowerCase().replace(' ', '');
            fieldTitle==="brands"? fieldTitle="brand":fieldTitle;
            if (updated.length) {
              selectedByField.set(fieldId, updated);
              console.log("url values to add: ",{ fieldTitle : updated.map(val=>encodeURIComponent(val)).join(',') });
              queryParams.add({ [fieldTitle] : updated.map(val=>encodeURIComponent(val)).join(',') });
            } else {
              selectedByField.delete(fieldId);
              console.log("url values to remove: ",fieldTitle);
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
        allvaluesobjects=await getAllRecords(COLLECTIONS.CUSTOM_VALUES);
        for (const value of allvaluesobjects) {
            valueToJobs[value._id]= value.jobIds;
        }
    }
    if(allfields.length===0) {
        allfields=await getAllRecords(COLLECTIONS.CUSTOM_FIELDS);
        allfields.push({_id:"Location",title:"Location"}); 
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
        location.to(itemData["link-jobs-title"]);
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
      const cities=await getAllRecords(COLLECTIONS.CITIES);
      for(const city of cities) {
        valueToJobs[city._id]=city.jobIds;
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
        const field=getFieldById(key,allfields);
        let originalOptions=[];
        if(key==="Location") {
          originalOptions=value.map(city=>({
              label: city.city,
              value: city._id
          }));
        }
        else{
            originalOptions=value
        }

        optionsByFieldId.set(key, originalOptions);
        for (const val of allvaluesobjects) {
          counter[val.title]=val.count
        }

        countsByFieldId.set(key, new Map(originalOptions.map(o => [o.value, counter[o.label]])));
        updateOptionsUI(_$w,field.title, field._id, ''); // no search query
        _$w(`#${FiltersIds[field.title]}CheckBox`).selectedIndices = []; // start empty
        _$w(`#${FiltersIds[field.title]}CheckBox`).onChange(async (ev) => {
          console.log("i am here !!!!!")
          console.log("field.title: ",field.title)
          console.log("value: ",value)
          dontUpdateThisCheckBox=field._id;
        const selected = ev.target.value; // array of selected value IDs
        console.log("ev: ",ev)
        console.log("ev.target: ",ev.target)
        let fieldTitle=field.title.toLowerCase().replace(' ', '');
        fieldTitle==="brands"? fieldTitle="brand":fieldTitle;
        console.log("fieldTitle that is going to url: ",fieldTitle);
        
        if (selected && selected.length) {
          selectedByField.set(field._id, selected); 
          if(fieldTitle==="brand" || fieldTitle==="storename") {
            const valueLabels=getValueFromValueId(selected,value);
            console.log("brand and storename url values: ",{ fieldTitle : valueLabels });
            queryParams.add({ [fieldTitle] : valueLabels.map(val=>encodeURIComponent(val)).join(',') });
          }
          else{
            console.log("url calues: ",{ fieldTitle : selected.map(val=>encodeURIComponent(val)).join(',') });
            queryParams.add({ [fieldTitle] : selected.map(val=>encodeURIComponent(val)).join(',') });
          }
          
          
        } else {
          selectedByField.delete(field._id);  
          console.log("url values to remove: ",fieldTitle);
          queryParams.remove([fieldTitle ]);
        }

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

function getValueFromValueId(valueIds,value) {
  console.log("inside getValueFromValueId")
  console.log("valueIds: ",valueIds);
  console.log(" value: ",value);
  let valueLabels=[];
  let currentVal
  for(const valueId of valueIds) {
    currentVal=value.find(val=>val.value===valueId);
    if(currentVal) {
      valueLabels.push(currentVal.label);
    }
  }
  console.log("valueLabels: ",valueLabels);
  return valueLabels
}

 

  async function updateJobsAndNumbersAndFilters(_$w,clearAll=false) {
    await applyJobFilters(_$w); // re-query jobs
    await refreshFacetCounts(_$w,clearAll);    // recompute and update counts in all lists
    await updateSelectedValuesRepeater(_$w);
    updateTotalJobsCountText(_$w);
  }

  function updateOptionsUI(_$w,fieldTitle, fieldId, searchQuery,clearAll=false) {
    let base = optionsByFieldId.get(fieldId) || [];
    const countsMap = countsByFieldId.get(fieldId) || new Map();
    
    if(dontUpdateThisCheckBox===fieldId && !clearAll)
    {
        dontUpdateThisCheckBox=null;
        return;
    }
    let filteredbase=[]
    for (const element of base)
    {
        if(countsMap.get(element.value))
        {
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

    // Preserve currently selected values that are still visible
    let prevSelected=[]
    clearAll? prevSelected=[]:prevSelected= _$w(`#${FiltersIds[fieldTitle]}CheckBox`).value;
    const visibleSet = new Set(filtered.map(o => o.value));
    const preserved = prevSelected.filter(v => visibleSet.has(v));
    if(filtered.length===0) {
      _$w(`#${FiltersIds[fieldTitle]}MultiBox`).changeState(`${FiltersIds[fieldTitle]}NoResults`);
    }
    else{
      _$w(`#${FiltersIds[fieldTitle]}MultiBox`).changeState(`${FiltersIds[fieldTitle]}Results`);
    _$w(`#${FiltersIds[fieldTitle]}CheckBox`).options = filtered;
    _$w(`#${FiltersIds[fieldTitle]}CheckBox`).value = preserved;
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
            if(job[JOBS_COLLECTION_FIELDS.MULTI_REF_JOBS_CUSTOM_VALUES].some(value=>values.includes(value._id))) {
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
    console.log("inside applyJobFilters, finalFilteredJobs: ",finalFilteredJobs);
    secondarySearchIsFilled? currentSecondarySearchJobs=finalFilteredJobs:currentJobs=finalFilteredJobs;
   
    console.log("inside applyJobFilters, currentJobs: ",currentJobs);
    let jobsFirstPage=[];
    secondarySearchIsFilled? jobsFirstPage=currentSecondarySearchJobs.slice(0,pagination.pageSize):jobsFirstPage=currentJobs.slice(0,pagination.pageSize);
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).data = jobsFirstPage;
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationCurrentText).text = "1";
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationTotalCountText).text = secondarySearchIsFilled? Math.ceil(currentSecondarySearchJobs.length/pagination.pageSize).toString():Math.ceil(currentJobs.length/pagination.pageSize).toString();
    if(jobsFirstPage.length===0) {
      await _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_MULTI_STATE_BOX).changeState("noJobs");
    }
    else{
      await _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_MULTI_STATE_BOX).changeState("searchResult");
    }
    pagination.currentPage=1;
    handlePaginationButtons(_$w);
  }

function handlePaginationButtons(_$w)
{
  handlePageUrlParam();

  pagination.currentPage===1? _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PAGE_BUTTON_PREVIOUS).disable():_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PAGE_BUTTON_PREVIOUS).enable();
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
  if(pagination.currentPage==1)
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
        let currentoptions=optionsByFieldId.get(fieldId)
        let counter=new Map();
        for(const option of currentoptions) {
            for (const jobId of currentJobsIds) {
                if (valueToJobs[option.value].includes(jobId)) {
                    counter.set(option.value, (counter.get(option.value) || 0) + 1);
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
       bindPrimarySearch(_$w,allvaluesobjects,alljobs);

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

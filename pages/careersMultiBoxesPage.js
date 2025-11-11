const { COLLECTIONS,CUSTOM_VALUES_COLLECTION_FIELDS,JOBS_COLLECTION_FIELDS } = require('../backend/collectionConsts');
const { queryParams} = require('wix-location-frontend');
const { location } = require("@wix/site-location");
const {CAREERS_MULTI_BOXES_PAGE_CONSTS,FiltersIds,fieldTitlesInCMS} = require('../backend/careersMultiBoxesPageIds');
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
const pagination = {
  pageSize: 10,
  currentPage: 1,
};
async function careersMultiBoxesPageOnReady(_$w,urlParams) {
    console.log("careersMultiBoxesPageOnReady urlParams: ", urlParams);
    await loadData(_$w);

    await Promise.all([
      loadJobsRepeater(_$w),
      loadPrimarySearchRepeater(_$w),
      loadFilters(_$w),
      loadSelectedValuesRepeater(_$w),
      bindSearchInput(_$w),
      loadPaginationButtons(_$w)
    ]);
    await handleUrlParams(_$w, urlParams);
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.CLEAR_ALL_BUTTON_ID).onClick(async () => {
      await clearAll(_$w);
    });

}

async function clearAll(_$w) {
  console.log("clear all button clicked");
  if(selectedByField.size>0 || _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.SECONDARY_SEARCH_INPUT).value || _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value) {
    for(const field of allfields) {
      _$w(`#${FiltersIds[field.title]}CheckBox`).selectedIndices = [];
    }
    selectedByField.clear();
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.SECONDARY_SEARCH_INPUT).value='';
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value='';
    secondarySearchIsFilled=false;
    await updateJobsAndNumbersAndFilters(_$w,true);
    }
}


async function handleUrlParams(_$w,urlParams) {
  try { 
  let applyFiltering=false;
  let keyword=false
  console.log("handleUrlParams urlParams: ", urlParams);
    if(urlParams.brand) {
      applyFiltering=await handleParams(_$w,"brand",urlParams.brand)
    }
    if(urlParams.category) {
      applyFiltering=await handleParams(_$w,"category",urlParams.category)
    }
    if(urlParams.keyword) {
      applyFiltering=await primarySearch(_$w, decodeURIComponent(urlParams.keyword), alljobs);
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value=decodeURIComponent(urlParams.keyword);
      keyword=true;
      if(applyFiltering)
      {
        console.log("delete me")
        currentJobs=_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOB_RESULTS_REPEATER).data;
      }
      
    }
    if(applyFiltering) {
      await updateJobsAndNumbersAndFilters(_$w,false,keyword);
    }
    if(urlParams.page) {
      if(Number.isNaN(Number(urlParams.page)) || Number(urlParams.page)<=1 || Number(urlParams.page)>Math.ceil(currentJobs.length/pagination.pageSize)) {
        console.warn("page number is invalid, removing page from url");
        queryParams.remove(["page"]);
        return;
      }
        pagination.currentPage=Number(urlParams.page);
        let paginationCurrentText=Number(urlParams.page)*pagination.pageSize
        let startSlicIndex=pagination.pageSize*(pagination.currentPage-1);
        let endSlicIndex=(pagination.pageSize)*(pagination.currentPage);
        if(Number(urlParams.page)==Math.ceil(currentJobs.length/pagination.pageSize)) {
          paginationCurrentText=paginationCurrentText-(pagination.pageSize-(currentJobs.length%pagination.pageSize));          
          endSlicIndex=currentJobs.length;
        }
        _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationCurrentText).text = paginationCurrentText.toString();
        const jobsFirstPage=currentJobs.slice(startSlicIndex,endSlicIndex);
        _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).data = jobsFirstPage;
        handlePaginationButtons(_$w);
      }
  } catch (error) {
    console.error('Failed to handle url params:', error);
  }
}

async function handleParams(_$w,param,value) {
  let applyFiltering=false;
  console.log("handleParams param: ", param, " value: ", value);
       const decodedValue = decodeURIComponent(value);
       console.log("decodedValue: ", decodedValue);
      const field=getFieldByTitle(fieldTitlesInCMS[param],allfields);
      const options=optionsByFieldId.get(field._id);
      console.log("all options availbe for this field: ", field.title, " are ", options);
      const option=getCorrectOption(decodedValue,options);
      if(option) {
       const optionIndex=getOptionIndexFromCheckBox(_$w(`#${FiltersIds[field.title]}CheckBox`).options,option.value);
       _$w(`#${FiltersIds[field.title]}CheckBox`).selectedIndices = [optionIndex];
        selectedByField.set(field._id, [option.value]);
        applyFiltering=true;
        dontUpdateThisCheckBox=field._id;
      }
      else {
        console.warn(`${param} value not found in dropdown options`);
      }
      return applyFiltering;
}

async function loadPaginationButtons(_$w) {
  try {
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PAGE_BUTTON_NEXT).onClick(async () => {
      let nextPageJobs=currentJobs.slice(pagination.pageSize*pagination.currentPage,pagination.pageSize*(pagination.currentPage+1));
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationCurrentText).text = (nextPageJobs.length+pagination.pageSize*pagination.currentPage).toString();
      pagination.currentPage++;
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).data = nextPageJobs;
      handlePaginationButtons(_$w);
    });

    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PAGE_BUTTON_PREVIOUS).onClick(async () => {
      let previousPageJobs=currentJobs.slice(pagination.pageSize*(pagination.currentPage-2),pagination.pageSize*(pagination.currentPage-1));
      pagination.currentPage--;
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationCurrentText).text = (pagination.pageSize*pagination.currentPage).toString();
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).data = previousPageJobs;
      handlePaginationButtons(_$w);
    });
  } catch (error) {
    console.error('Failed to load pagination buttons:', error);
  }
}

async function loadSelectedValuesRepeater(_$w) {
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
            if (updated.length) {
              selectedByField.set(fieldId, updated);
            } else {
              selectedByField.delete(fieldId);
            }

            const field=getFieldById(fieldId,allfields);
            const currentVals = _$w(`#${FiltersIds[field.title]}CheckBox`).value || [];
            const nextVals = currentVals.filter(v => v !== valueId);
            _$w(`#${FiltersIds[field.title]}CheckBox`).value = nextVals;
            await updateJobsAndNumbersAndFilters(_$w);
          });
    });
    await updateSelectedValuesRepeater(_$w);
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
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationCurrentText).text = jobsFirstPage.length.toString();
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationTotalCountText).text = currentJobs.length.toString();
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
      console.log("valuesByFieldId: ", valuesByFieldId);
      console.log("allvaluesobjects: ", allvaluesobjects);
      console.log("allfields: ", allfields);
      console.log("optionsByFieldId: ", optionsByFieldId);
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
          counter[val.title]=val.totalJobs
        }

        countsByFieldId.set(key, new Map(originalOptions.map(o => [o.value, counter[o.label]])));
        updateOptionsUI(_$w,field.title, field._id, ''); // no search query
        _$w(`#${FiltersIds[field.title]}CheckBox`).selectedIndices = []; // start empty
        console.log("i am here 1 , field.title: ", field.title);
        _$w(`#${FiltersIds[field.title]}CheckBox`).onChange(async (ev) => {
          console.log(`#${FiltersIds[field.title]}CheckBox.selectedIndices: `, _$w(`#${FiltersIds[field.title]}CheckBox`).selectedIndices);
          dontUpdateThisCheckBox=field._id;
        const selected = ev.target.value; // array of selected value IDs
        if (selected && selected.length) {
          selectedByField.set(field._id, selected); 
        } else {
          selectedByField.delete(field._id);  
        }
        await updateJobsAndNumbersAndFilters(_$w);
    
      });
      console.log("i am here 2 , field.title: ", field.title);
      const runFilter = debounce(() => {
      const query = (_$w(`#${FiltersIds[field.title]}input`).value || '').toLowerCase().trim();
      updateOptionsUI(_$w, field.title, field._id, query);
    }, 150);
    console.log("i am here 3 , field.title: ", field.title);
      _$w(`#${FiltersIds[field.title]}input`).onInput(runFilter);         
      console.log("i am here 4 , field.title: ", field.title);  
      
    }
console.log("i am here 5 ");
    await refreshFacetCounts(_$w);
    console.log("i am here 6 ");

    } catch (err) {
      console.error('Failed to load filters:', err);
    }
  }

 

  async function updateJobsAndNumbersAndFilters(_$w,clearAll=false,keyword=false) {
    await applyJobFilters(_$w,keyword); // re-query jobs
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
    _$w(`#${FiltersIds[fieldTitle]}CheckBox`).options = filtered;
    _$w(`#${FiltersIds[fieldTitle]}CheckBox`).value = preserved;
  }

  async function applyJobFilters(_$w,keyword=false) {
    let tempFilteredJobs=[];
    let finalFilteredJobs=[];
    secondarySearchIsFilled? finalFilteredJobs=allsecondarySearchJobs:finalFilteredJobs=alljobs;
    if(keyword) {
      finalFilteredJobs=currentJobs
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
    secondarySearchIsFilled? currentSecondarySearchJobs=finalFilteredJobs:currentJobs=finalFilteredJobs;
    let jobsFirstPage=[];
    secondarySearchIsFilled? jobsFirstPage=currentSecondarySearchJobs.slice(0,pagination.pageSize):jobsFirstPage=currentJobs.slice(0,pagination.pageSize);
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).data = jobsFirstPage;
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationCurrentText).text = jobsFirstPage.length.toString();
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationTotalCountText).text = secondarySearchIsFilled? currentSecondarySearchJobs.length.toString():currentJobs.length.toString();
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
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationCurrentText).text = jobsFirstPage.length.toString();
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationTotalCountText).text = allsecondarySearchJobs.length.toString();
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
  async function bindSearchInput(_$w) {
    try {
      await bindPrimarySearch(_$w,allvaluesobjects,alljobs);


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

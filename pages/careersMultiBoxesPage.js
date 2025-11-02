const { COLLECTIONS,CUSTOM_VALUES_COLLECTION_FIELDS,JOBS_COLLECTION_FIELDS } = require('../backend/collectionConsts');
const { items: wixData } = require('@wix/data');
const {CAREERS_MULTI_BOXES_PAGE_CONSTS,FiltersIds} = require('../backend/careersMultiBoxesPageIds');
const { groupValuesByField } = require('./pagesUtils');
let valuesByFieldIdGlobal = null; 
let dontUpdateThisCheckBox;
const selectedByField = new Map(); // fieldId -> array of selected value IDs
const optionsByFieldId = new Map(); // fieldId -> [{label, value}] array of objects with label which is the valueLabel and value which is the valueId
const countsByFieldId = new Map(); // fieldId -> {valueId: count} map of counts for each valueId
let allfields=[] // all fields in the database
let alljobs=[] // all jobs in the database
let allvaluesobjects=[] // all values in the database
let valueToJobs={} // valueId -> array of jobIds
let currentJobs=[] // current jobs that are displayed in the jobs repeater
const pagination = {
  pageSize: 10,
  currentPage: 1,
};
async function careersMultiBoxesPageOnReady(_$w) {
    await loadData(_$w);
    await loadJobsRepeater(_$w);
    await loadFilters(_$w);
    await loadSelectedValuesRepeater(_$w);
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.CLEAR_ALL_BUTTON_ID).onClick(async () => {
        selectedByField.clear();
        await applyJobFilters(_$w);
        await refreshFacetCounts(_$w,true);
        await updateSelectedValuesRepeater(_$w);
        updateTotalJobsCountText(_$w);
    });
    await loadPaginationButtons(_$w);
}

async function loadPaginationButtons(_$w) {
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PAGE_BUTTON_NEXT).onClick(async () => {
      let nextPageJobs=currentJobs.slice(pagination.pageSize*pagination.currentPage,pagination.pageSize*(pagination.currentPage+1));
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationCurrentText).text = (nextPageJobs.length+pagination.pageSize*pagination.currentPage).toString();
      pagination.currentPage++;
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).data = nextPageJobs;
      handlePaginationButtons(_$w);
    });

    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PAGE_BUTTON_PREVIOUS).onClick(async () => {
      let previousPageJobs=currentJobs.slice(pagination.pageSize*(pagination.currentPage-1),pagination.pageSize*pagination.currentPage);
      pagination.currentPage--;
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationCurrentText).text = (pagination.pageSize*pagination.currentPage).toString();
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).data = previousPageJobs;
      handlePaginationButtons(_$w);
    });
}

async function loadSelectedValuesRepeater(_$w) {
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

            for(const field of allfields) {
                if(field._id===fieldId) {
                    const currentVals = _$w(`#${FiltersIds[field.title]}CheckBox`).value || [];
                    const nextVals = currentVals.filter(v => v !== valueId);
                    _$w(`#${FiltersIds[field.title]}CheckBox`).value = nextVals;
                }
            }  
            await applyJobFilters(_$w);
            await refreshFacetCounts(_$w);
            await updateSelectedValuesRepeater(_$w);
            updateTotalJobsCountText(_$w);
          });
    });
    await updateSelectedValuesRepeater(_$w);
}

async function loadData(_$w) {

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
}
async function loadJobsRepeater(_$w) {
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).onItemReady(($item, itemData) => {
      $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER_ITEM_TITLE).text = itemData.title || '';
      $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER_ITEM_LOCATION).text=itemData.location.fullLocation
      $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER_ITEM_EMPLOYMENT_TYPE).text=itemData.employmentType
    });

    const jobsFirstPage=alljobs.slice(0,pagination.pageSize);
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).data = jobsFirstPage;
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationCurrentText).text = jobsFirstPage.length.toString();
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationTotalCountText).text = currentJobs.length.toString();
    updateTotalJobsCountText(_$w);
    handlePaginationButtons(_$w);
  }

  function updateTotalJobsCountText(_$w) {
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
      valuesByFieldIdGlobal = valuesByFieldId; // store globally

          // Build CheckboxGroup options for this field
        
      const counter={}
      for(const city of cities) {
        counter[city.city]=city.count
      }
      for(const [key, value] of valuesByFieldId) {
        for(const field of allfields) {
          if(field._id===key) {
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
            _$w(`#${FiltersIds[field.title]}CheckBox`).onChange(async (ev) => {
              dontUpdateThisCheckBox=field._id;
            const selected = ev.target.value; // array of selected value IDs
            if (selected && selected.length) {
              selectedByField.set(field._id, selected);
            } else {
              selectedByField.delete(field._id);  
            }
            await applyJobFilters(_$w); // re-query jobs
            await refreshFacetCounts(_$w);    // recompute and update counts in all lists
            await updateSelectedValuesRepeater(_$w);
            updateTotalJobsCountText(_$w);
          });

          const runFilter = debounce(() => {
          const query = (_$w(`#${FiltersIds[field.title]}input`).value || '').toLowerCase().trim();
          updateOptionsUI(_$w, field.title, field._id, query);
        }, 150);
         _$w(`#${FiltersIds[field.title]}input`).onInput(runFilter);         
        }
      }
    }
    await refreshFacetCounts(_$w);

    } catch (err) {
      console.error('Failed to load filters:', err);
    }
  }

  
  async function getAllRecords(collectionId) {
    let q = wixData.query(collectionId).include(JOBS_COLLECTION_FIELDS.MULTI_REF_JOBS_CUSTOM_VALUES)
  
  
    const items = [];
    let res = await q.limit(1000).find();
    items.push(...res.items);
  
    while (res.hasNext()) {
      res = await res.next();
      items.push(...res.items);
    }
    return items;
  }

  const debounce = (fn, ms = 150) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

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

  async function applyJobFilters(_$w) {
    let tempFilteredJobs=[];
    let finalFilteredJobs=alljobs;
    let addedJobsIds=[]
    // AND across categories, OR within each category
    for (const [key, values] of selectedByField.entries()) {
        for(const job of finalFilteredJobs) {
            if(key==="Location"){
                //if it is location then we check if selecred values (which is an array) have job city text
                if(values.includes(job[JOBS_COLLECTION_FIELDS.CITY_TEXT])) {
                    if(!addedJobsIds.includes(job._id)) {
                        tempFilteredJobs.push(job);
                        addedJobsIds.push(job._id);
                    }
                }
            }
            else{
            //if it is not location then we check if selecred values (which is an array) have one of the job values (whcih is also an array)
            if(job[JOBS_COLLECTION_FIELDS.MULTI_REF_JOBS_CUSTOM_VALUES].some(value=>values.includes(value._id))) {
                if(!addedJobsIds.includes(job._id)) {
                    tempFilteredJobs.push(job);
                    addedJobsIds.push(job._id);
                }
            }
        }
        }
        addedJobsIds=[]
        finalFilteredJobs=tempFilteredJobs;
        tempFilteredJobs=[];
    }

    currentJobs=finalFilteredJobs;
    const jobsFirstPage=currentJobs.slice(0,pagination.pageSize);
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).data = jobsFirstPage;
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationCurrentText).text = jobsFirstPage.length.toString();
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.paginationTotalCountText).text = currentJobs.length.toString();
    pagination.currentPage=1;
    handlePaginationButtons(_$w);
  }

function handlePaginationButtons(_$w)
{
  pagination.currentPage===1? _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PAGE_BUTTON_PREVIOUS).disable():_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PAGE_BUTTON_PREVIOUS).enable();
  pagination.currentPage===Math.ceil(currentJobs.length/pagination.pageSize)? _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PAGE_BUTTON_NEXT).disable():_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PAGE_BUTTON_NEXT).enable();
}
async function refreshFacetCounts(_$w,clearAll=false) {   
    const fieldIds = Array.from(optionsByFieldId.keys());
    const currentJobsIds=currentJobs.map(job=>job._id);
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

    for(const field of allfields) {
        const query = (_$w(`#${FiltersIds[field.title]}input`).value || '').toLowerCase().trim();
        clearAll? updateOptionsUI(_$w,field.title, field._id, '',true):updateOptionsUI(_$w,field.title, field._id, query);
        // no search query
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

module.exports = {
    careersMultiBoxesPageOnReady
};

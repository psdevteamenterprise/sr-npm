const { COLLECTIONS,CUSTOM_VALUES_COLLECTION_FIELDS,JOBS_COLLECTION_FIELDS } = require('../backend/collectionConsts');
const { items: wixData } = require('@wix/data');
const {CAREERS_MULTI_BOXES_PAGE_CONSTS} = require('../backend/careersMultiBoxesPageIds');

let valuesByFieldIdGlobal = null; 
let dontUpdateThisCheckBox;
const selectedByField = new Map(); // fieldId -> array of selected value IDs
const optionsByFieldId = new Map(); // fieldId -> [{label, value}] array of objects with label which is the valueLabel and value which is the valueId
const countsByFieldId = new Map(); // fieldId -> {valueId: count} map of counts for each valueId
let alljobs=[] // all jobs in the database
let allvaluesobjects=[] // all values in the database
let valueToJobs={} // valueId -> array of jobIds
let currentJobs=[] // current jobs that are displayed in the jobs repeater
async function careersMultiBoxesPageOnReady(_$w) {
    if(alljobs.length===0) {
        alljobs=await getAllRecords(COLLECTIONS.JOBS);
        currentJobs=alljobs;
        console.log("alljobs: ",alljobs)
      }
    if(Object.keys(valueToJobs).length === 0){
        allvaluesobjects=await getAllRecords(COLLECTIONS.CUSTOM_VALUES);

        for (const value of allvaluesobjects) {
            valueToJobs[value._id]= value.jobIds;
        }
    }
    
    await  loadJobs(_$w);
    await loadFilters(_$w);
    //selected values repeater on item ready
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
    
            // Update the checkbox group UI inside the corresponding filter item
            _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_REPEATER).forEachItem(($filterItem, filterItemData) => {
              if (filterItemData._id === fieldId) {
                const currentVals = $filterItem(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_REPEATER_ITEM_CHECKBOX).value || [];
                const nextVals = currentVals.filter(v => v !== valueId);
                $filterItem(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_REPEATER_ITEM_CHECKBOX).value = nextVals;
              }
            });
    
            await applyJobFilters(_$w,fieldId);
            await refreshFacetCounts(_$w);
            await updateSelectedValuesRepeater(_$w);
            updateTotalJobsCountText(_$w);
          });
    });
    await updateSelectedValuesRepeater(_$w);
   
}

async function loadJobs(_$w) {
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).onItemReady(($item, itemData) => {
      $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER_ITEM_TITLE).text = itemData.title || '';
      $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER_ITEM_LOCATION).text=itemData.location.fullLocation
    });
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).data = alljobs;
    updateTotalJobsCountText(_$w);
  }

  function updateTotalJobsCountText(_$w) {
    _$w('#totalJobsCountText').text = `${currentJobs.length} Jobs`;
    
  }

  async function loadFilters(_$w) {
    try {
      // 1) Load all categories (fields)
      let fields = await getAllRecords(COLLECTIONS.CUSTOM_FIELDS);
      fields.push({_id:"Location",title:"Location"});
      console.log("fields: ",fields)
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_REPEATER).data = fields;
      const cities=await getAllRecords(COLLECTIONS.CITIES);
      console.log("cities: ",cities)
      for(const city of cities) {
        valueToJobs[city._id]=city.jobIds;
      }
      // 2) Load all values once and group them by referenced field
     
      let valuesByFieldId = groupValuesByField(allvaluesobjects, CUSTOM_VALUES_COLLECTION_FIELDS.CUSTOM_FIELD);
      console.log("valuesByFieldId: ",valuesByFieldId)
      valuesByFieldId.set("Location",cities)
      console.log("valuesByFieldId after addubg cities: ",valuesByFieldId)
      valuesByFieldIdGlobal = valuesByFieldId; // store globally
  
  
      // 3) Bind each filter repeater item
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_REPEATER).onItemReady(async ($item, itemData) => {
        $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_LABEL).onClick(()=>{
        $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_CHECKBOX_CONTAINER).collapsed ? $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_CHECKBOX_CONTAINER).expand() : $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_CHECKBOX_CONTAINER).collapse()
      })
        const fieldId = itemData._id;
  
        // Set the filter label (category name)
        $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_LABEL).placeholder = itemData.title

        // if(fieldId==="Location") {
        //   $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_REPEATER_ITEM_CHECKBOX).options = cities.map(city=>({
        //     label: city.city,
        //     value: city._id
        //   }));
        // }
  
        // Build CheckboxGroup options for this field
        const fieldValues = valuesByFieldId.get(fieldId) || [];
        console.log("fieldValues: ",fieldValues)
        let originalOptions=[];
        if(fieldId==="Location") {
            originalOptions=fieldValues.map(city=>({
                label: city.city,
                value: city._id
            }));
        }
        else{
            originalOptions=fieldValues
        }
        console.log("originalOptions: ",originalOptions)
    //     else{
    //      originalOptions = fieldValues.map(v => ({
    //       label: v.title ,
    //       value: v._id
    //     }));
    // }
        optionsByFieldId.set(fieldId, originalOptions);
        const counter={}

        for (const val of allvaluesobjects) {
          counter[val.title]=val.totalJobs
        }
        for(const city of cities) {
          counter[city.city]=city.count
        }

        countsByFieldId.set(fieldId, new Map(originalOptions.map(o => [o.value, counter[o.label]])));
  
        // Initialize UI
        updateOptionsUI($item, fieldId, ''); // no search query
  
        $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_REPEATER_ITEM_CHECKBOX).selectedIndices = []; // start empty
        $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_REPEATER_ITEM_CHECKBOX).onChange(async (ev) => {
        dontUpdateThisCheckBox=fieldId;
      const selected = ev.target.value; // array of selected value IDs
      if (selected && selected.length) {
        selectedByField.set(fieldId, selected);
      } else {
        selectedByField.delete(fieldId);
      }
      await applyJobFilters(_$w,fieldId); // re-query jobs
      await refreshFacetCounts(_$w);    // recompute and update counts in all lists
      await updateSelectedValuesRepeater(_$w);
      updateTotalJobsCountText(_$w);
    });
    
          // Input typing -> only filter this list’s visible options (no Jobs query)
        const runFilter = debounce(() => {
          const query = ($item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_LABEL).value || '').toLowerCase().trim();
          updateOptionsUI($item, fieldId, query);
        }, 150);
        $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_LABEL).onInput(runFilter);
      });
  
      await refreshFacetCounts(_$w);
          // After counts are ready, re-render all items to show numbers
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_REPEATER).forEachItem(($item, itemData) => {
        const query = ($item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_LABEL).value || '').toLowerCase().trim();
        updateOptionsUI($item, itemData._id, query);
      
  
      });
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

  function updateOptionsUI($item, fieldId, searchQuery) {
    let base = optionsByFieldId.get(fieldId) || [];
    const countsMap = countsByFieldId.get(fieldId) || new Map();
    if(dontUpdateThisCheckBox===fieldId)
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
    const prevSelected = $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_REPEATER_ITEM_CHECKBOX).value || [];
    const visibleSet = new Set(filtered.map(o => o.value));
    const preserved = prevSelected.filter(v => visibleSet.has(v));
  
    $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_REPEATER_ITEM_CHECKBOX).options = filtered;
    $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_REPEATER_ITEM_CHECKBOX).value = preserved;

  }

  async function applyJobFilters(_$w,filterByField) {
    let tempFilteredJobs=[];
    let finalFilteredJobs=alljobs;
    let addedJobsIds=[]
    if(filterByField!="Location") {
      filterByField=JOBS_COLLECTION_FIELDS.MULTI_REF_JOBS_CUSTOM_VALUES;
    }
  
    // AND across categories, OR within each category
    for (const [, values] of selectedByField.entries()) {
        for(job of finalFilteredJobs) {
            if(job[filterByField].some(value=>values.includes(value._id))) {
                if(!addedJobsIds.includes(job._id)) {
                    tempFilteredJobs.push(job);
                    addedJobsIds.push(job._id);
                }
            }
        }
        addedJobsIds=[]
        finalFilteredJobs=tempFilteredJobs;
        tempFilteredJobs=[];
    }

    currentJobs=finalFilteredJobs;
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).data = currentJobs;
  
  }


async function refreshFacetCounts(_$w) {    
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
    // // After counts are ready, update all items currently rendered
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_REPEATER).forEachItem(($item, itemData) => {
      const query = ($item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_LABEL).value || '').toLowerCase().trim();
      updateOptionsUI($item, itemData._id, query);
    });
  }

  function groupValuesByField(values, refKey) {
    const map = new Map();
    for (const v of values) {
      const ref = v[refKey]; // should be the _id of the CustomFields item
      if (!map.has(ref)) map.set(ref, []);
      map.get(ref).push({
        label: v.title ,
        value: v._id
      });
    }
    return map;
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

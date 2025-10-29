const { COLLECTIONS,CUSTOM_VALUES_COLLECTION_FIELDS,JOBS_COLLECTION_FIELDS } = require('../backend/collectionConsts');
const { items: wixData } = require('@wix/data');
const {CAREERS_MULTI_BOXES_PAGE_CONSTS} = require('../backend/careersMultiBoxesPageIds');

let valuesByFieldIdGlobal = null; 
const selectedByField = new Map(); // fieldId -> array of selected value IDs
const optionsByFieldId = new Map(); // fieldId -> [{label, value}]
const countsByFieldId = new Map();
let alljobs=[]
let allvaluesobjects=[]
let valueToJobs={}
let currentJobs=[]
async function careersMultiBoxesPageOnReady(_$w) {
    if(alljobs.length===0) {
        alljobs=await getAllRecords(COLLECTIONS.JOBS);
        currentJobs=alljobs.map(job=>job._id);
      }
    if(Object.keys(valueToJobs).length === 0){
        allvaluesobjects=await getAllRecords(COLLECTIONS.CUSTOM_VALUES);
        for (const value of allvaluesobjects) {
            valueToJobs[value._id]= value.jobIds;
        }
    }
    
    await  loadJobs(_$w);
    await loadFilters(_$w);
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.SELECTED_VALUES_REPEATER).onItemReady(($item, itemData) => {
        $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.SELECTED_VALUES_REPEATER_ITEM_LABEL).text = itemData.label || '';
    
        // Deselect this value from both the selected map and the multibox
          $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.DESELECT_BUTTON_ID).onClick(() => {
            const fieldId = itemData.fieldId;
            const valueId = itemData.valueId;
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
    
            applyJobFilters(_$w,JOBS_COLLECTION_FIELDS.MULTI_REF_JOBS_CUSTOM_VALUES);
            refreshFacetCounts(_$w);
            updateSelectedValuesRepeater(_$w);
          });
    });
    updateSelectedValuesRepeater(_$w);
   
}

async function loadJobs(_$w) {
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).onItemReady(($item, itemData) => {
      $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER_ITEM_TITLE).text = itemData.title || '';
      $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER_ITEM_LOCATION).text=itemData.location.fullLocation
    });
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).data = alljobs;
  
    // return wixData.query(COLLECTIONS.JOBS)
    //   .find()
    //   .then((res) => {
    //     _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).data = res.items;
    //   })
    //   .catch((err) => {
    //     console.error('Failed to load jobs:', err);
    //   });
  }

  async function loadFilters(_$w) {
    try {
      // 1) Load all categories (fields)
      const fields = await getAllRecords(COLLECTIONS.CUSTOM_FIELDS);
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_REPEATER).data = fields;
  
      // 2) Load all values once and group them by referenced field
     
      const valuesByFieldId = groupValuesByField(allvaluesobjects, CUSTOM_VALUES_COLLECTION_FIELDS.CUSTOM_FIELD);
      valuesByFieldIdGlobal = valuesByFieldId; // store globally
  
  
      // 3) Bind each filter repeater item
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_REPEATER).onItemReady(async ($item, itemData) => {
        $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_LABEL).onClick(()=>{
        $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_CHECKBOX_CONTAINER).collapsed ? $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_CHECKBOX_CONTAINER).expand() : $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_CHECKBOX_CONTAINER).collapse()
      })
        const fieldId = itemData._id;
  
        // Set the filter label (category name)
        $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_LABEL).placeholder = itemData.title
  
        // Build CheckboxGroup options for this field
        const fieldValues = valuesByFieldId.get(fieldId) || [];
        const originalOptions = fieldValues.map(v => ({
          label: v.title ,
          value: v._id
        }));
        optionsByFieldId.set(fieldId, originalOptions);
        const counter={}

        for (const val of allvaluesobjects) {
          counter[val.title]=val.totalJobs
        }

        countsByFieldId.set(fieldId, new Map(originalOptions.map(o => [o.value, counter[o.label]])));
  
        // Initialize UI
        updateOptionsUI($item, fieldId, ''); // no search query
  
        //$item(CHECKBOX_GROUP_ID).options = originalOptions;
        $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_REPEATER_ITEM_CHECKBOX).selectedIndices = []; // start empty
        $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_REPEATER_ITEM_CHECKBOX).onChange((ev) => {
      const selected = ev.target.value; // array of selected value IDs
      if (selected && selected.length) {
        selectedByField.set(fieldId, selected);
      } else {
        selectedByField.delete(fieldId);
      }
      applyJobFilters(_$w,JOBS_COLLECTION_FIELDS.MULTI_REF_JOBS_CUSTOM_VALUES); // re-query jobs
      refreshFacetCounts(_$w);    // recompute and update counts in all lists
      updateSelectedValuesRepeater(_$w);
  
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
    let q = wixData.query(collectionId);
  
  
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
    const base = optionsByFieldId.get(fieldId) || [];
    const countsMap = countsByFieldId.get(fieldId) || new Map();
    // Build display options with counts
    const withCounts = base.map(o => {
      const count = countsMap.get(o.value) || 0;
      return {
        label: `${o.label} (${count})`,
        value: o.value
      };
    });
    console.log("base: ",base)
    console.log("countsMap: ",countsMap)
    console.log("withCounts: ",withCounts)
    // Apply search
    const filtered = searchQuery
      ? withCounts.filter(o => (o.label || '').toLowerCase().includes(searchQuery))
      : withCounts;
      console.log("filte@$@#@#$red: ",filtered)
  
    // Preserve currently selected values that are still visible
    const prevSelected = $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_REPEATER_ITEM_CHECKBOX).value || [];
    const visibleSet = new Set(filtered.map(o => o.value));
    const preserved = prevSelected.filter(v => visibleSet.has(v));
  
    $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_REPEATER_ITEM_CHECKBOX).options = filtered;
    $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_REPEATER_ITEM_CHECKBOX).value = preserved;
  }

  function applyJobFilters(_$w,filterByField) {
    console.log("applying job filters")
    console.log("selectedByField: ",selectedByField)

    let q = wixData.query(COLLECTIONS.JOBS)
  
    // AND across categories, OR within each category
    for (const [, values] of selectedByField.entries()) {
      if (values && values.length) {
        q = q.hasSome(filterByField, values);
      }
    }
  
    q.find()
      .then(async (res) => { _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).data = res.items;
       await updateCurrentJobs(res);
        // currentJobs=res.items.map(job=>job._id);
        console.log("updated currentJobs adfger fucniton: ",currentJobs)
      })
      .catch((err) => { console.error('Failed to filter jobs:', err); });
  }


async function refreshFacetCounts(_$w) {
    // if (!valuesByFieldIdGlobal)
    // {
    //    return;
    // }
    
    console.log("current countsByFieldId: ",countsByFieldId)
    const fieldIds = Array.from(optionsByFieldId.keys());
    for (const fieldId of fieldIds) {
        let currentoptions=optionsByFieldId.get(fieldId)
        console.log("currentoptions@@@@@@@@@@@@@: ",currentoptions)
        let counter=new Map();
        for(const option of currentoptions) {
            console.log("currentJobs length: ",currentJobs.length)
            for (const jobId of currentJobs) {
                if (valueToJobs[option.value].includes(jobId)) {
                    counter.set(option.value, (counter.get(option.value) || 0) + 1);
                }
            }
        }
        console.log("counter: ",counter)
        console.log("fieldId: ",fieldId)
        countsByFieldId.set(fieldId, counter);
    }
    console.log("new countsByFieldId: ",countsByFieldId)
    //     for (const valueId of Object.keys(valueToJobs)) {
    //         for (const jobId of currentJobs) {
    //             if (valueToJobs[valueId].includes(jobId)) {
    //                 counter.set(valueId, (countsByFieldId.get(valueId) || 0) + 1);
    //             }
    //         }
    //     }
    // }
    // for (const valueId of Object.keys(valueToJobs)) {
    //     for (const jobId of currentJobs) {
    //         if (valueToJobs[valueId].includes(jobId)) {
    //             counter.set(valueId, (countsByFieldId.get(valueId) || 0) + 1);
    //         }
    //     }
    // }





    // // Run per-field queries in parallel
    // const tasks = fieldIds.map(async (fieldId) => {
    //   // Build query with selections from all other fields
    //   let q = wixData.query(COLLECTIONS.JOBS);
    //   for (const [fid, values] of selectedByField.entries()) {
    //     if (fid !== fieldId && values && values.length) {
    //       q = q.hasSome(JOBS_COLLECTION_FIELDS.MULTI_REF_JOBS_CUSTOM_VALUES, values);
    //     }
    //   }
  
    //   // Fetch all matching jobs (paged)
    //   const jobs = await findAll(q);
  
  
    //   // Prepare a set of valid option IDs for this field
    //   const options = optionsByFieldId.get(fieldId) || [];
    //   const optionSet = new Set(options.map(o => o.value));
  
    //   // Tally counts
    //   const counts = new Map(); // valueId -> count
    //   for (const job of jobs) {
    //     const referencedfield= await  wixData.queryReferenced(COLLECTIONS.JOBS, job, JOBS_COLLECTION_FIELDS.MULTI_REF_JOBS_CUSTOM_VALUES)  
    //     //console.log("referencedfield: ",referencedfield)
    //     const vals = referencedfield.items
    //     //const vals = job[JOB_VALUES_FIELD] || [];
    //     for (const val of vals) {
    //       if (optionSet.has(val._id)) {
    //         counts.set(val._id, (counts.get(val._id) || 0) + 1);
    //       }
    //     }
  
    //   }
  
    //   // Ensure every option has a count (zero if absent)
    //   for (const o of options) {
    //     if (!counts.has(o.value)) 
    //     {
    //       counts.set(o.value, 0);}
    //   }
  
    //   countsByFieldId.set(fieldId, counts);
    // });
  
    // await Promise.all(tasks);
  
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
      if (!ref) continue;
      if (!map.has(ref)) map.set(ref, []);
      map.get(ref).push(v);
    }
    return map;
  }

  function updateSelectedValuesRepeater(_$w) {
    console.log("updating selected values repeater")
    const selectedItems = [];
    for (const [fieldId, valueIds] of selectedByField.entries()) {
      const opts = optionsByFieldId.get(fieldId) || [];
      const byId = new Map(opts.map(o => [o.value, o.label]));
      for (const id of valueIds) {
        const label = byId.get(id);
        if (label) {
          selectedItems.push({ _id: `${fieldId}:${id}`, label, fieldId, valueId: id });
        }
      }
    }
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.SELECTED_VALUES_REPEATER).data = selectedItems;
  }

  async function updateCurrentJobs(res) {
    let newcurrentJobs = [];
    newcurrentJobs.push(...res.items.map(job=>job._id));
    while (res.hasNext()) {
      res = await res.next();
      newcurrentJobs.push(...res.items.map(job=>job._id));
    }
    console.log("newcurrentJobs inisde new function: ",newcurrentJobs)
    currentJobs = newcurrentJobs;
    console.log("updated currentJobs inisde new function: ",currentJobs)
  }

  async function findAll(q) {
    const out = [];
    let res = await q.limit(1000).find();
    out.push(...res.items);
    while (res.hasNext()) {
      res = await res.next();
      out.push(...res.items);
    }
    return out;
  }


module.exports = {
    careersMultiBoxesPageOnReady
};

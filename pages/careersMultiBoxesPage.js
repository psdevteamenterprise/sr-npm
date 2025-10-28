const { COLLECTIONS,CUSTOM_VALUES_COLLECTION_FIELDS,JOBS_COLLECTION_FIELDS } = require('../backend/collectionConsts');
const { items: wixData } = require('@wix/data');
const {CAREERS_MULTI_BOXES_PAGE_CONSTS} = require('../backend/careersMultiBoxesPageIds');

let valuesByFieldIdGlobal = null; 
const selectedByField = new Map(); // fieldId -> array of selected value IDs
const optionsByFieldId = new Map(); // fieldId -> [{label, value}]
const countsByFieldId = new Map();

async function careersMultiBoxesPageOnReady(_$w) {
    await  loadJobs(_$w);
    await loadFilters(_$w);
}

async function loadJobs(_$w) {
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).onItemReady(($item, itemData) => {
      $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER_ITEM_TITLE).text = itemData.title || '';
      $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER_ITEM_LOCATION).text=itemData.location.fullLocation
    });
  
    return wixData.query(COLLECTIONS.JOBS)
      .find()
      .then((res) => {
        _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).data = res.items;
      })
      .catch((err) => {
        console.error('Failed to load jobs:', err);
      });
  }

  async function loadFilters() {
    try {
      // 1) Load all categories (fields)
      const fields = await getAllRecords(COLLECTIONS.CUSTOM_FIELDS);
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_REPEATER).data = fields;
  
      // 2) Load all values once and group them by referenced field
      const values = await getAllRecords(COLLECTIONS.CUSTOM_VALUES);
      const valuesByFieldId = groupValuesByField(values, CUSTOM_VALUES_COLLECTION_FIELDS.CUSTOM_FIELD);
      valuesByFieldIdGlobal = valuesByFieldId; // store globally
  
  
      // 3) Bind each filter repeater item
    $w(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_REPEATER).onItemReady(async ($item, itemData) => {
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
        for (const val of fieldValues) {
          const result=await wixData.queryReferenced(COLLECTIONS.CUSTOM_VALUES, val, CUSTOM_VALUES_COLLECTION_FIELDS.MULTI_REF_JOBS_CUSTOM_VALUES)
          counter[val.title]=result._totalCount
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
      applyJobFilters(); // re-query jobs
      refreshFacetCounts();    // recompute and update counts in all lists
  
    });
    
          // Input typing -> only filter this list’s visible options (no Jobs query)
        const runFilter = debounce(() => {
          const query = ($item(FILTER_LABEL_ID).value || '').toLowerCase().trim();
          updateOptionsUI($item, fieldId, query);
        }, 150);
        $item(FILTER_LABEL_ID).onInput(runFilter);
      });
  
      await refreshFacetCounts();
          // After counts are ready, re-render all items to show numbers
      $w(FILTER_REPEATER_ID).forEachItem(($item, itemData) => {
        const query = ($item(FILTER_LABEL_ID).value || '').toLowerCase().trim();
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

  function applyJobFilters(filterByField) {
    let q = wixData.query(COLLECTIONS.JOBS)
  
    // AND across categories, OR within each category
    for (const [, values] of selectedByField.entries()) {
      if (values && values.length) {
        q = q.hasSome(filterByField, values);
      }
    }
  
    q.find()
      .then((res) => { _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOBS_REPEATER).data = res.items; })
      .catch((err) => { console.error('Failed to filter jobs:', err); });
  }


async function refreshFacetCounts() {
    if (!valuesByFieldIdGlobal)
    {
       return;
    }
  
    const fieldIds = Array.from(optionsByFieldId.keys());
    // Run per-field queries in parallel
    const tasks = fieldIds.map(async (fieldId) => {
      // Build query with selections from all other fields
      let q = wixData.query(COLLECTIONS.JOBS);
      for (const [fid, values] of selectedByField.entries()) {
        if (fid !== fieldId && values && values.length) {
          q = q.hasSome(JOBS_COLLECTION_FIELDS.MULTI_REF_JOBS_CUSTOM_VALUES, values);
        }
      }
  
      // Fetch all matching jobs (paged)
      const jobs = await findAll(q);
  
  
      // Prepare a set of valid option IDs for this field
      const options = optionsByFieldId.get(fieldId) || [];
      const optionSet = new Set(options.map(o => o.value));
  
      // Tally counts
      const counts = new Map(); // valueId -> count
      for (const job of jobs) {
        const referencedfield= await  wixData.queryReferenced(COLLECTIONS.JOBS, job, JOBS_COLLECTION_FIELDS.MULTI_REF_JOBS_CUSTOM_VALUES)  
        const vals = referencedfield._items
        //const vals = job[JOB_VALUES_FIELD] || [];
        for (const val of vals) {
          if (optionSet.has(val._id)) {
            counts.set(val._id, (counts.get(val._id) || 0) + 1);
          }
        }
  
      }
  
      // Ensure every option has a count (zero if absent)
      for (const o of options) {
        if (!counts.has(o.value)) 
        {
          counts.set(o.value, 0);}
      }
  
      countsByFieldId.set(fieldId, counts);
    });
  
    await Promise.all(tasks);
  
    // After counts are ready, update all items currently rendered
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_REPEATER).forEachItem(($item, itemData) => {
      const query = ($item(CAREERS_MULTI_BOXES_PAGE_CONSTS.FILTER_LABEL).value || '').toLowerCase().trim();
      updateOptionsUI($item, itemData._id, query);
    });
  }



module.exports = {
    careersMultiBoxesPageOnReady
};

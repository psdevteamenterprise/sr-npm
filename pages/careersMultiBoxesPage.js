const { COLLECTIONS } = require('../backend/collectionConsts');
const { items: wixData } = require('@wix/data');
const {CAREERS_MULTI_BOXES_PAGE_CONSTS} = require('../backend/careersMultiBoxesPageIds');

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
      const fields = await getAllRecords(CUSTOM_FIELDS_COLLECTION);
      $w(FILTER_REPEATER_ID).data = fields;
  
      // 2) Load all values once and group them by referenced field
      const values = await getAllRecords(CUSTOM_VALUES_COLLECTION);
      const valuesByFieldId = groupValuesByField(values, VALUES_REF_FIELD_KEY);
      valuesByFieldIdGlobal = valuesByFieldId; // store globally
  
      // Simple debounce helper so we don't re-render on every keystroke
          const debounce = (fn, ms = 150) => {
        let t;
        return (...args) => {
          clearTimeout(t);
          t = setTimeout(() => fn(...args), ms);
        };
      };
  
      // 3) Bind each filter repeater item
    $w(FILTER_REPEATER_ID).onItemReady(async ($item, itemData) => {
        $item(FILTER_LABEL_ID).onClick(()=>{
        $item('#FilterCheckBoxContainer').collapsed ? $item('#FilterCheckBoxContainer').expand() : $item('#FilterCheckBoxContainer').collapse()
      })
        const fieldId = itemData._id;
  
        // Set the filter label (category name)
        // Use the correct field from CustomFields for the label (e.g., title/name/label)
        const label = itemData.title || itemData.name || itemData.label || 'Filter';
        $item(FILTER_LABEL_ID).placeholder = label;
  
        // Build CheckboxGroup options for this field
        const fieldValues = valuesByFieldId.get(fieldId) || [];
        console.log("fieldValues :     ",fieldValues)
        const originalOptions = fieldValues.map(v => ({
          label: v.title ,
          value: v._id
        }));
        console.log("options:   ",originalOptions)
        optionsByFieldId.set(fieldId, originalOptions);
        const counter={}
        for (const val of fieldValues) {
          const result=await wixData.queryReferenced('CustomValues', val, 'multiRefJobsCustomValues')
          console.log("result:   ",result)
          counter[val.title]=result._totalCount
        }
        console.log("counter:   ",counter)
        countsByFieldId.set(fieldId, new Map(originalOptions.map(o => [o.value, counter[o.label]])));
  
        // Initialize UI
        updateOptionsUI($item, fieldId, ''); // no search query
  
        //$item(CHECKBOX_GROUP_ID).options = originalOptions;
        $item(CHECKBOX_GROUP_ID).selectedIndices = []; // start empty
        $item(CHECKBOX_GROUP_ID).onChange((ev) => {
      const selected = ev.target.value; // array of selected value IDs
      if (selected && selected.length) {
        selectedByField.set(fieldId, selected);
      } else {
        selectedByField.delete(fieldId);
      }
      applyJobFilters(); // re-query jobs
      refreshFacetCounts();    // recompute and update counts in all lists
  
    });
  
    
    //   $item(FILTER_LABEL_ID).onInput(() => {
    //   const query = ($item(FILTER_LABEL_ID).value || '').toLowerCase().trim();
    //   const base = optionsByFieldId.get(fieldId) || [];
    //   const filtered = query
    //     ? base.filter(o => (o.label || '').toLowerCase().includes(query))
    //     : base.slice();
  
    //   // Preserve selections that are still visible
    //   const prevSelected = $item(CHECKBOX_GROUP_ID).value || [];
    //   const visibleValues = new Set(filtered.map(o => o.value));
    //   const preserved = prevSelected.filter(v => visibleValues.has(v));
  
    //   $item(CHECKBOX_GROUP_ID).options = filtered;
    //   $item(CHECKBOX_GROUP_ID).value = preserved; // do NOT call applyJobFilters here
    // });
  
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




module.exports = {
    careersMultiBoxesPageOnReady
};

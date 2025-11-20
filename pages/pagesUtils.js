const { items: wixData } = require('@wix/data');
const { JOBS_COLLECTION_FIELDS,COLLECTIONS } = require('../backend/collectionConsts');
const { CAREERS_MULTI_BOXES_PAGE_CONSTS,CATEGORY_CUSTOM_FIELD_ID_IN_CMS } = require('../backend/careersMultiBoxesPageIds');
const { location } = require("@wix/site-location");

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

  const debounce = (fn, ms = 150) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  async function getAllRecords(collectionId) {
    const q = wixData.query(collectionId).include(JOBS_COLLECTION_FIELDS.MULTI_REF_JOBS_CUSTOM_VALUES)
  
  
    const items = [];
    let res = await q.limit(1000).find();
    items.push(...res.items);
  
    while (res.hasNext()) {
      res = await res.next();
      items.push(...res.items);
    }
    return items;
  }

  async function getAllRecordsWithoutMultiRef(collectionId) {
    const q = wixData.query(collectionId)
  
  
    const items = [];
    let res = await q.limit(1000).find();
    items.push(...res.items);
  
    while (res.hasNext()) {
      res = await res.next();
      items.push(...res.items);
    }
    return items;
  }

  function getFieldById(fieldId,allFields) {
    return allFields.find(field=>field._id===fieldId);
  }

  function getFieldByTitle(title,allFields) {
    return allFields.find(field=>field.title===title);
  }

  function getCorrectOption(value,options) {
    const standardizedValue = value.toLowerCase().trim().replace(/[^a-z0-9]/gi, '');
    return options.find(option=>option.label.toLowerCase().trim().replace(/[^a-z0-9]/gi, '')===standardizedValue);
  }

  function getOptionIndexFromCheckBox(options,value) {
    for(let index=0;index<options.length;index++) {
      if(options[index].value===value) {
        return index;
      }
    }
  }

function loadPrimarySearchRepeater(_$w) {
  
  _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOB_RESULTS_REPEATER).onItemReady(async ($item, itemData) => {
    $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_POSITION_BUTTON).label = itemData.title || '';   
  });
  
  _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOB_RESULTS_REPEATER_ITEM).onClick((event) => {
    const data = _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOB_RESULTS_REPEATER).data;
    console.log("data: ",data);
    const clickedItemData = data.find(
      (item) => item._id === event.context.itemId,
    );
    console.log("clickedItemData: ",clickedItemData);
    console.log("clickedItemData['link-jobs-title']: ",clickedItemData["link-jobs-title"]);
    // 'link-jobs-title' or 'link-copy-of-jobs-title'
    const linkKey = Object.keys(clickedItemData).find(
      key => key.startsWith('link') && key.includes('jobs') && key.includes('title')
    );
    if (linkKey && clickedItemData[linkKey]) {
      location.to(clickedItemData[linkKey]);
    }

    location.to(clickedItemData["link-jobs-title"]);
  });
  _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.CATEGORY_RESULTS_REPEATER).onItemReady(async ($item, itemData) => {
    $item(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_CATEGORY_BUTTON).label = itemData.title || '';
  }); 

  _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.CATEGORY_RESULTS_REPEATER_ITEM).onClick(async (event) => {
    const data = _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.CATEGORY_RESULTS_REPEATER).data;
    const clickedItemData = data.find(
      (item) => item._id === event.context.itemId,
    );
    const baseUrl = await location.baseUrl();
      const encodedCategory=encodeURIComponent(clickedItemData._id);
      location.to(`${baseUrl}/search?category=${encodedCategory}`);
  });

}

 function bindPrimarySearch(_$w,allvaluesobjects,alljobs) {

  const primarySearchDebounced = debounce(async () => {
    const query = (_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value || '').toLowerCase().trim();
    await primarySearch(_$w, query, alljobs);
  }, 300);

  _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).onInput(async () => {
    await primarySearchDebounced();
  });

_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).onClick(async () => {
  _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.RESULTS_CONTAINER).expand();
  if(_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value.trim()!=='') {
    await primarySearch(_$w, _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value.trim(), alljobs);
  }
  else {
  await loadCategoriesListPrimarySearch(_$w,allvaluesobjects);
  }
});

_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.RESULTS_CONTAINER).onMouseOut(async () => {
  _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.RESULTS_CONTAINER).collapse();
});

_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).onKeyPress(async (event) => {
  if( event.key==='Enter') {
    console.log("primary search input key pressed");
    console.log("_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value: ",_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value);
    if(_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value.trim()==='') {
      // _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.RESULTS_CONTAINER).collapse();
      const baseUrl = await location.baseUrl();
      location.to(`${baseUrl}/search`);

    } 
    else {
      let encodedKeyWord=encodeURIComponent(_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value);
      const baseUrl = await location.baseUrl();
       location.to(`${baseUrl}/search?keyword=${encodedKeyWord}`);
    }
  }
});

_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_BUTTON).onClick(async () => {
  console.log("primary search button clicked");
  console.log("_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value: ",_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value);
  if(_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value.trim()==='') {
    const baseUrl = await location.baseUrl();
    location.to(`${baseUrl}/search`);
  }
  else {
    let encodedKeyWord=encodeURIComponent(_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value);
    const baseUrl = await location.baseUrl();
     location.to(`${baseUrl}/search?keyword=${encodedKeyWord}`);
  }
});
  

}

async function loadCategoriesListPrimarySearch(_$w,allvaluesobjects) {
  _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_MULTI_BOX).changeState("categoryResults");
  let categoryValues=[]
  for(const value of allvaluesobjects) {
    if(value.customField===CATEGORY_CUSTOM_FIELD_ID_IN_CMS) {
      categoryValues.push({title:value.title+` (${value.count})` ,_id:value._id});
    }
  }
  _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.CATEGORY_RESULTS_REPEATER).data = categoryValues;
}

async function primarySearch(_$w,query,alljobs) {
  if(query.length===0 || query===undefined || query==='') {
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_MULTI_BOX).changeState("categoryResults");
    return false;
  }
  let filteredJobs=alljobs.filter(job=>job.title.toLowerCase().includes(query));
  if(filteredJobs.length>0) {
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_MULTI_BOX).changeState("jobResults");
  }
  else {
    console.log("searching by location")
     filteredJobs=alljobs.filter(job=>job.location.fullLocation.toLowerCase().includes(query));
    if(filteredJobs.length>0) {
      _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_MULTI_BOX).changeState("jobResults");
    }
    else{
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_MULTI_BOX).changeState("noResults");
    }
  }
  _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.JOB_RESULTS_REPEATER).data = filteredJobs
    return filteredJobs.length>0;
  
}

  async function getValueFromValueId(valueId) {
    const result=await getAllRecords(COLLECTIONS.CUSTOM_VALUES);
    console.log("result: ",result);
    console.log("valueId: ",valueId);
    return result.find(value=>value._id===valueId);
    
  }

  async function getLatestJobsByValue(Value) {
    const jobs=Value.multiRefJobsCustomValues;
    const latestJobs = jobs
    .sort((a, b) => new Date(b.releasedDate) - new Date(a.releasedDate))
    .slice(0, 5);
    return latestJobs;
  }

  module.exports = {
    groupValuesByField,
    debounce,
    getAllRecords,
    getFieldById,
    getFieldByTitle,
    getCorrectOption,
    getOptionIndexFromCheckBox,
    loadPrimarySearchRepeater,
    bindPrimarySearch,
    primarySearch,
    getLatestJobsByValue,
    getValueFromValueId,
    getAllRecordsWithoutMultiRef
}
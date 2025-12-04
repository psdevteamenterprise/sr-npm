const { items: wixData } = require('@wix/data');
const { JOBS_COLLECTION_FIELDS,COLLECTIONS } = require('../backend/collectionConsts');
const { CAREERS_MULTI_BOXES_PAGE_CONSTS, CATEGORY_CUSTOM_FIELD_ID_IN_CMS, TWG_JOBS_COLLECTION_FIELDS } = require('../backend/careersMultiBoxesPageIds');
const { location } = require("@wix/site-location");
const { normalizeString } = require('../backend/utils');
const { getFilter } = require('../public/filterUtils');

function groupValuesByField(values, refKey) {
    const map = new Map();
    for (const v of values) {
      const ref = v[refKey]; // should be the _id of the CustomFields item
      if (!map.has(ref)) map.set(ref, []);
      map.get(ref).push({
        label: v.title ,
        value: v.valueId
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

async function getAllDatasetItems(_$w, datasetSelector) {
  await _$w(datasetSelector).onReadyAsync();

  let items = [];
  let data = await _$w(datasetSelector).getItems(0, 1000);
  items.push(...data.items);

  while (_$w(datasetSelector).hasNextPage()) {
    const nextItems = await _$w(datasetSelector).nextPage();
    items.push(...nextItems);
  }

  return items;
}

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

function getCorrectOption(value,options,param) {
  const standardizedValue = normalizeString(value.toLowerCase())
  if(param==="employmenttype" || param==="Employment Type" || param==="Store Name") //employmenttype have a problematic value, added Employment Type for updateOptionsUI fuinction, added Store Name because Store name and location have for example   Blenheim
  {
    //option.value is the id, 
    return options.find(option=>normalizeString(option.value.toLowerCase())===standardizedValue);
  }
  //option.label is what we see live in the UI
  return options.find(option=>normalizeString(option.label.toLowerCase())===standardizedValue);
}

function getOptionIndexFromCheckBox(options,value) {
  const normalizedValue=normalizeString(value.toLowerCase());
  for(let index=0;index<options.length;index++) {
    if(normalizeString(options[index].value.toLowerCase())===normalizedValue) {
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
    const clickedItemData = data.find(
      (item) => item._id === event.context.itemId,
      
    );
    if(!clickedItemData[TWG_JOBS_COLLECTION_FIELDS.LINK_JOBS_TITLE] && !clickedItemData[TWG_JOBS_COLLECTION_FIELDS.LINK_JOBS_REF_ID_SLUG]) {
      console.error("clickedItemData does not have link-jobs-title or link-jobs-refId-slug");
      return;
    }

    location.to( clickedItemData[TWG_JOBS_COLLECTION_FIELDS.LINK_JOBS_TITLE]|| clickedItemData[TWG_JOBS_COLLECTION_FIELDS.LINK_JOBS_REF_ID_SLUG]);
    

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

function bindPrimarySearch(_$w, allvaluesobjects) {

const handleSearchInput = async () => { 
  const query = _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value?.toLowerCase().trim() || '';
  await primarySearch(_$w, query);
} 

const primarySearchDebounced = debounce(() => handleSearchInput(), 400);

_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).onInput(async () => { 
  await primarySearchDebounced();
});

_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).onClick(async () => {
  _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.RESULTS_CONTAINER).expand();

  if(_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value.trim()!=='') {
    const query = _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).value?.toLowerCase().trim() || '';
    await primarySearch(_$w, query);
  }
  else {
    await loadCategoriesListPrimarySearch(_$w,allvaluesobjects);
  }
});

_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.RESULTS_CONTAINER).onMouseOut(async () => {
  _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.RESULTS_CONTAINER).collapse();
});

_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_INPUT).onKeyPress(async (event) => {
  if( event.key === 'Enter') {
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

async function loadCategoriesListPrimarySearch(_$w, allvaluesobjects) {
_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_MULTI_BOX).changeState("categoryResults");

let categoryValues=[]
for(const value of allvaluesobjects) {
  if(value.customField === CATEGORY_CUSTOM_FIELD_ID_IN_CMS) {
    categoryValues.push({title: value.title+` (${value.count})` , _id: value.valueId});
  }
}
_$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.CATEGORY_RESULTS_REPEATER).data = categoryValues;
}

async function primarySearch(_$w, query) {
if(query === undefined || query === '') {
  _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_MULTI_BOX).changeState("categoryResults");
  return false;
}

const searchByTitle = [{field: 'title', searchTerm: query}];
const searchByCity = [{field: 'location.fullLocation', searchTerm: query}];

let filter = await getFilter(searchByTitle);

await _$w('#jobsDataset').setFilter(filter);
await _$w('#jobsDataset').refresh();

let count = _$w('#jobsDataset').getTotalCount();

if( count > 0 ) {
  _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.RESULTS_CONTAINER).expand();
  _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_MULTI_BOX).changeState("jobResults");
}
else {
  filter = await getFilter(searchByCity);
  await _$w('#jobsDataset').setFilter(filter);
  await _$w('#jobsDataset').refresh();

  count = _$w('#jobsDataset').getTotalCount();
  if  (count > 0) {
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.RESULTS_CONTAINER).expand();
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_MULTI_BOX).changeState("jobResults");
  }
  else{
    _$w(CAREERS_MULTI_BOXES_PAGE_CONSTS.PRIMARY_SEARCH_MULTI_BOX).changeState("noResults");
  }
}

return count > 0;
}

async function getValueFromValueId(valueId) {
const result = await getAllRecords(COLLECTIONS.CUSTOM_VALUES);
console.log("result: ",result);
console.log("valueId: ",valueId);

return result.find(value => value.valueId === valueId);
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
  getAllRecordsWithoutMultiRef,
  getAllDatasetItems
}
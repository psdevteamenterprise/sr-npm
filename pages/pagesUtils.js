const { items: wixData } = require('@wix/data');
const { JOBS_COLLECTION_FIELDS,COLLECTIONS } = require('../backend/collectionConsts');
const { normalizeString } = require('../backend/utils');

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
  getLatestJobsByValue,
  getValueFromValueId,
  getAllRecordsWithoutMultiRef,
  getAllDatasetItems
}
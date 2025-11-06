const { items: wixData } = require('@wix/data');
const { JOBS_COLLECTION_FIELDS, COLLECTIONS, CUSTOM_VALUES_COLLECTION_FIELDS } = require('../backend/collectionConsts');

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

  async function getLatestJobsByCategoryId(categoryId) {
    console.log("categoryId: ", categoryId);
    const result=await getAllRecords(COLLECTIONS.CUSTOM_VALUES);
    console.log("result: ", result);
    const categoryValue=result.filter(value=>value._id===categoryId);
    console.log("categoryValue: ", categoryValue);


  }

  module.exports = {
    groupValuesByField,
    debounce,
    getAllRecords,
    getFieldById,
    getFieldByTitle,
    getCorrectOption,
    getOptionIndexFromCheckBox,
    getLatestJobsByCategoryId
}
const { query } = require("wix-location-frontend");
const { getPositionWithMultiRefField } = require('../backend/queries');
const { COLLECTIONS,JOBS_COLLECTION_FIELDS,CUSTOM_FIELDS_COLLECTION_FIELDS } = require('../backend/collectionConsts');
const { items: wixData } = require('@wix/data');
const { location } = require("@wix/site-location");
const{isElementExistOnPage} = require('psdev-utils');
const {
    htmlToText,
    appendQueryParams
  } = require('../public/utils');
  
  


  async function positionPageOnReady(_$w) {

    await bind(_$w);
    
    

  }

async function getCategoryValueId(customValues) {
  const categoryCustomField=await wixData.query(COLLECTIONS.CUSTOM_FIELDS).eq(CUSTOM_FIELDS_COLLECTION_FIELDS.TITLE,"Category").find().then(result => result.items[0]);
  for(const value of customValues) {
    if(value.customField===categoryCustomField._id) {
      return value._id;
      
    }
  }
}


  async function bind(_$w) {
    _$w('#datasetJobsItem').onReady(async () => {

        const item = await _$w('#datasetJobsItem').getCurrentItem();
        const multiRefField=await getPositionWithMultiRefField(item._id);
        const categoryValueId=await getCategoryValueId(multiRefField);

        handleReferFriendButton(_$w,item);

        handleApplyButton(_$w,item);

        _$w('#companyDescriptionText').text = htmlToText(item.jobDescription.companyDescription.text);        
        _$w('#responsibilitiesText').text = htmlToText(item.jobDescription.jobDescription.text);
        _$w('#qualificationsText').text = htmlToText(item.jobDescription.qualifications.text);
        _$w('#relatedJobsTitleText').text = `More ${item.department} Positions`;
        if(isElementExistOnPage(_$w('#additionalInfoText')))
        {
          _$w('#additionalInfoText').text = htmlToText(item.jobDescription.additionalInformation.text);
        }
        if(_$w('#relatedJobsRepNoDepartment')) // when there is no department, we filter based on category
        {
        const relatedJobs=await getRelatedJobs(categoryValueId,item._id);
          _$w('#relatedJobsRepNoDepartment').onItemReady(($item, itemData) => {
            $item('#relatedJobTitle').text = itemData.title;
            $item('#relatedJobLocation').text = itemData.location.fullLocation;
          });
          _$w('#relatedJobsRepNoDepartment').data = relatedJobs


        }
    });
    _$w('#relatedJobsNoDepartmentItem').onClick((event) => {   
      const data = _$w("#relatedJobsRepNoDepartment").data;
      const clickedItemData = data.find(
        (item) => item._id === event.context.itemId,
      );
      location.to(clickedItemData["link-jobs-title"]);
    });
    if(isElementExistOnPage(_$w('#relatedJobsDataset')))
    {
    _$w('#relatedJobsDataset').onReady(() => {
        const count = _$w('#relatedJobsDataset').getTotalCount();
       if(!count){
            _$w('#relatedJobsSection').collapse();
       }
    });
  }
 
}
    
  function handleReferFriendButton(_$w,item) {
    if(!item.referFriendLink &&  isElementExistOnPage(_$w('#referFriendButton'))){
      console.log("hiding referFriendButton");
      _$w('#referFriendButton').hide();
    }
  }

  function handleApplyButton(_$w,item) {
    _$w('#applyButton').target="_blank";//so it can open in new tab
    const url=appendQueryParams(item.applyLink,query);
    _$w('#applyButton').link=url; //so it can be clicked
  }

  async function getRelatedJobs(categoryValueId,itemId) {
    const relatedJobs=await wixData.query(COLLECTIONS.JOBS).include(JOBS_COLLECTION_FIELDS.MULTI_REF_JOBS_CUSTOM_VALUES).hasSome(JOBS_COLLECTION_FIELDS.MULTI_REF_JOBS_CUSTOM_VALUES,[categoryValueId]).ne("_id",itemId).find();
    return relatedJobs.items;
  }

  module.exports = {
    positionPageOnReady,
  };
  
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

async function getCategoryValue(customValues) {
  const categoryCustomField=await wixData.query(COLLECTIONS.CUSTOM_FIELDS).eq(CUSTOM_FIELDS_COLLECTION_FIELDS.TITLE,"Category").find().then(result => result.items[0]);
  for(const value of customValues) {
    if(value.customField===categoryCustomField._id) {
      return value;
      
    }
  }
}


  async function bind(_$w) {
    _$w('#datasetJobsItem').onReady(async () => {

        const item = await _$w('#datasetJobsItem').getCurrentItem();
     console.log("item: ",item);

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
        if(isElementExistOnPage(_$w('#relatedJobsRepNoDepartment'))) // when there is no department, we filter based on category
        {
          
            const multiRefField=await getPositionWithMultiRefField(item._id);
            const categoryValue=await getCategoryValue(multiRefField);
            handleJobDetails(_$w,item,categoryValue);

        const relatedJobs = await getRelatedJobs({ categoryValueId:categoryValue._id, itemId: item._id ,limit:5});
          _$w('#relatedJobsRepNoDepartment').onItemReady(($item, itemData) => {
            
            $item('#relatedJobTitle').text = itemData.title;
            $item('#relatedJobLocation').text = itemData.location.fullLocation;
          });
          _$w('#relatedJobsRepNoDepartment').data = relatedJobs;


        }
    });
    if(isElementExistOnPage(_$w('#relatedJobsRepNoDepartment'))) {
    _$w('#relatedJobsNoDepartmentItem').onClick((event) => {   
      const data = _$w("#relatedJobsRepNoDepartment").data;
      const clickedItemData = data.find(
        (item) => item._id === event.context.itemId,
      );
      location.to(clickedItemData["link-jobs-title"]);
    });
  }
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
  function handleJobDetails(_$w,item,categoryValue) {
    if(isElementExistOnPage(_$w('#jobLocation'))) {
      _$w('#jobLocation').text = item.location.fullLocation;
    }
    if(isElementExistOnPage(_$w('#jobCategory'))) {
      _$w('#jobCategory').text = categoryValue.title;
    }
    if(isElementExistOnPage(_$w('#jobEmploymentTime'))) {
      _$w('#jobEmploymentTime').text = item.employmentType;
    }
    
  }
  function handleReferFriendButton(_$w,item) {
    if(!item.referFriendLink &&  isElementExistOnPage(_$w('#referFriendButton'))){
      _$w('#referFriendButton').hide();
    }
  }

  function handleApplyButton(_$w,item) {
    try{
    _$w('#applyButton').target="_blank";//so it can open in new tab
    
      const url=buildApplyLinkWithQueryParams(item.applyLink,query);
      _$w('#applyButton').link=url; //so it can be clicked
    }
    catch(error){
      console.warn("error in handleApplyButton: , using applyLink directly", error);
      _$w('#applyButton').target="_blank";
      _$w('#applyButton').link=item.applyLink;
    }
  }

  function buildApplyLinkWithQueryParams(url, query) {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      console.warn(`Invalid URL ${url}, button link will not be set`);
      return null;
    }
  
    if (!query || typeof query !== 'object') {
      console.warn(`Invalid query params ${query}, button link will not be set`);
      return null;
    }
  
    return appendQueryParams(url, query);
  }

  async function getRelatedJobs({ categoryValueId, itemId, limit = 1000 }) {
    

    const relatedJobs=await wixData.query(COLLECTIONS.JOBS).include(JOBS_COLLECTION_FIELDS.MULTI_REF_JOBS_CUSTOM_VALUES).hasSome(JOBS_COLLECTION_FIELDS.MULTI_REF_JOBS_CUSTOM_VALUES,[categoryValueId]).ne("_id",itemId).limit(limit).find();
    return relatedJobs.items;
  }

  module.exports = {
    positionPageOnReady,
  };
  
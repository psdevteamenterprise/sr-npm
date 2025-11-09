const { query } = require("wix-location-frontend");
const { getPositionWithMultiRefField } = require('../backend/queries');
const { COLLECTIONS,JOBS_COLLECTION_FIELDS,CUSTOM_FIELDS_COLLECTION_FIELDS } = require('../backend/collectionConsts');
const { items: wixData } = require('@wix/data');
const {
    htmlToText,
    appendQueryParams
  } = require('../public/utils');
  
  


  async function positionPageOnReady(_$w) {

    await bind(_$w);
    
    

  }

async function getCategoryValueId(customFields) {
  const categoryCustomField=await wixData.query(COLLECTIONS.CUSTOM_FIELDS).eq(CUSTOM_FIELDS_COLLECTION_FIELDS.TITLE,"Category").find().then(result => result.items[0]);
  console.log("categoryCustomField@@$@$@$#$@: ", categoryCustomField);
  for(const field of customFields) {
    if(field.customField===categoryCustomField._id) {
      return field._id;
      
    }
  }
}


  async function bind(_$w) {
    _$w('#datasetJobsItem').onReady(async () => {

        const item = await _$w('#datasetJobsItem').getCurrentItem();
        const multiRefField=await getPositionWithMultiRefField(item._id);
        const categoryValueId=await getCategoryValueId(multiRefField);
        console.log("multiRefField@@$@$@$#$@: ", multiRefField);
        console.log("categoryValueId@@$@$@$#$@: ", categoryValueId);

        handleReferFriendButton(_$w,item);

        handleApplyButton(_$w,item);
        console.log("i am here");

        _$w('#companyDescriptionText').text = htmlToText(item.jobDescription.companyDescription.text);        
        _$w('#responsibilitiesText').text = htmlToText(item.jobDescription.jobDescription.text);
        _$w('#qualificationsText').text = htmlToText(item.jobDescription.qualifications.text);
        _$w('#relatedJobsTitleText').text = `More ${item.department} Positions`;
        if(_$w('#additionalInfoText'))
        {
          _$w('#additionalInfoText').text = htmlToText(item.jobDescription.additionalInformation.text);
        }
        console.log("i am here 2");
        if(_$w('#relatedJobsRepNoDepartment')) // when there is no department, we filter based on category
        {
          console.log("i am here 3");
        const relatedJobs=await getRelatedJobs(categoryValueId);
        console.log("relatedJobs@@$@$@$$%%%%%%%%%%#$@: ", relatedJobs);
          _$w('#relatedJobsRepNoDepartment').onItemReady(($item, itemData) => {
            $item('#relatedJobTitle').text = itemData.title;
            $item('#relatedJobLocation').text = itemData.location.fullLocation;
            $item('#relatedJobTitle').onClick(async () => {
              await location.to(itemData["link-jobs-title"]);
            });
          });
          _$w('#relatedJobsRepNoDepartment').data = relatedJobs.slice(0,5);

        }
    });

    if(_$w('#relatedJobsDataset') && _$w('#relatedJobsDataset').length>0)
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
    if(!item.referFriendLink &&  _$w('#referFriendButton')){
      console.log("hiding referFriendButton");
      _$w('#referFriendButton').hide();
    }
  }

  function handleApplyButton(_$w,item) {
    _$w('#applyButton').target="_blank";//so it can open in new tab
    const url=appendQueryParams(item.applyLink,query);
    _$w('#applyButton').link=url; //so it can be clicked
  }

  async function getRelatedJobs(categoryValueId) {
    console.log("categoryValueId inside getRelatedJobs ", categoryValueId);
    console.log("type of categoryValueId: ", typeof categoryValueId);
    const relatedJobs=await wixData.query(COLLECTIONS.JOBS).include(JOBS_COLLECTION_FIELDS.MULTI_REF_JOBS_CUSTOM_VALUES).hasSome(JOBS_COLLECTION_FIELDS.MULTI_REF_JOBS_CUSTOM_VALUES,[categoryValueId]).find();
    console.log("relatedJobs@@$@$@$#$@: ", relatedJobs);
    return relatedJobs.items;
  }

  module.exports = {
    positionPageOnReady,
  };
  
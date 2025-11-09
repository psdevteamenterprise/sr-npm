const { query } = require("wix-location-frontend");
const {
    htmlToText,
    appendQueryParams
  } = require('../public/utils');
  
  
  async function positionPageOnReady(_$w) {

    await bind(_$w);

  }

  async function bind(_$w) {
    _$w('#datasetJobsItem').onReady(async () => {

        const item = await _$w('#datasetJobsItem').getCurrentItem();

        handleReferFriendButton(_$w,item);

        handleApplyButton(_$w,item);

        _$w('#companyDescriptionText').text = htmlToText(item.jobDescription.companyDescription.text);        
        _$w('#responsibilitiesText').text = htmlToText(item.jobDescription.jobDescription.text);
        _$w('#qualificationsText').text = htmlToText(item.jobDescription.qualifications.text);
        _$w('#relatedJobsTitleText').text = `More ${item.department} Positions`;
        if(_$w('#additionalInfoText'))
        {
          _$w('#additionalInfoText').text = htmlToText(item.jobDescription.additionalInformation.text);
        }
    });

    _$w('#relatedJobsDataset').onReady(() => {
        const count = _$w('#relatedJobsDataset').getTotalCount();
       if(!count){
            _$w('#relatedJobsSection').collapse();
       }
    });
}
    
  function handleReferFriendButton(_$w,item) {
    if(!item.referFriendLink){
      console.log("hiding referFriendButton");
      _$w('#referFriendButton').hide();
    }
  }

  function handleApplyButton(_$w,item) {
    _$w('#applyButton').target="_blank";//so it can open in new tab
    const url=appendQueryParams(item.applyLink,query);
    _$w('#applyButton').link=url; //so it can be clicked
  }

  module.exports = {
    positionPageOnReady,
  };
  
const {
    htmlToText
  } = require('../public/utils');
  const { query,queryParams } = require("wix-location-frontend");
  
  async function positionPageOnReady(_$w) {

    await bind(_$w);

  }

  async function bind(_$w) {
    _$w('#datasetJobsItem').onReady(async () => {

        const item = await _$w('#datasetJobsItem').getCurrentItem();
        handleReferFriendButton(_$w,item);
        _$w('#applyButton').onClick(()=>handleApplyButton(_$w,item));

        _$w('#companyDescriptionText').text = htmlToText(item.jobDescription.companyDescription.text);        
        _$w('#responsibilitiesText').text = htmlToText(item.jobDescription.jobDescription.text);
        _$w('#qualificationsText').text = htmlToText(item.jobDescription.qualifications.text);
        _$w('#relatedJobsTitleText').text = `More ${item.department} Positions`;
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
    console.log("item is: ", item);
    console.log(query);
    const applyLinkWithQueryParams=appendQueryParams(item.applyLink);
    console.log("applyLinkWithQueryParams is: ", applyLinkWithQueryParams);

    //wixLocationFrontend.to(item.applyLink);
  }

  function appendQueryParams(url){
    const urlObj=new URL(url);
    Object.entries(query).forEach(([key,value])=>{
      urlObj.searchParams.set(key,value);
    });
    console.log("urlObj is: ", urlObj);
    return urlObj.toString();
  }
  module.exports = {
    positionPageOnReady,
  };
  
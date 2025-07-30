const {
    htmlToText,
  } = require('../public/utils');

   function positionPageOnReady(_$w) {

     bind(_$w);
  }

   function bind(_$w) {
    _$w('#datasetJobsItem').onReady( () => {

        const item = _$w('#datasetJobsItem').getCurrentItem();

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

  
  
  module.exports = {
    positionPageOnReady,
  };
  
const {
    htmlToText,
  } = require('../public/utils');

  async function positionPageOnReady(_$w) {

    await bind(_$w);
  }

  async function bind(_$w) {
    _$w('#datasetJobsItem').onReady(async () => {

        const item = await _$w('#datasetJobsItem').getCurrentItem();
        console.log("item is: ", item);
        console.log("item.jobDescription.jobDescription.text is: ", item.jobDescription.jobDescription.text);

        _$w('#companyDescriptionText').text = htmlToText(item.jobDescription.companyDescription.text);        
        _$w('#responsibilitiesText').text = htmlToText(item.jobDescription.jobDescription.text);
        _$w('#qualificationsText').text = htmlToText(item.jobDescription.qualifications.text);
        _$w('#richContent').content = item.jobDescription.jobDescription.text;
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
  
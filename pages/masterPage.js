const{isElementExistOnPage} = require('psdev-utils');
const { location } = require("@wix/site-location");
async function masterPageOnReady(_$w) {
    if(isElementExistOnPage(_$w('#myApplicationButton'))){
        _$w('#myApplicationButton').onClick(()=>{
            location.to('https://www.smartrecruiters.com/app/employee-portal/68246e5512d84f4c00a19e62/job-applications');
        });
    }
    else{
        console.log("myApplicationButton not found");
    }
    if(isElementExistOnPage(_$w('#myReferralsButton'))){
        _$w('#myReferralsButton').onClick(()=>{
            location.to('https://www.smartrecruiters.com/app/referrals/');
        });
    }
    
    else{
        console.log("myReferralsButton not found");
    }
  }

module.exports = {
    masterPageOnReady,
  };
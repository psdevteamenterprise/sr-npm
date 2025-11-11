const{isElementExistOnPage} = require('psdev-utils');
const { location } = require("@wix/site-location");
const { LINKS } = require('../backend/consts');


async function masterPageOnReady(_$w) {
    
    bindButton(_$w,"Application");
    bindButton(_$w,"Referrals");
  }

  function bindButton(_$w,buttonName) {
    if(isElementExistOnPage(_$w(`#my${buttonName}Button`))){
        _$w(`#my${buttonName}Button`).onClick(()=>{
            location.to(LINKS[buttonName]);
        });
    }
    else{
        console.log(`${buttonName} button not found`);
    }
  }
module.exports = {
    masterPageOnReady,
  };
const{isElementExistOnPage} = require('psdev-utils');
const { location } = require("@wix/site-location");
const { LINKS } = require('../backend/consts');


let companyIdGlobal;
async function masterPageOnReady(_$w,getApiKeys) {
    const {companyId,templateType} = await getApiKeys();
    companyIdGlobal=companyId;
    bindButton(_$w,"myApplication");    
    bindButton(_$w,"myReferrals");
    bindButton(_$w,"login");
  }

  function bindButton(_$w,buttonName) {
    if(isElementExistOnPage(_$w(`#${buttonName}Button`))){
        if(buttonName==="login"){
            
            _$w(`#${buttonName}Button`).onClick(()=>{
            location.to(LINKS[buttonName].replace("${companyId}",companyIdGlobal));
            });
        }
        else{   
        _$w(`#${buttonName}Button`).onClick(()=>{
            location.to(LINKS[buttonName]);
        });
    }
    }
    else{
        console.log(`${buttonName} button not found`);
    }
  }
module.exports = {
    masterPageOnReady,
  };
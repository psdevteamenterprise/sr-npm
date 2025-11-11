const{isElementExistOnPage} = require('psdev-utils');
const { location } = require("@wix/site-location");
const { LINKS } = require('../backend/consts');
const {getApiKeys} = require('../backend/secretsData');

let companyId;
async function masterPageOnReady(_$w) {
    const {companyId,templateType} = await getApiKeys();
    this.companyId=companyId;
    console.log("companyId: ", this.companyId);
    bindButton(_$w,"myApplication");
    bindButton(_$w,"myReferrals");
    bindButton(_$w,"login");
  }

  function bindButton(_$w,buttonName) {
    if(isElementExistOnPage(_$w(`#${buttonName}Button`))){
        if(buttonName==="login"){
            
            _$w(`#${buttonName}Button`).onClick(()=>{
                console.log("login button clicked");
            location.to(LINKS[buttonName].replace("${companyId}",this.companyId));
            });
        }
        else{   
        _$w(`#${buttonName}Button`).onClick(()=>{
            console.log(`${buttonName} button clicked`);
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
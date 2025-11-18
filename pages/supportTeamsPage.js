const { getLatestJobsByValue, getValueFromValueId } = require('./pagesUtils');
const { location } = require("@wix/site-location");
const { supportTeamsPageIds } = require('../backend/consts');


let currentItem;
async function supportTeasmPageOnReady(_$w) {
    currentItem= _$w(supportTeamsPageIds.TEAM_SUPPORT_DYNAMIC_DATASET).getCurrentItem();
    console.log("currentItem: ",currentItem);
   await  handleRecentJobsSection(_$w);
    handlePeopleSection(_$w);
    handleVideoSection(_$w);
    
}

async function handleVideoSection(_$w) {
    console.log("inside video section");
    console.log("currentItem: ",currentItem);

}

async function handlePeopleSection(_$w) {
    const currentPeopleRepeaterData= _$w(supportTeamsPageIds.PEOPLE_REPEATER).data;
    console.log("currentPeopleRepeaterData: ",currentPeopleRepeaterData);
    if(currentPeopleRepeaterData.length === 0) {
        console.log("No people found , collapsing people section ");
        collapseSection(_$w,"people");
        return;
    }

    
}

async function handleRecentJobsSection(_$w) {

    
    console.log("currentItem 2 3 4:  ",currentItem);
    if(supportTeamsPageIds.excludeValues.has(currentItem.title_fld)) {
        console.log("Value is excluded , collapsing recently Jobs Section ");
        collapseSection(_$w);
        return;
    }
    const valueId=supportTeamsPageIds.valueToValueIdMap[currentItem.title_fld]
    console.log("valueId: ",valueId);
    const Value=await getValueFromValueId(valueId);
    console.log("Value: ",Value);
    if(Value===undefined) {
        console.log("Value is undefined , collapsing recently Jobs Section ");
        collapseSection(_$w,"recentJobs");
        return;
    }
    const latestsJobs=await getLatestJobsByValue(Value);

    // if(latestsJobs.length === 0) {
    //     console.log("No jobs found , collapsing recently Jobs Section ");
    //     collapseSection(_$w);
    //     return;
    // }
    _$w(supportTeamsPageIds.RECENT_JOBS_REPEATER).onItemReady(($item, itemData) => {
        $item(supportTeamsPageIds.JOB_TITLE).text = itemData.title;
        $item(supportTeamsPageIds.JOB_LOCATION).text = itemData.location.fullLocation;

    });
   
    _$w(supportTeamsPageIds.RECENT_JOBS_REPEATER).data = latestsJobs;
    _$w(supportTeamsPageIds.RECENTLEY_ADDED_JOBS_ITEM).onClick((event) => {
        const data = _$w(supportTeamsPageIds.RECENT_JOBS_REPEATER).data;
        const clickedItemData = data.find(
          (item) => item._id === event.context.itemId,
        );
        location.to(clickedItemData["link-jobs-title"]);
      });
    
    _$w(supportTeamsPageIds.SEE_ALL_JOBS_TEXT).onClick( () => {
         location.to(`/search?category=${Value.title}`);
    });
}


 function collapseSection(_$w,sectionName) {
    if(sectionName === "people") {
        _$w(supportTeamsPageIds.PEOPLE_BUTTON).collapse();
        _$w(supportTeamsPageIds.PEOPLE_TITLE).collapse();
        _$w(supportTeamsPageIds.PEOPLE_REPEATER).collapse();
    }
    else if(sectionName === "video") {
        _$w(supportTeamsPageIds.VIDEO_SECTION).collapse();
        _$w(supportTeamsPageIds.VIDEO_TITLE).collapse();
        _$w(supportTeamsPageIds.VIDEO_PLAYER).collapse();
    }
    else {
        _$w(supportTeamsPageIds.RECENT_JOBS_SECTION).collapse()
        _$w(supportTeamsPageIds.RECENT_JOBS_TITLE).collapse()
        _$w(supportTeamsPageIds.RECENT_JOBS_BUTTON).collapse()    
    }
}
module.exports = {
    supportTeasmPageOnReady,
};
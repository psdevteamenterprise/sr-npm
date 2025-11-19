const { getLatestJobsByValue, getValueFromValueId } = require('./pagesUtils');
const { location } = require("@wix/site-location");
const { supportTeamsPageIds } = require('../backend/consts');
const { getAllRecordsWithoutMultiRef } = require('./pagesUtils');

let currentItem;
async function supportTeasmPageOnReady(_$w) {
    currentItem= _$w(supportTeamsPageIds.TEAM_SUPPORT_DYNAMIC_DATASET).getCurrentItem();
   Promise.all([handleRecentJobsSection(_$w),handlePeopleSection(_$w),handleVideoSection(_$w)]);
}

async function handleVideoSection(_$w) {
    if(!currentItem.videoExists) {
        console.log("Video does not exist , collapsing video section ");
        await collapseSection(_$w,"video");
        return;
    }

}

async function handlePeopleSection(_$w) {
    const allpeoplesrecord=await getAllRecordsWithoutMultiRef("OurPeople");
    const peopleToDisplay=allpeoplesrecord.filter(person=>person.supportTeamName===currentItem._id);

    if(peopleToDisplay.length === 0) {
        console.log("No people found , collapsing people section ");
        await collapseSection(_$w,"people");
        return;
    }

    
}

async function handleRecentJobsSection(_$w) {

    
    if(supportTeamsPageIds.excludeValues.has(currentItem.title_fld)) {
        console.log("Value is excluded , collapsing recently Jobs Section ");
        await collapseSection(_$w,"recentJobs");
        return;
    }
    const valueId=supportTeamsPageIds.valueToValueIdMap[currentItem.title_fld]
    const Value=await getValueFromValueId(valueId);
    if(Value===undefined) {
        console.log("Value is undefined , collapsing recently Jobs Section ");
        await collapseSection(_$w,"recentJobs");
        return;
    }
    const latestsJobs=await getLatestJobsByValue(Value);

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
    
    _$w(supportTeamsPageIds.RECENT_JOBS_BUTTON).onClick( () => {
         location.to(`/search?category=${Value.title}`);
    });
}

 async function collapseSection(_$w,sectionName) {
    if(sectionName === "people") {
        await _$w(supportTeamsPageIds.PEOPLE_BUTTON).collapse();
      await  _$w(supportTeamsPageIds.PEOPLE_TITLE).collapse();
        await _$w(supportTeamsPageIds.PEOPLE_REPEATER).collapse();
    }
    else if(sectionName === "video") {
        await _$w(supportTeamsPageIds.VIDEO_TITLE).collapse();
       await _$w(supportTeamsPageIds.VIDEO_PLAYER).collapse();
       await _$w(supportTeamsPageIds.VIDEO_SECTION).collapse();
    }
    else {
        await _$w(supportTeamsPageIds.RECENT_JOBS_TITLE).collapse()
        await _$w(supportTeamsPageIds.RECENT_JOBS_BUTTON).collapse()    
        await _$w(supportTeamsPageIds.RECENT_JOBS_SECTION).collapse()
    }
}
module.exports = {
    supportTeasmPageOnReady,
};
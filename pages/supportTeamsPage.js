const { getLatestJobsByValue, getValueFromValueId } = require('./pagesUtils');
const { location } = require("@wix/site-location");
const { supportTeamsPageIds } = require('../backend/consts');



async function supportTeasmPageOnReady(_$w) {
    handleRecentJobsSection(_$w);
    
}



async function handleRecentJobsSection(_$w) {

    const currentItem= _$w(supportTeamsPageIds.TEAM_SUPPORT_DYNAMIC_DATASET).getCurrentItem();
    console.log("currentItem: ",currentItem);
    
    if(supportTeamsPageIds.excludeValues.has(currentItem.title_fld)) {
        console.log("Value is excluded , collapsing recently Jobs Section ");
        await collapseSection(_$w);
        return;
    }
    const valueId=supportTeamsPageIds.valueToValueIdMap[currentItem.title_fld]
    const Value=await getValueFromValueId(valueId);
    const latestsJobs=await getLatestJobsByValue(Value);

    if(latestsJobs.length === 0) {
        console.log("No jobs found , collapsing recently Jobs Section ");
        await collapseSection(_$w);
        return;
    }
    _$w(supportTeamsPageIds.RECENTLEY_ADDED_JOBS).onItemReady(($item, itemData) => {
        $item(supportTeamsPageIds.JOB_TITLE).text = itemData.title;
        $item(supportTeamsPageIds.JOB_LOCATION).text = itemData.location.fullLocation;
        $item(supportTeamsPageIds.JOB_TITLE).onClick( () => {  
             location.to(itemData["link-jobs-title"]);
          })
    });
   
    _$w(supportTeamsPageIds.RECENTLEY_ADDED_JOBS).data = latestsJobs;
    
    _$w(supportTeamsPageIds.SEE_ALL_JOBS_TEXT).onClick( () => {
         location.to(`/search?category=${Value.title}`);
    });
}


async function collapseSection(_$w) {
    Promise.all([
        _$w(supportTeamsPageIds.RECENTLY_ADDED_JOBS_SECTION).collapse(),
        _$w(supportTeamsPageIds.MOST_RECENT_JOBS_TITLE).collapse(),
        _$w(supportTeamsPageIds.SEE_ALL_JOBS_TEXT).collapse()
    ]);
}
module.exports = {
    supportTeasmPageOnReady,
};
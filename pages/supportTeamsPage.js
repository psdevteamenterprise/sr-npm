const { getLatestJobsByCategoryId } = require('./pagesUtils');
const { location } = require("@wix/site-location");
const { supportTeamsPageIds } = require('../backend/consts');



async function supportTeasmPageOnReady(_$w) {
    bind(_$w);
    
}



async function bind(_$w) {
    _$w(supportTeamsPageIds.RECENTLEY_ADDED_JOBS).onItemReady(($item, itemData) => {
        $item(supportTeamsPageIds.JOB_TITLE).text = itemData.title;
        $item(supportTeamsPageIds.JOB_LOCATION).text = itemData.location.fullLocation;
        $item(supportTeamsPageIds.JOB_TITLE).onClick(async () => {  
            await location.to(itemData["link-jobs-title"]);
          })
    });
   
    const currentItem= _$w(supportTeamsPageIds.TEAM_SUPPORT_DYNAMIC_DATASET).getCurrentItem();
    const categoryId=supportTeamsPageIds.valueToCategoryIdMap[currentItem.title_fld]
    const latestsJobs=await getLatestJobsByCategoryId(categoryId);
    _$w(supportTeamsPageIds.RECENTLEY_ADDED_JOBS).data = latestsJobs;
    
    _$w(supportTeamsPageIds.SEE_ALL_JOBS_TEXT).onClick(async () => {
        await location.to(`/search?category=${categoryId}`);
    });
}

module.exports = {
    supportTeasmPageOnReady,
};
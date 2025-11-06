const { getLatestJobsByCategory } = require('./pagesUtils');
const { location } = require("@wix/site-location");
const RECENTLEY_ADDED_JOBS="#recentleyAddedJobs"
const JOB_LOCATION="#jobLocation"
const JOB_TITLE="#jobTitle"
const TEAM_NAME="#teamName"
const SEE_ALL_JOBS_TEXT="#seeAllJobsText"

async function supportTeasmPageOnReady(_$w) {

    bindRepeater(_$w);
    loadOnClick(_$w)
}

function loadOnClick(_$w)
{
    _$w(SEE_ALL_JOBS_TEXT).onClick(async () => {
        await location.to(`/search`);
    });
}

async function bindRepeater(_$w) {
    _$w(RECENTLEY_ADDED_JOBS).onItemReady(($item, itemData) => {
        $item(JOB_TITLE).text = itemData.title;
        $item(JOB_LOCATION).text = itemData.location.fullLocation;
        $item(JOB_TITLE).onClick(async () => {
            await location.to(itemData["link-jobs-title"]);
          })
    });
  //  const teamName=_$w(TEAM_NAME).label.toLowerCase();
  //  _$w(RECENTLEY_ADDED_JOBS).data = await getLatestJobsByCategory(teamName);
}

module.exports = {
    supportTeasmPageOnReady,
};
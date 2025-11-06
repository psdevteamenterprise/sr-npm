const { getLatestJobsByCategory } = require('./pagesUtils');
const RECENTLEY_ADDED_JOBS="#recentleyAddedJobs"
const JOB_LOCATION="#jobLocation"
const JOB_TITLE="#jobTitle"
const TEAM_NAME="#teamName"

async function supportTeasmPageOnReady(_$w) {
    _$w(RECENTLEY_ADDED_JOBS).onItemReady(($item, itemData) => {
        $item(JOB_TITLE).text = itemData.title;
        $item(JOB_LOCATION).text = itemData.location.fullLocation;
    });
    const teamName=_$w(TEAM_NAME).label.toLowerCase();
    _$w(RECENTLEY_ADDED_JOBS).data = await getLatestJobsByCategory(teamName);


}

module.exports = {
    supportTeasmPageOnReady,
};
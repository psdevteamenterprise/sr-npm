const {saveJobsDataToCMS,saveJobsDescriptionsAndLocationApplyUrlReferencesToCMS,createCollections,aggregateJobs,referenceJobs,syncJobsFast} = require('./data')


const QUERY_MAX_LIMIT = 1000;

const TASKS_NAMES = {
    SYNC_JOBS: 'syncJobsFromSRAPIToCMS',
    INSERT_JOBS_TO_CMS: 'insertJobsToCMS',
    INSERT_JOBS_DESCRIPTIONS_LOCATION_APPLY_URL_REFERENCES_TO_CMS: 'insertJobsDescriptionsLocationApplyUrlReferencesToCMS',
    AGGREGATE_JOBS_BY_FIELD_TO_CMS: 'aggregateJobsByFieldToCMS',
    REFERENCE_JOBS: 'referenceJobs',
    CREATE_COLLECTIONS: 'createCollections',
    CREATE_SECRET_MANAGER_MIRROR_AND_FILL_IT: 'createSecretManagerMirrorAndFillIt',
    SYNC_JOBS_FAST: 'syncJobsFast',
}


const TASKS = {
    [TASKS_NAMES.SYNC_JOBS]: {
      name: TASKS_NAMES.SYNC_JOBS,
      childTasks: [
        { name: TASKS_NAMES.CREATE_COLLECTIONS},
        { name: TASKS_NAMES.INSERT_JOBS_TO_CMS },
        { name: TASKS_NAMES.INSERT_JOBS_DESCRIPTIONS_LOCATION_APPLY_URL_REFERENCES_TO_CMS },
        { name: TASKS_NAMES.AGGREGATE_JOBS_BY_FIELD_TO_CMS },
        {name: TASKS_NAMES.REFERENCE_JOBS},
      ],
      scheduleChildrenSequentially: true,
      estimatedDurationSec: 60,
    },
    [TASKS_NAMES.CREATE_COLLECTIONS]: {
      name: TASKS_NAMES.CREATE_COLLECTIONS,
      getIdentifier:()=> "SHOULD_NEVER_SKIP",
      process:createCollections,
      shouldSkipCheck:()=>false,
      estimatedDurationSec:7
    },
    [TASKS_NAMES.INSERT_JOBS_TO_CMS]: {
      name: TASKS_NAMES.INSERT_JOBS_TO_CMS,
      getIdentifier:()=> "SHOULD_NEVER_SKIP",
      process:saveJobsDataToCMS,
      shouldSkipCheck:()=>false,
      estimatedDurationSec:20
    },
    [TASKS_NAMES.INSERT_JOBS_DESCRIPTIONS_LOCATION_APPLY_URL_REFERENCES_TO_CMS]: {
      name: TASKS_NAMES.INSERT_JOBS_DESCRIPTIONS_LOCATION_APPLY_URL_REFERENCES_TO_CMS,
      getIdentifier:()=> "SHOULD_NEVER_SKIP",
      process:saveJobsDescriptionsAndLocationApplyUrlReferencesToCMS,
      shouldSkipCheck:()=>false,
      estimatedDurationSec:20
    },
    [TASKS_NAMES.AGGREGATE_JOBS_BY_FIELD_TO_CMS]: {
      name: TASKS_NAMES.AGGREGATE_JOBS_BY_FIELD_TO_CMS,
      getIdentifier:()=> "SHOULD_NEVER_SKIP",
      process:aggregateJobs,
      shouldSkipCheck:()=>false,
      estimatedDurationSec:6
    },
    [TASKS_NAMES.REFERENCE_JOBS]: {
      name: TASKS_NAMES.REFERENCE_JOBS,
      getIdentifier:()=> "SHOULD_NEVER_SKIP",
      process:referenceJobs,
      shouldSkipCheck:()=>false,
      estimatedDurationSec:6
    },
    [TASKS_NAMES.SYNC_JOBS_FAST]: {
      name: TASKS_NAMES.SYNC_JOBS_FAST,
      getIdentifier:()=>"SHOULD_NEVER_SKIP",
      process:syncJobsFast,
      shouldSkipCheck:()=>false,
      estimatedDurationSec:60
    }
}




const TASK_TYPE = {
  SCHEDULED: 'scheduled',
  EVENT: 'event',
};

const supportTeamsPageIds={
    PEOPLE_REPEATER: "#peopleRepeater",
    PEOPLE_BUTTON: "#peopleButton",
    PEOPLE_TITLE: "#peopleTitle",
    RECENT_JOBS_REPEATER: "#recentJobsRepeater",
    RECENT_JOBS_TITLE: "#recentJobsTitle",
    RECENT_JOBS_BUTTON: "#recentJobsButton",
    RECENT_JOBS_SECTION: "#recentJobsSection",
    VIDEO_SECTION: "#videoSection",
    VIDEO_TITLE: "#videoTitle",
    VIDEO_PLAYER: "#videoPlayer",





    RECENTLEY_ADDED_JOBS_ITEM: "#recentleyAddedJobsItem",
    JOB_LOCATION: "#jobLocation",
    JOB_TITLE: "#jobTitle",
    TEAM_SUPPORT_DYNAMIC_DATASET: "#dynamicDataset",
    valueToValueIdMap: {
        "Human Resouces":"PeopleSupport",
        "Merchandise - Buying":"Merchandise",
        "Technology, Data and Digital":"InformationServices",
        "Merchandise - Planning":"Merchandise",
        "Digital":"ecommerceandDigital",// this field doesnt exists in the database
        "Marketing and Market Media":"Marketing", 
        "Finance, Property and Legal":"Finance",// this field doesnt exists in the database
        "Services":"ServicesInstallation",
        "Merchandise - Design and Sourcing":"Merchandise",
        "Store Operations":"Operations",// this field doesnt exists in the database
        "Data":"InsightsandDataScience",// this field doesnt exists in the database
        "Property":"Property",// this field doesnt exists in the database,
        "Legal":"Legal",// this field doesnt exists in the database,
        "Supply Chain and Logistics":"Logistics",
        "Contact Centres":"CustomerEngagementCentres",// this field doesnt exists in the database
        "Commercial":"CommercialSales",// this field doesnt exists in the database
    },
    excludeValues: new Set([
        "Noel Leeming Commercial",
        "Noel Leeming Services",
        "Sustainability"
    ])
}
const LINKS={
  myApplication:'https://www.smartrecruiters.com/app/employee-portal/68246e5512d84f4c00a19e62/job-applications',
  myReferrals:'https://www.smartrecruiters.com/app/referrals/',
  login:'https://www.smartrecruiters.com/web-sso/saml/${companyId}/login',
}


const supportTeamsPageSections={
  RECENT_JOBS: "recentJobs",
  PEOPLE: "people",
  VIDEO: "video",
}

  module.exports = {
    TASKS_NAMES,
    TASK_TYPE,
    TASKS,
    QUERY_MAX_LIMIT,
    supportTeamsPageIds,
    LINKS,
    supportTeamsPageSections,
};

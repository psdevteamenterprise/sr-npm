const {saveJobsDataToCMS,saveJobsDescriptionsAndLocationApplyUrlToCMS,aggregateJobsByFieldToCMS,referenceJobsToField,createApiKeyCollectionAndFillIt,createCollections,aggregateJobs,referenceJobs} = require('./data');
const { createCollectionIfMissing } = require('@hisense-staging/velo-npm/backend');
const { COLLECTIONS, COLLECTIONS_FIELDS, JOBS_COLLECTION_FIELDS } = require('./collectionConsts');

const QUERY_MAX_LIMIT = 1000;

const TASKS_NAMES = {
    SYNC_JOBS: 'syncJobsFromSRAPIToCMS',
    INSERT_JOBS_TO_CMS: 'insertJobsToCMS',
    INSERT_JOBS_DESCRIPTIONS_LOCATION_APPLY_URL_TO_CMS: 'insertJobsDescriptionsLocationApplyUrlToCMS',
    AGGREGATE_JOBS_BY_FIELD_TO_CMS: 'aggregateJobsByFieldToCMS',
    REFERENCE_JOBS: 'referenceJobs',
    CREATE_COLLECTIONS: 'createCollections',
    CREATE_API_KEY_COLLECTION_AND_FILL_IT: 'createApiKeyCollectionAndFillIt',
}


const TASKS = {
    [TASKS_NAMES.SYNC_JOBS]: {
      name: TASKS_NAMES.SYNC_JOBS,
      childTasks: [
        { name: TASKS_NAMES.CREATE_COLLECTIONS},
        { name: TASKS_NAMES.INSERT_JOBS_TO_CMS },
        { name: TASKS_NAMES.INSERT_JOBS_DESCRIPTIONS_LOCATION_APPLY_URL_TO_CMS },
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
    [TASKS_NAMES.INSERT_JOBS_DESCRIPTIONS_LOCATION_APPLY_URL_TO_CMS]: {
      name: TASKS_NAMES.INSERT_JOBS_DESCRIPTIONS_LOCATION_APPLY_URL_TO_CMS,
      getIdentifier:()=> "SHOULD_NEVER_SKIP",
      process:saveJobsDescriptionsAndLocationApplyUrlToCMS,
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
      [TASKS_NAMES.CREATE_API_KEY_COLLECTION_AND_FILL_IT]: {
        name: TASKS_NAMES.CREATE_API_KEY_COLLECTION_AND_FILL_IT,
        getIdentifier:()=> "SHOULD_NEVER_SKIP",
        process:()=>createApiKeyCollectionAndFillIt(),
        shouldSkipCheck:()=>false,
        estimatedDurationSec:3
      }
}



const TASK_TYPE = {
  SCHEDULED: 'scheduled',
  EVENT: 'event',
};

  module.exports = {
    TASKS_NAMES,
    TASK_TYPE,
    TASKS,
    QUERY_MAX_LIMIT
};

const {saveDataJobsToCMS,saveJobsDescriptionsAndLocationApplyUrlToCMS,aggregateJobsByFieldToCMS,referenceJobsToField,createApiKeyCollectionAndFillIt} = require('./data');
const { createCollectionIfMissing } = require('@hisense-staging/velo-npm/backend');
const { COLLECTIONS, COLLECTIONS_FIELDS } = require('./collectionConsts');
const TASKS_NAMES = {
    SYNC_JOBS: 'syncJobsFromSRAPIToCMS',
    INSERT_JOBS_TO_CMS: 'insertJobsToCMS',
    INSERT_JOBS_DESCRIPTIONS_LOCATION_APPLY_URL_TO_CMS: 'insertJobsDescriptionsLocationApplyUrlToCMS',
    FILL_JOBS_PER_CITY_COLLECTION: 'fillJobsPerCityCollection',
    FILL_JOBS_PER_DEPARTMENT_COLLECTION: 'fillJobsPerDepartmentCollection',
    REFERENCE_JOBS_TO_LOCATIONS: 'referenceJobsToLocations',
    REFERENCE_JOBS_TO_DEPARTMENT: 'referenceJobsToDepartment',
    CREATE_JOBS_COLLECTION: 'createJobsCollection',
    CREATE_CITIES_COLLECTION: 'createCitiesCollection',
    CREATE_AMOUNT_OF_JOBS_PER_DEPARTMENT_COLLECTION: 'createAmountOfJobsPerDepartmentCollection',
    CREATE_API_KEY_COLLECTION_AND_FILL_IT: 'createApiKeyCollectionAndFillIt',
}


const TASKS = {
    [TASKS_NAMES.SYNC_JOBS]: {
      name: TASKS_NAMES.SYNC_JOBS,
      childTasks: [
        { name: TASKS_NAMES.CREATE_JOBS_COLLECTION },
        { name: TASKS_NAMES.CREATE_CITIES_COLLECTION },
        {name:  TASKS_NAMES.CREATE_AMOUNT_OF_JOBS_PER_DEPARTMENT_COLLECTION},
        { name: TASKS_NAMES.INSERT_JOBS_TO_CMS },
        { name: TASKS_NAMES.INSERT_JOBS_DESCRIPTIONS_LOCATION_APPLY_URL_TO_CMS },
        { name: TASKS_NAMES.FILL_JOBS_PER_CITY_COLLECTION },
        { name: TASKS_NAMES.FILL_JOBS_PER_DEPARTMENT_COLLECTION },
        { name: TASKS_NAMES.REFERENCE_JOBS_TO_LOCATIONS },
        { name: TASKS_NAMES.REFERENCE_JOBS_TO_DEPARTMENT },
      ],
      scheduleChildrenSequentially: true,
      estimatedDurationSec: 30,
    },
    [TASKS_NAMES.CREATE_JOBS_COLLECTION]: {
      name: TASKS_NAMES.CREATE_JOBS_COLLECTION,
      getIdentifier:()=> "SHOULD_NEVER_SKIP",
      process:()=>createCollectionIfMissing(COLLECTIONS.JOBS, COLLECTIONS_FIELDS.JOBS,{ insert: 'ADMIN', update: 'ADMIN', remove: 'ADMIN', read: 'ANYONE' }),
      shouldSkipCheck:()=>false,
      estimatedDurationSec:3
    },
    [TASKS_NAMES.CREATE_CITIES_COLLECTION]: {
      name: TASKS_NAMES.CREATE_CITIES_COLLECTION,
      getIdentifier:()=> "SHOULD_NEVER_SKIP",
      process:()=>createCollectionIfMissing(COLLECTIONS.CITIES, COLLECTIONS_FIELDS.CITIES),
      shouldSkipCheck:()=>false,
      estimatedDurationSec:3
    },
    [TASKS_NAMES.CREATE_AMOUNT_OF_JOBS_PER_DEPARTMENT_COLLECTION]: {
      name: TASKS_NAMES.CREATE_AMOUNT_OF_JOBS_PER_DEPARTMENT_COLLECTION,
      getIdentifier:()=> "SHOULD_NEVER_SKIP",
      process:()=>createCollectionIfMissing(COLLECTIONS.AMOUNT_OF_JOBS_PER_DEPARTMENT, COLLECTIONS_FIELDS.AMOUNT_OF_JOBS_PER_DEPARTMENT),
      shouldSkipCheck:()=>false,
      estimatedDurationSec:3
    },
    [TASKS_NAMES.INSERT_JOBS_TO_CMS]: {
      name: TASKS_NAMES.INSERT_JOBS_TO_CMS,
      getIdentifier:()=> "SHOULD_NEVER_SKIP",
      process:saveDataJobsToCMS,
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
    [TASKS_NAMES.FILL_JOBS_PER_CITY_COLLECTION]: {
        name: TASKS_NAMES.FILL_JOBS_PER_CITY_COLLECTION,
        getIdentifier:()=> "SHOULD_NEVER_SKIP",
        process:()=>aggregateJobsByFieldToCMS({ field: 'cityText', collection: COLLECTIONS.CITIES }),
        shouldSkipCheck:()=>false,
        estimatedDurationSec:3
      },
      [TASKS_NAMES.FILL_JOBS_PER_DEPARTMENT_COLLECTION]: {
        name: TASKS_NAMES.FILL_JOBS_PER_DEPARTMENT_COLLECTION,
        getIdentifier:()=> "SHOULD_NEVER_SKIP",
        process:()=>aggregateJobsByFieldToCMS({ field: 'department', collection: COLLECTIONS.AMOUNT_OF_JOBS_PER_DEPARTMENT }),
        shouldSkipCheck:()=>false,
        estimatedDurationSec:3
      },
      [TASKS_NAMES.REFERENCE_JOBS_TO_LOCATIONS]: {
        name: TASKS_NAMES.REFERENCE_JOBS_TO_LOCATIONS,
        getIdentifier:()=> "SHOULD_NEVER_SKIP",
        process:()=>referenceJobsToField({ referenceField: 'city', sourceCollection: COLLECTIONS.CITIES, jobField: 'cityText' }),
        shouldSkipCheck:()=>false,
        estimatedDurationSec:3
      },
      [TASKS_NAMES.REFERENCE_JOBS_TO_DEPARTMENT]: {
        name: TASKS_NAMES.REFERENCE_JOBS_TO_DEPARTMENT,
        getIdentifier:()=> "SHOULD_NEVER_SKIP",
        process:()=>referenceJobsToField({ referenceField: 'departmentref', sourceCollection: COLLECTIONS.AMOUNT_OF_JOBS_PER_DEPARTMENT, jobField: 'department' }),
        shouldSkipCheck:()=>false,
        estimatedDurationSec:3
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
};

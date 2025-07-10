const {
  saveJobsDataToCMS,
  saveJobsDescriptionsAndLocationToCMS,
  aggregateJobsByFieldToCMS,
  referenceJobsToField,
} = require('./data');
const { createCollectionIfMissing } = require('@hisense-staging/velo-npm/backend');

const QUERY_MAX_LIMIT = 1000;

const TASKS_NAMES = {
  SYNC_JOBS: 'syncJobsFromSRAPIToCMS',
  INSERT_JOBS_TO_CMS: 'insertJobsToCMS',
  INSERT_JOBS_DESCRIPTIONS_TO_CMS: 'insertJobsDescriptionsToCMS',
  FILL_JOBS_PER_CITY_COLLECTION: 'fillJobsPerCityCollection',
  FILL_JOBS_PER_DEPARTMENT_COLLECTION: 'fillJobsPerDepartmentCollection',
  REFERENCE_JOBS_TO_LOCATIONS: 'referenceJobsToLocations',
  REFERENCE_JOBS_TO_DEPARTMENT: 'referenceJobsToDepartment',
  CREATE_JOBS_COLLECTION: 'createJobsCollection',
  CREATE_CITIES_COLLECTION: 'createCitiesCollection',
  CREATE_AMOUNT_OF_JOBS_PER_DEPARTMENT_COLLECTION: 'createAmountOfJobsPerDepartmentCollection',
};

const TASKS = {
  [TASKS_NAMES.SYNC_JOBS]: {
    name: TASKS_NAMES.SYNC_JOBS,
    childTasks: [
      { name: TASKS_NAMES.CREATE_JOBS_COLLECTION },
      { name: TASKS_NAMES.CREATE_CITIES_COLLECTION },
      { name: TASKS_NAMES.CREATE_AMOUNT_OF_JOBS_PER_DEPARTMENT_COLLECTION },
      { name: TASKS_NAMES.INSERT_JOBS_TO_CMS },
      { name: TASKS_NAMES.INSERT_JOBS_DESCRIPTIONS_TO_CMS },
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
    getIdentifier: () => 'SHOULD_NEVER_SKIP',
    process: () => createCollectionIfMissing(COLLECTIONS.JOBS, COLLECTIONS_FIELDS.JOBS),
    shouldSkipCheck: () => false,
    estimatedDurationSec: 3,
  },
  [TASKS_NAMES.CREATE_CITIES_COLLECTION]: {
    name: TASKS_NAMES.CREATE_CITIES_COLLECTION,
    getIdentifier: () => 'SHOULD_NEVER_SKIP',
    process: () => createCollectionIfMissing(COLLECTIONS.CITIES, COLLECTIONS_FIELDS.CITIES),
    shouldSkipCheck: () => false,
    estimatedDurationSec: 3,
  },
  [TASKS_NAMES.CREATE_AMOUNT_OF_JOBS_PER_DEPARTMENT_COLLECTION]: {
    name: TASKS_NAMES.CREATE_AMOUNT_OF_JOBS_PER_DEPARTMENT_COLLECTION,
    getIdentifier: () => 'SHOULD_NEVER_SKIP',
    process: () =>
      createCollectionIfMissing(
        COLLECTIONS.AMOUNT_OF_JOBS_PER_DEPARTMENT,
        COLLECTIONS_FIELDS.AMOUNT_OF_JOBS_PER_DEPARTMENT
      ),
    shouldSkipCheck: () => false,
    estimatedDurationSec: 3,
  },
  [TASKS_NAMES.INSERT_JOBS_TO_CMS]: {
    name: TASKS_NAMES.INSERT_JOBS_TO_CMS,
    getIdentifier: () => 'SHOULD_NEVER_SKIP',
    process: saveJobsDataToCMS,
    shouldSkipCheck: () => false,
    estimatedDurationSec: 20,
  },
  [TASKS_NAMES.INSERT_JOBS_DESCRIPTIONS_TO_CMS]: {
    name: TASKS_NAMES.INSERT_JOBS_DESCRIPTIONS_TO_CMS,
    getIdentifier: () => 'SHOULD_NEVER_SKIP',
    process: saveJobsDescriptionsAndLocationToCMS,
    shouldSkipCheck: () => false,
    estimatedDurationSec: 20,
  },
  [TASKS_NAMES.FILL_JOBS_PER_CITY_COLLECTION]: {
    name: TASKS_NAMES.FILL_JOBS_PER_CITY_COLLECTION,
    getIdentifier: () => 'SHOULD_NEVER_SKIP',
    process: () =>
      aggregateJobsByFieldToCMS({
        field: COLLECTIONS_FIELDS.JOBS[6].key,
        collection: COLLECTIONS.CITIES,
      }),
    shouldSkipCheck: () => false,
    estimatedDurationSec: 3,
  },
  [TASKS_NAMES.FILL_JOBS_PER_DEPARTMENT_COLLECTION]: {
    name: TASKS_NAMES.FILL_JOBS_PER_DEPARTMENT_COLLECTION,
    getIdentifier: () => 'SHOULD_NEVER_SKIP',
    process: () =>
      aggregateJobsByFieldToCMS({
        field: COLLECTIONS_FIELDS.JOBS[3].key,
        collection: COLLECTIONS.AMOUNT_OF_JOBS_PER_DEPARTMENT,
      }),
    shouldSkipCheck: () => false,
    estimatedDurationSec: 3,
  },
  [TASKS_NAMES.REFERENCE_JOBS_TO_LOCATIONS]: {
    name: TASKS_NAMES.REFERENCE_JOBS_TO_LOCATIONS,
    getIdentifier: () => 'SHOULD_NEVER_SKIP',
    process: () =>
      referenceJobsToField({
        referenceField: COLLECTIONS_FIELDS.JOBS[8].key,
        sourceCollection: COLLECTIONS.CITIES,
        jobField: COLLECTIONS_FIELDS.JOBS[6].key,
      }),
    shouldSkipCheck: () => false,
    estimatedDurationSec: 3,
  },
  [TASKS_NAMES.REFERENCE_JOBS_TO_DEPARTMENT]: {
    name: TASKS_NAMES.REFERENCE_JOBS_TO_DEPARTMENT,
    getIdentifier: () => 'SHOULD_NEVER_SKIP',
    process: () =>
      referenceJobsToField({
        referenceField: COLLECTIONS_FIELDS.JOBS[7].key,
        sourceCollection: COLLECTIONS.AMOUNT_OF_JOBS_PER_DEPARTMENT,
        jobField: COLLECTIONS_FIELDS.JOBS[3].key,
      }),
    shouldSkipCheck: () => false,
    estimatedDurationSec: 3,
  },
};

const COLLECTIONS = {
  AMOUNT_OF_JOBS_PER_DEPARTMENT: 'AmountOfJobsPerDepartment1',
  CITIES: 'cities1',
  JOBS: 'Jobs1',
};

const COLLECTIONS_FIELDS = {
  AMOUNT_OF_JOBS_PER_DEPARTMENT: [
    { key: 'title', type: 'TEXT' },
    { key: 'count', type: 'NUMBER' },
  ],
  CITIES: [
    { key: 'title', type: 'TEXT' },
    { key: 'regionCode', type: 'TEXT' },
    { key: 'city', type: 'TEXT' },
    { key: 'location', type: 'OBJECT' },
    { key: 'count', type: 'NUMBER' },
    { key: 'country', type: 'TEXT' },
    { key: 'remote', type: 'TEXT' },
    { key: 'countryCode', type: 'TEXT' },
    { key: 'manual', type: 'TEXT' },
    { key: 'region', type: 'TEXT' },
    { key: 'latitude', type: 'NUMBER' },
    { key: 'longitude', type: 'NUMBER' },
  ],
  JOBS: [
    { key: 'location', type: 'OBJECT' },
    { key: 'postingStatus', type: 'TEXT' },
    { key: 'country', type: 'TEXT' },
    { key: 'department', type: 'TEXT' },
    { key: 'language', type: 'TEXT' },
    { key: 'jobDescription', type: 'OBJECT' },
    { key: 'cityText', type: 'TEXT' },
    {
      key: 'departmentRef',
      type: 'REFERENCE',
      typeMetadata: { reference: { referencedCollectionId: 'AmountOfJobsPerDepartment1' } },
    },
    {
      key: 'city',
      type: 'REFERENCE',
      typeMetadata: { reference: { referencedCollectionId: 'cities1' } },
    },
  ],
};

const TASK_TYPE = {
  SCHEDULED: 'scheduled',
  EVENT: 'event',
};

module.exports = {
  TASKS_NAMES,
  TASK_TYPE,
  TASKS,
  COLLECTIONS,
  QUERY_MAX_LIMIT,
};

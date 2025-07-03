import {saveDataJobsToCMS,saveJobsDescriptionsToCMS,aggregateJobsByFieldToCMS,referenceJobsToField} from './data';
const { createCollectionIfMissing } = require('@hisense-staging/velo-npm/backend');
export const TASKS_NAMES = {
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
}


export const TASKS = {
    [TASKS_NAMES.SYNC_JOBS]: {
      name: TASKS_NAMES.SYNC_JOBS,
      childTasks: [
        { name: TASKS_NAMES.CREATE_JOBS_COLLECTION },
        { name: TASKS_NAMES.CREATE_CITIES_COLLECTION },
        {name:  TASKS_NAMES.CREATE_AMOUNT_OF_JOBS_PER_DEPARTMENT_COLLECTION},
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
      getIdentifier:()=> "SHOULD_NEVER_SKIP",
      process:()=>createCollectionIfMissing(COLLECTIONS.JOBS, COLLECTIONS_FIELDS.JOBS),
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
    [TASKS_NAMES.INSERT_JOBS_DESCRIPTIONS_TO_CMS]: {
      name: TASKS_NAMES.INSERT_JOBS_DESCRIPTIONS_TO_CMS,
      getIdentifier:()=> "SHOULD_NEVER_SKIP",
      process:saveJobsDescriptionsToCMS,
      shouldSkipCheck:()=>false,
      estimatedDurationSec:20
    },
    [TASKS_NAMES.FILL_JOBS_PER_CITY_COLLECTION]: {
        name: TASKS_NAMES.FILL_JOBS_PER_CITY_COLLECTION,
        getIdentifier:()=> "SHOULD_NEVER_SKIP",
        process:()=>aggregateJobsByFieldToCMS({ field: 'cityText', collection: 'cities' }),
        shouldSkipCheck:()=>false,
        estimatedDurationSec:3
      },
      [TASKS_NAMES.FILL_JOBS_PER_DEPARTMENT_COLLECTION]: {
        name: TASKS_NAMES.FILL_JOBS_PER_DEPARTMENT_COLLECTION,
        getIdentifier:()=> "SHOULD_NEVER_SKIP",
        process:()=>aggregateJobsByFieldToCMS({ field: 'department', collection: 'AmountOfJobsPerDepartment' }),
        shouldSkipCheck:()=>false,
        estimatedDurationSec:3
      },
      [TASKS_NAMES.REFERENCE_JOBS_TO_LOCATIONS]: {
        name: TASKS_NAMES.REFERENCE_JOBS_TO_LOCATIONS,
        getIdentifier:()=> "SHOULD_NEVER_SKIP",
        process:()=>referenceJobsToField({ referenceField: 'city', sourceCollection: 'cities', jobField: 'cityText' }),
        shouldSkipCheck:()=>false,
        estimatedDurationSec:3
      },
      [TASKS_NAMES.REFERENCE_JOBS_TO_DEPARTMENT]: {
        name: TASKS_NAMES.REFERENCE_JOBS_TO_DEPARTMENT,
        getIdentifier:()=> "SHOULD_NEVER_SKIP",
        process:()=>referenceJobsToField({ referenceField: 'departmentref', sourceCollection: 'AmountOfJobsPerDepartment', jobField: 'department' }),
        shouldSkipCheck:()=>false,
        estimatedDurationSec:3
      }
}

const COLLECTIONS = {
    AMOUNT_OF_JOBS_PER_DEPARTMENT: 'AmountOfJobsPerDepartment',
    CITIES: 'cities',
    JOBS: 'Jobs',
}

const COLLECTIONS_FIELDS = {
    AMOUNT_OF_JOBS_PER_DEPARTMENT: [
      {key:'title', type: 'TEXT'},
      { key: 'count', type: 'NUMBER' },
    ],
    CITIES: [
      {key:'title', type: 'TEXT'},
      { key: 'regionCode', type: 'TEXT' },
      { key: 'city', type: 'TEXT' },
      {key:'location', type: 'OBJECT'},
      {key:'count', type: 'NUMBER'},
      {key:'country', type: 'TEXT'},
      {key:'remote', type: 'TEXT'},
      {key:'countryCode', type: 'TEXT'},
      {key:'manual', type: 'TEXT'},      
      {key:'region', type: 'TEXT'},
      {key:'latitude', type: 'NUMBER'},
      {key:'longitude', type: 'NUMBER'},
    ],
    JOBS: [
        {key:'location', type: 'OBJECT'},
        {key:'postingStatus', type: 'TEXT'},
        {key:'country', type: 'TEXT'},
        {key:'department', type: 'TEXT'},
        {key:'language', type: 'TEXT'},
        {key:'jobDescription', type: 'OBJECT'},  
        {key:'cityText', type: 'TEXT'},         
        {key:'departmentref', type: 'REFERENCE', typeMetadata: { reference: { referencedCollectionId: 'AmountOfJobsPerDepartment' } } },
        {key:'city', type: 'REFERENCE', typeMetadata: { reference: { referencedCollectionId: 'cities' } } },
    ],  
  
  };


export const TASK_TYPE = {
    SCHEDULED: 'scheduled',
    EVENT: 'event',
  };

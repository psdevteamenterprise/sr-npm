const COLLECTIONS = {
    AMOUNT_OF_JOBS_PER_DEPARTMENT: 'AmountOfJobsPerDepartment1',
    CITIES: 'cities1',
    JOBS: 'Jobs1',
    API_KEY: 'ApiKey',
}
const JOBS_COLLECTION_FIELDS = {
  LOCATION: 'location',
  TITLE: 'title',
  LOCATION_ADDRESS: 'locationAddress',
  POSTING_STATUS: 'postingStatus',
  COUNTRY: 'country',
  DEPARTMENT: 'department',
  LANGUAGE: 'language',
  REMOTE: 'remote',
  JOB_DESCRIPTION: 'jobDescription',
  DEPARTMENT_REF: 'departmentRef',
  CITY: 'city',
  CITY_TEXT: 'cityText',
}
const AMOUNT_OF_JOBS_PER_DEPARTMENT_COLLECTION_FIELDS = {
  TITLE: 'title',
  COUNT: 'count',
  IMAGE: 'image',
}
const CITIES_COLLECTION_FIELDS = {
  TITLE: 'title',
  CITY: 'city',
  LOCATION_ADDRESS: 'locationAddress',
  COUNT: 'count',
  COUNTRY: 'country',
}
const COLLECTIONS_FIELDS = {
    AMOUNT_OF_JOBS_PER_DEPARTMENT: [
      {key:'title', type: 'TEXT'},
      { key: 'count', type: 'NUMBER' },
      { key: 'image', type: 'IMAGE' },
    ],
    CITIES: [
      { key: 'title', type: 'TEXT' },
      { key: 'city', type: 'TEXT' },
      {key:'locationAddress', type: 'ADDRESS'},
      {key:'count', type: 'NUMBER'},
      {key:'country', type: 'TEXT'},
    ],
    JOBS: [
        {key:'location', type: 'OBJECT'},
        {key:'title', type: 'TEXT'},
        {key:'locationAddress', type: 'ADDRESS'},
        {key:'postingStatus', type: 'TEXT'},
        {key:'country', type: 'TEXT'},
        {key:'department', type: 'TEXT'},
        {key:'language', type: 'TEXT'},
        {key:'remote', type: 'BOOLEAN'},
        {key:'jobDescription', type: 'OBJECT'},  
        {key:'cityText', type: 'TEXT'},         
        {key:'departmentRef', type: 'REFERENCE', typeMetadata: { reference: { referencedCollectionId: 'AmountOfJobsPerDepartment1' } } },
        {key:'city', type: 'REFERENCE', typeMetadata: { reference: { referencedCollectionId: 'cities1' } } },
    ],  
    API_KEY: [
      {key:'token', type: 'TEXT'},
    ],
  };


  module.exports = {
    COLLECTIONS,
    COLLECTIONS_FIELDS,
    JOBS_COLLECTION_FIELDS,
    AMOUNT_OF_JOBS_PER_DEPARTMENT_COLLECTION_FIELDS,
    CITIES_COLLECTION_FIELDS,
};
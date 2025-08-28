const COLLECTIONS = {
    AMOUNT_OF_JOBS_PER_DEPARTMENT: 'AmountOfJobsPerDepartment',
    CITIES: 'cities',
    JOBS: 'Jobs',
    TEMPLATE_TYPE: 'templateType',
    SECRET_MANAGER_MIRROR: 'SecretManagerMirror',
}
const JOBS_COLLECTION_FIELDS = {
  LOCATION: 'location',
  TITLE: 'title',
  LOCATION_ADDRESS: 'locationAddress',
  COUNTRY: 'country',
  DEPARTMENT: 'department',
  LANGUAGE: 'language',
  REMOTE: 'remote',
  JOB_DESCRIPTION: 'jobDescription',
  DEPARTMENT_REF: 'departmentref',
  CITY: 'city',
  CITY_TEXT: 'cityText',
  IMAGE: 'image',
  APPLY_LINK: 'applyLink',
  REFER_FRIEND_LINK: 'referFriendLink',
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
        {key:'country', type: 'TEXT'},
        {key:'department', type: 'TEXT'},
        {key:'language', type: 'TEXT'},
        {key:'remote', type: 'BOOLEAN'},
        {key:'jobDescription', type: 'OBJECT'},  
        {key:'cityText', type: 'TEXT'},
        {key:'applyLink', type: 'URL'},
        {key:'referFriendLink', type: 'URL'},         
        {key:'departmentref', type: 'REFERENCE', typeMetadata: { reference: { referencedCollectionId: COLLECTIONS.AMOUNT_OF_JOBS_PER_DEPARTMENT } } },
        {key:'city', type: 'REFERENCE', typeMetadata: { reference: { referencedCollectionId: COLLECTIONS.CITIES } } },
        { key: 'image', type: 'IMAGE' },
    ],  
    TEMPLATE_TYPE: [
      {key:'templateType', type: 'TEXT'},
    ],
    SECRET_MANAGER_MIRROR: [
      {key:'tokenName', type: 'TEXT'},
      {key:'tokenValue', type: 'TEXT'},
    ],
  };


  module.exports = {
    COLLECTIONS,
    COLLECTIONS_FIELDS,
    JOBS_COLLECTION_FIELDS,
    AMOUNT_OF_JOBS_PER_DEPARTMENT_COLLECTION_FIELDS,
    CITIES_COLLECTION_FIELDS,
};
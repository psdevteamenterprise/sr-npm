const COLLECTIONS = {
    AMOUNT_OF_JOBS_PER_DEPARTMENT: 'AmountOfJobsPerDepartment',
    CITIES: 'cities',
    JOBS: 'Jobs',
    TEMPLATE_TYPE: 'templateType',
    SECRET_MANAGER_MIRROR: 'SecretManagerMirror',
    BRANDS: 'Brands',
    CUSTOM_VALUES:'CustomValues',
    CUSTOM_FIELDS:'CustomFields',
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
  BRAND: 'brand',
  BRAND_REF: 'brandRef',
  CUSTOM_VALUES: 'customValues',
}
const AMOUNT_OF_JOBS_PER_DEPARTMENT_COLLECTION_FIELDS = {
  TITLE: 'title',
  COUNT: 'count',
  IMAGE: 'image',
}
const CUSTOM_VALUES_COLLECTION_FIELDS = {
  TITLE: 'title',
  CUSTOM_FIELD: 'customField',
  JOBS: 'jobs',
}
const CUSTOM_FIELDS_COLLECTION_FIELDS = {
  TITLE: 'title',
}
const BRANDS_COLLECTION_FIELDS = {
  TITLE: 'title',
  COUNT: 'count',
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
        {key:'customValues', type: 'MULTI_REFERENCE', typeMetadata: { multiReference: { referencedCollectionId: COLLECTIONS.CUSTOM_VALUES,referencingFieldKey:'customValues',referencingDisplayName:'customValues' } } },
        {key:'cityText', type: 'TEXT'},
        {key:'applyLink', type: 'URL'},
        {key:'referFriendLink', type: 'URL'},     
        {key:'brand', type: 'TEXT'},    
        {key:'departmentref', type: 'REFERENCE', typeMetadata: { reference: { referencedCollectionId: COLLECTIONS.AMOUNT_OF_JOBS_PER_DEPARTMENT } } },
        {key:'city', type: 'REFERENCE', typeMetadata: { reference: { referencedCollectionId: COLLECTIONS.CITIES } } },
        {key:'brandRef', type: 'REFERENCE', typeMetadata: { reference: { referencedCollectionId: COLLECTIONS.BRANDS } } },
        { key: 'image', type: 'IMAGE' },
    ],  
    TEMPLATE_TYPE: [
      {key:'templateType', type: 'TEXT'},
    ],
    SECRET_MANAGER_MIRROR: [
      {key:'tokenName', type: 'TEXT'},
      {key:'value', type: 'TEXT'},
    ],
    BRANDS: [
      {key:'title', type: 'TEXT'},
      { key: 'count', type: 'NUMBER' },
    ],
    CUSTOM_VALUES: [
      {key:'title', type: 'TEXT'},
      {key:'customField', type: 'REFERENCE', typeMetadata: { reference: { referencedCollectionId: COLLECTIONS.CUSTOM_FIELDS } } },
      {key:'jobs', type: 'MULTI_REFERENCE', typeMetadata: { multiReference: { referencedCollectionId: COLLECTIONS.JOBS,referencingFieldKey:'jobs',referencingDisplayName:'jobs' } } },
    ],
    CUSTOM_FIELDS: [
      {key:'title', type: 'TEXT'},
    ],
  };


  const TEMPLATE_TYPE = {
    INTERNAL: 'INTERNAL_OR_PUBLIC',
    EXTERNAL: 'PUBLIC',
  }

  const TOKEN_NAME = {
    COMPANY_ID: 'companyId',
    SMART_TOKEN: 'x-smarttoken',
    DESIRED_BRAND: 'desiredBrand',
  }
  

  module.exports = {
    COLLECTIONS,
    COLLECTIONS_FIELDS,
    JOBS_COLLECTION_FIELDS,
    AMOUNT_OF_JOBS_PER_DEPARTMENT_COLLECTION_FIELDS,
    CITIES_COLLECTION_FIELDS,
    BRANDS_COLLECTION_FIELDS,
    CUSTOM_FIELDS_COLLECTION_FIELDS,
    CUSTOM_VALUES_COLLECTION_FIELDS,
    TEMPLATE_TYPE,
    TOKEN_NAME,
    
};
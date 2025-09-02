const COLLECTIONS = {
    AMOUNT_OF_JOBS_PER_DEPARTMENT: 'AmountOfJobsPerDepartment',
    CITIES: 'cities',
    JOBS: 'Jobs',
    TEMPLATE_TYPE: 'templateType',
    SECRET_MANAGER_MIRROR: 'SecretManagerMirror',
    BRANDS: 'Brands',
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
}
const AMOUNT_OF_JOBS_PER_DEPARTMENT_COLLECTION_FIELDS = {
  TITLE: 'title',
  COUNT: 'count',
  IMAGE: 'image',
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
      {key:'tokenValue', type: 'TEXT'},
    ],
    BRANDS: [
      {key:'title', type: 'TEXT'},
      { key: 'count', type: 'NUMBER' },
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
    TEMPLATE_TYPE,
    TOKEN_NAME,
};
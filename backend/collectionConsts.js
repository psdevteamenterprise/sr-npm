const COLLECTIONS = {
    AMOUNT_OF_JOBS_PER_DEPARTMENT: 'AmountOfJobsPerDepartment',
    CITIES: 'cities',
    JOBS: 'Jobs',
    TEMPLATE_TYPE: 'templateType',
    SECRET_MANAGER_MIRROR: 'SecretManagerMirror',
    BRANDS: 'Brands',
    CUSTOM_VALUES:'CustomValues',
    CUSTOM_FIELDS:'CustomFields',
    SITE_CONFIGS: 'SiteConfigs',
    SUPPORT_TEAMS: 'SupportTeams',

}
const JOBS_COLLECTION_FIELDS = {
  LOCATION: 'location',
  TITLE: 'title',
  SLUG: 'slug',
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
  MULTI_REF_JOBS_CUSTOM_VALUES: 'multiRefJobsCustomValues',
  EMPLOYMENT_TYPE: 'employmentType',
  RELEASED_DATE: 'releasedDate',
  REF_ID: 'refId',
}
const AMOUNT_OF_JOBS_PER_DEPARTMENT_COLLECTION_FIELDS = {
  TITLE: 'title',
  COUNT: 'count',
  IMAGE: 'image',
}
const CUSTOM_VALUES_COLLECTION_FIELDS = {
  TITLE: 'title',
  CUSTOM_FIELD: 'customField',
  MULTI_REF_JOBS_CUSTOM_VALUES: 'multiRefJobsCustomValues',
  count: 'count',
  JOB_IDS: 'jobIds',
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
  JOB_IDS: 'jobIds',
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
      {key:'jobIds', type: 'ARRAY'},
    ],
    JOBS: [
        {key:'location', type: 'OBJECT'},
        {key:'title', type: 'TEXT'},
        {key:'slug', type: 'TEXT'},
        {key:'locationAddress', type: 'ADDRESS'},
        {key:'country', type: 'TEXT'},
        {key:'department', type: 'TEXT'},
        {key:'language', type: 'TEXT'},
        {key:'remote', type: 'BOOLEAN'},
        {key:'jobDescription', type: 'OBJECT'},  
        {key:'multiRefJobsCustomValues', type: 'MULTI_REFERENCE', typeMetadata: { multiReference: { referencedCollectionId: COLLECTIONS.CUSTOM_VALUES,referencingFieldKey:JOBS_COLLECTION_FIELDS.MULTI_REF_JOBS_CUSTOM_VALUES,referencingDisplayName:JOBS_COLLECTION_FIELDS.MULTI_REF_JOBS_CUSTOM_VALUES } } },
        {key:'cityText', type: 'TEXT'},
        {key:'applyLink', type: 'URL'},
        {key:'referFriendLink', type: 'URL'},     
        {key:'brand', type: 'TEXT'},    
        {key:'departmentref', type: 'REFERENCE', typeMetadata: { reference: { referencedCollectionId: COLLECTIONS.AMOUNT_OF_JOBS_PER_DEPARTMENT } } },
        {key:'city', type: 'REFERENCE', typeMetadata: { reference: { referencedCollectionId: COLLECTIONS.CITIES } } },
        {key:'brandRef', type: 'REFERENCE', typeMetadata: { reference: { referencedCollectionId: COLLECTIONS.BRANDS } } },
        {key: 'image', type: 'IMAGE' },
        {key:'employmentType', type: 'TEXT'},
        {key:'releasedDate', type: 'TEXT'},
        {key:'refId', type: 'TEXT'},
    ],  
    TEMPLATE_TYPE: [
      {key:'templateType', type: 'TEXT'},
    ],
    SITE_CONFIGS: [
      {key:'onlyBrandKeywordUrlParams', type: 'TEXT'},
      {key:'customFields', type: 'TEXT'},
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
      {key:'count', type: 'NUMBER'},
      {key:'multiRefJobsCustomValues', type: 'MULTI_REFERENCE', typeMetadata: { multiReference: { referencedCollectionId: COLLECTIONS.JOBS,referencingFieldKey:CUSTOM_VALUES_COLLECTION_FIELDS.MULTI_REF_JOBS_CUSTOM_VALUES,referencingDisplayName:CUSTOM_VALUES_COLLECTION_FIELDS.MULTI_REF_JOBS_CUSTOM_VALUES } } },
      {key:'jobIds', type: 'ARRAY'},
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
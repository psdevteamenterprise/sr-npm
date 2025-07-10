const COLLECTIONS = {
    AMOUNT_OF_JOBS_PER_DEPARTMENT: 'AmountOfJobsPerDepartment',
    CITIES: 'cities',
    JOBS: 'Jobs',
    API_KEY: 'ApiKey',
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
    API_KEY: [
      {key:'token', type: 'TEXT'},
    ],
  };



  module.exports = {
    COLLECTIONS,
    COLLECTIONS_FIELDS,
};
const { items: wixData } = require('@wix/data');
const { fetchPositionsFromSRAPI, fetchJobDescription } = require('./fetchPositionsFromSRAPI');
const { createCollectionIfMissing } = require('@hisense-staging/velo-npm/backend');
const { COLLECTIONS, COLLECTIONS_FIELDS,JOBS_COLLECTION_FIELDS,TEMPLATE_TYPE,TOKEN_NAME,CUSTOM_VALUES_COLLECTION_FIELDS } = require('./collectionConsts');
const { chunkedBulkOperation, countJobsPerGivenField, fillCityLocationAndLocationAddress ,prepareToSaveArray,normalizeString} = require('./utils');
const { getAllPositions } = require('./queries');
const { retrieveSecretVal, getTokenFromCMS ,getApiKeys} = require('./secretsData');



let customValuesToJobs = {}
let locationToJobs = {}
let siteconfig;
const EXCLUDED_CUSTOM_FIELDS = new Set(["Department","Country"]);

function getBrand(customField) {
  return customField.find(field => field.fieldLabel === 'Brands')?.valueLabel;
}

async function getSiteConfig() {
  const queryresult = await wixData.query(COLLECTIONS.SITE_CONFIGS).find();
  siteconfig = queryresult.items[0];
}
function validatePosition(position) {
  if (!position.id) {
    throw new Error('Position id is required');
  }
  if (!position.title) {
    throw new Error('Position title is required');
  }
  if (!position.department || !position.department.label) {
    throw new Error('Position department is required and must have a label');
  }
  if (!position.location || !position.location.city ||  typeof position.location.remote !== 'boolean') {
    throw new Error('Position location is required and must have a city and remote');
  }

}

async function filterBasedOnBrand(positions) {
  try{

  const desiredBrand = await getTokenFromCMS(TOKEN_NAME.DESIRED_BRAND);
  validateSingleDesiredBrand(desiredBrand);
  console.log("filtering positions based on brand: ", desiredBrand);
  return positions.content.filter(position => {
    const brand = getBrand(position.customField);
    if (!brand) return false;
    return brand === desiredBrand;
  });
} catch (error) {
  if(error.message==="[getTokenFromCMS], No desiredBrand found")
  {
    console.log("no desiredBrand found, fetching all positions")
    return positions.content;
  }
  throw error;
}
}

function validateSingleDesiredBrand(desiredBrand) {
  if(typeof desiredBrand !== 'string' || desiredBrand.includes("[") || desiredBrand.includes("]") || desiredBrand.includes(",")){
    throw new Error("Desired brand must be a single brand");
  }
}
function getLocation(position,basicJob) {

  locationToJobs[basicJob.cityText] ? locationToJobs[basicJob.cityText].push(position.id) : locationToJobs[basicJob.cityText]=[position.id]

}
function getVisibility(position,customFieldsValues) {
  if (!customFieldsValues["Visibility"]) {
    customFieldsValues["Visibility"] = {};
  }
  let visibility;
  position.visibility.toLowerCase()==="public"? visibility="external" : visibility="internal";
  customFieldsValues["Visibility"][visibility] = visibility;
  customValuesToJobs[visibility] ? customValuesToJobs[visibility].add(position.id) : customValuesToJobs[visibility]=new Set([position.id])
}

function getEmploymentType(position,customFieldsValues) {
  if (!customFieldsValues["employmentType"]) {
    customFieldsValues["employmentType"] = {};
  }
  customFieldsValues["employmentType"][position.typeOfEmployment.id] = position.typeOfEmployment.label;
  customValuesToJobs[position.typeOfEmployment.id] ? customValuesToJobs[position.typeOfEmployment.id].add(position.id) : customValuesToJobs[position.typeOfEmployment.id]=new Set([position.id])
}

function getCustomFieldsAndValuesFromPosition(position,customFieldsLabels,customFieldsValues) {
  const customFieldsArray = Array.isArray(position?.customField) ? position.customField : [];
  for (const field of customFieldsArray) {
    if(EXCLUDED_CUSTOM_FIELDS.has(field.fieldLabel)) continue; //country and department are not custom fields, they are already in the job object
    const fieldId=normalizeString(field.fieldId)
    const fieldLabel = field.fieldLabel;
    const valueId=normalizeString(field.valueId)
    const valueLabel = field.valueLabel
    customFieldsLabels[fieldId] = fieldLabel
    // Build nested dictionary: fieldId -> { valueId: valueLabel }
    if (!customFieldsValues[fieldId]) {
      customFieldsValues[fieldId] = {};
    }
    customFieldsValues[fieldId][valueId] = valueLabel;

    customValuesToJobs[valueId] ? customValuesToJobs[valueId].add(position.id) : customValuesToJobs[valueId]=new Set([position.id])
  }
}
async function saveJobsDataToCMS() {
  const positions = await fetchPositionsFromSRAPI();
  const sourcePositions = await filterBasedOnBrand(positions);
  const customFieldsLabels = {}
  const customFieldsValues = {}
  
  const {companyId,templateType} = await getApiKeys();
  if(siteconfig===undefined) {
    await getSiteConfig();
  }
  // bulk insert to jobs collection without descriptions first
  const jobsData = sourcePositions.map(position => {
    
    const basicJob = {
      _id: position.id,
      title: position.name || '',
      department: position.department?.label || 'Other',
      cityText: normalizeString(position.location?.city),
      location: position.location && Object.keys(position.location).length > 0
        ? position.location
        : {
            countryCode: "",
            country: "",
            city: "",
            postalCode: "",
            address: "",
            manual: false,
            remote: false,
            regionCode: ""
          },
      country: position.location?.country || '',
      remote: position.location?.remote || false,
      language: position.language?.label || '',
      brand: siteconfig.disableMultiBrand==="false" ? getBrand(position.customField) : '',
      jobDescription: null, // Will be filled later
      employmentType: position.typeOfEmployment.label,
      releasedDate: position.releasedDate
    };

    getCustomFieldsAndValuesFromPosition(position,customFieldsLabels,customFieldsValues);
    getEmploymentType(position,customFieldsValues);
    getLocation(position,basicJob);
    if(templateType===TEMPLATE_TYPE.INTERNAL){
     getVisibility(position,customFieldsValues);
    }
    return basicJob;
  });

  if (siteconfig.customFields==="true") {
  await populateCustomFieldsCollection(customFieldsLabels,templateType);
  await populateCustomValuesCollection(customFieldsValues);
  }
  // Sort jobs by title (ascending, case-insensitive, numeric-aware)
  jobsData.sort((a, b) => {
    const titleA = a.title || '';
    const titleB = b.title || '';
    return titleA.localeCompare(titleB, undefined, { sensitivity: 'base', numeric: true });
  });

  const chunkSize = 1000;
  let totalSaved = 0;
  const totalChunks = Math.ceil(jobsData.length / chunkSize);

  console.log(
    `Processing ${jobsData.length} jobs in ${totalChunks} chunks of max ${chunkSize} items each`
  );
  console.log("truncating jobs collection");
  await wixData.truncate(COLLECTIONS.JOBS);
  await chunkedBulkOperation({
    items: jobsData,
    chunkSize,
    processChunk: async (chunk, chunkNumber) => {
      console.log(`Saving chunk ${chunkNumber}/${totalChunks}: ${chunk.length} jobs`);
      try {
        const result = await wixData.bulkSave(COLLECTIONS.JOBS, chunk);
        const saved = result.inserted + result.updated || chunk.length;
        totalSaved += saved;
        console.log(
          `✓ Chunk ${chunkNumber} saved successfully. Inserted: ${result.inserted}, Updated: ${result.updated}`
        );
      } catch (error) {
        console.error(`✗ Error saving chunk ${chunkNumber}:`, error);
        throw error;
      }
    },
  });
  console.log(`✓ All chunks processed. Total jobs saved: ${totalSaved}/${jobsData.length}`);
}

async function insertJobsReference(valueId) {
  await wixData.insertReference(COLLECTIONS.CUSTOM_VALUES, CUSTOM_VALUES_COLLECTION_FIELDS.MULTI_REF_JOBS_CUSTOM_VALUES,valueId, Array.from(customValuesToJobs[valueId]));
}

async function populateCustomFieldsCollection(customFields,templateType) {
  let fieldstoinsert=[]
  customFields["employmentType"] = "Employment Type";
  if(templateType===TEMPLATE_TYPE.INTERNAL){
    customFields["Visibility"] = "Visibility";
  }
  for(const ID of Object.keys(customFields)){
    fieldstoinsert.push({
      title: customFields[ID],
      _id: ID,
    })
  }
  await wixData.bulkSave(COLLECTIONS.CUSTOM_FIELDS, fieldstoinsert);
}
async function populateCustomValuesCollection(customFieldsValues) {
  let valuesToinsert=[]
  for (const fieldId of Object.keys(customFieldsValues)) {
    const valuesMap = customFieldsValues[fieldId] || {};
    for (const valueId of Object.keys(valuesMap)) {
      valuesToinsert.push({
        _id: valueId,
        title: valuesMap[valueId],
        customField: fieldId,
        count:customValuesToJobs[valueId].size,
        jobIds:Array.from(customValuesToJobs[valueId]),
      })
    }
    
  }
  await wixData.bulkSave(COLLECTIONS.CUSTOM_VALUES, valuesToinsert);
}
async function saveJobsDescriptionsAndLocationApplyUrlReferencesToCMS() {
  console.log('🚀 Starting job descriptions update process for ALL jobs');

  try {
    let jobsWithNoDescriptions = await getJobsWithNoDescriptions();
    if (siteconfig.customFields==="true") {
      let customValues=await getAllCustomValues();
      console.log("inserting jobs references to custom values collection");
      console.log("customValues: ",customValues)
      console.log("customValues.items: ",customValues.items)
      for (const value of customValues.items) {
        await insertJobsReference(value._id);
      }
      console.log("inserted jobs references to custom values collection successfully");
    }
  
    let totalUpdated = 0;
    let totalFailed = 0;
    let totalProcessed = 0;

    console.log(
      `Total jobs in database without descriptions:  ${jobsWithNoDescriptions?.items?.length}`
    );

    if (jobsWithNoDescriptions.items.length === 0) {
      console.log('No jobs found in database');
      return { success: true, message: 'No jobs found' };
    }


    const API_CHUNK_SIZE = 80;
    const pageChunks = Math.ceil(jobsWithNoDescriptions.items.length / API_CHUNK_SIZE);

    await chunkedBulkOperation({
      items: jobsWithNoDescriptions.items,
      chunkSize: API_CHUNK_SIZE,
      processChunk: async (chunk, chunkNumber) => {
        console.log(`  Processing API chunk ${chunkNumber}/${pageChunks} (${chunk.length} jobs)`);
        const chunkPromises = chunk.map(async job => {
          try {
            const jobDetails = await fetchJobDescription(job._id);
            const jobLocation = fetchJobLocation(jobDetails);
            const {applyLink , referFriendLink} = fetchApplyAndReferFriendLink(jobDetails);

            
            const updatedJob = {
              ...job,
              locationAddress: jobLocation,
              jobDescription: jobDetails.jobAd.sections,
              applyLink: applyLink,
              referFriendLink: referFriendLink,
            };
            await wixData.update(COLLECTIONS.JOBS, updatedJob);
            return { success: true, jobId: job._id, title: job.title };
          } catch (error) {
            console.error(`    ❌ Failed to update ${job.title} (${job._id}):`, error);
            return { success: false, jobId: job._id, title: job.title, error: error.message };
          }
        });
        const chunkResults = await Promise.all(chunkPromises);
        const chunkSuccesses = chunkResults.filter(r => r.success).length;
        const chunkFailures = chunkResults.filter(r => !r.success).length;
        totalUpdated += chunkSuccesses;
        totalFailed += chunkFailures;
        totalProcessed += chunk.length;
        console.log(
          `  API chunk ${chunkNumber} completed: ${chunkSuccesses} success, ${chunkFailures} failed`
        );
      },
    });



    console.log(`\n✅ Finished updating ALL job descriptions`);
    console.log(`📊 Final Results:`);
    console.log(`   Total jobs processed: ${totalProcessed}`);
    console.log(`   Total updated: ${totalUpdated}`);
    console.log(`   Total failed: ${totalFailed}`);

    return {
      success: true,
      totalProcessed: totalProcessed,
      totalUpdated: totalUpdated,
      totalFailed: totalFailed,
      message: `Successfully updated ${totalUpdated} job descriptions out of ${totalProcessed} total jobs`,
    };
  } catch (error) {
    console.error('❌ Error in updateJobDescriptions:', error);
    throw error;
  }
}


function iterateOverAllJobs(results, field) {
  const jobsPerField = {};
  const cityLocations = {};
  const citylocationAddress = {};
    countJobsPerGivenField(results, field, jobsPerField);
    if (field === 'cityText') {
      fillCityLocationAndLocationAddress(results, cityLocations,citylocationAddress);
    }
    return { jobsPerField, cityLocations,citylocationAddress };
}

async function aggregateJobsByFieldToCMS({ field, collection }) {
  console.log(`counting jobs per ${field}.`);
  let results = await getAllPositions();
  const { jobsPerField, cityLocations,citylocationAddress } = iterateOverAllJobs(results, field);
  const toSave = prepareToSaveArray(jobsPerField, cityLocations, field,citylocationAddress,locationToJobs);
  if (toSave.length === 0) {
    console.log('No jobs found.');
    return { success: true, message: 'No jobs to save.' };
  }
  try {
    console.log("saving to collection: ", collection);
    console.log("toSave: ", toSave);
    const saveResult = await wixData.bulkSave(collection, toSave);
    console.log(`Saved ${toSave.length} ${field} counts to ${collection}.`);
    return { success: true, saved: toSave.length, result: saveResult };
  } catch (err) {
    console.error(`Error saving jobs per ${field}:`, err);
    return { success: false, error: err.message };
  }
}
async function getAllCustomValues() {
  let customValuesQuery = await wixData.query(COLLECTIONS.CUSTOM_VALUES).limit(1000).find();
  return customValuesQuery;
}
async function getJobsWithNoDescriptions() {
  let jobswithoutdescriptionsQuery = await wixData
    .query(COLLECTIONS.JOBS)
    .limit(1000)
    .isEmpty('jobDescription')
    .find();
  return jobswithoutdescriptionsQuery;
}

/**
 * @param {Object} params
 * @param {JOBS_COLLECTION_FIELDS.CITY|JOBS_COLLECTION_FIELDS.DEPARTMENT_REF} params.referenceField
 * @param {COLLECTIONS.CITIES|COLLECTIONS.AMOUNT_OF_JOBS_PER_DEPARTMENT} params.sourceCollection
 * @param {JOBS_COLLECTION_FIELDS.CITY_TEXT|JOBS_COLLECTION_FIELDS.DEPARTMENT} params.jobField
 */
async function referenceJobsToField({ referenceField, sourceCollection, jobField }) {
  // Fetch all source items (cities or departments)
  const sources = await wixData.query(sourceCollection).limit(1000).find();
  const sourceMap = {};
  for (const item of sources.items) {
    sourceMap[item.title] = item._id;
  }

  // Fetch all jobs
  let jobsResults = await getAllPositions();
  let jobsToUpdate = [];
  
  for (const job of jobsResults) {
    const refId = sourceMap[job[jobField]];
    if (refId) {
      jobsToUpdate.push({
        ...job,
        [referenceField]: refId,
      });
    }
  }

  // Remove system fields that cannot be updated
  jobsToUpdate = jobsToUpdate.map(job => {
    const { _createdDate, _updatedDate, ...rest } = job;
    return rest;
  });

  
  // Bulk update in chunks of 1000
  const chunkSize = 1000;
  await chunkedBulkOperation({
    items: jobsToUpdate,
    chunkSize,
    processChunk: async chunk => {
      await wixData.bulkUpdate(COLLECTIONS.JOBS, chunk);
    },
  });

  return { success: true, updated: jobsToUpdate.length };
}

function fetchApplyAndReferFriendLink(jobDetails) {
    return {applyLink: jobDetails.applyUrl, referFriendLink: jobDetails.referralUrl};
}

function fetchJobLocation(jobDetails) {
    const jobLocation = {
        location:  {
            latitude: parseFloat(jobDetails.location.latitude),
            longitude: parseFloat(jobDetails.location.longitude)
        },
    city: jobDetails.location.city,
    country: jobDetails.location.country,
    formatted: [
      jobDetails.location.city,
      jobDetails.location.region,
      jobDetails.location.regionCode,
      jobDetails.location.country,
    ]
      .filter(Boolean)
      .join(', '),
    streetAddress: {},
    subdivision: '',
    postalCode: '',
  };
  return jobLocation;
}



async function createCollections() {
  throw new Error("test");
  console.log("Creating collections");
  await Promise.all(
  [createCollectionIfMissing(COLLECTIONS.JOBS, COLLECTIONS_FIELDS.JOBS,{ insert: 'ADMIN', update: 'ADMIN', remove: 'ADMIN', read: 'ANYONE' }),
  createCollectionIfMissing(COLLECTIONS.CITIES, COLLECTIONS_FIELDS.CITIES),
  createCollectionIfMissing(COLLECTIONS.AMOUNT_OF_JOBS_PER_DEPARTMENT, COLLECTIONS_FIELDS.AMOUNT_OF_JOBS_PER_DEPARTMENT),
  createCollectionIfMissing(COLLECTIONS.SECRET_MANAGER_MIRROR, COLLECTIONS_FIELDS.SECRET_MANAGER_MIRROR),
  createCollectionIfMissing(COLLECTIONS.BRANDS, COLLECTIONS_FIELDS.BRANDS),
  createCollectionIfMissing(COLLECTIONS.CUSTOM_VALUES, COLLECTIONS_FIELDS.CUSTOM_VALUES),
  createCollectionIfMissing(COLLECTIONS.CUSTOM_FIELDS, COLLECTIONS_FIELDS.CUSTOM_FIELDS)
]);
  console.log("finished creating Collections");
}

async function aggregateJobs() {
  console.log("Aggregating jobs");
  await Promise.all([
    aggregateJobsByFieldToCMS({ field: JOBS_COLLECTION_FIELDS.DEPARTMENT, collection: COLLECTIONS.AMOUNT_OF_JOBS_PER_DEPARTMENT }),
    aggregateJobsByFieldToCMS({ field: JOBS_COLLECTION_FIELDS.CITY_TEXT, collection: COLLECTIONS.CITIES }),
    aggregateJobsByFieldToCMS({ field: JOBS_COLLECTION_FIELDS.BRAND, collection: COLLECTIONS.BRANDS })
  ]);
  console.log("finished aggregating jobs");
}

async function referenceJobs() {
  console.log("Reference jobs");
  if(siteconfig===undefined) {
    await getSiteConfig();
  }
  await referenceJobsToField({ referenceField: JOBS_COLLECTION_FIELDS.DEPARTMENT_REF, sourceCollection: COLLECTIONS.AMOUNT_OF_JOBS_PER_DEPARTMENT, jobField: JOBS_COLLECTION_FIELDS.DEPARTMENT });
  await referenceJobsToField({ referenceField: JOBS_COLLECTION_FIELDS.CITY, sourceCollection: COLLECTIONS.CITIES, jobField: JOBS_COLLECTION_FIELDS.CITY_TEXT });
  if(siteconfig.disableMultiBrand==="false"){
    await referenceJobsToField({ referenceField: JOBS_COLLECTION_FIELDS.BRAND_REF, sourceCollection: COLLECTIONS.BRANDS, jobField: JOBS_COLLECTION_FIELDS.BRAND });
  }
  
  console.log("finished referencing jobs");
}

async function syncJobsFast() {
  try{
  console.log("Syncing jobs fast");
  await createCollections();
  await clearCollections();
  await fillSecretManagerMirror();
  console.log("saving jobs data to CMS");
  await saveJobsDataToCMS();
  console.log("saved jobs data to CMS successfully");
  console.log("saving jobs descriptions and location apply url to CMS");
  await saveJobsDescriptionsAndLocationApplyUrlReferencesToCMS();
  console.log("saved jobs descriptions and location apply url to CMS successfully");
  await aggregateJobs();
  await referenceJobs();
  console.log("syncing jobs fast finished successfully");
  }
  catch (error) {
    console.error("Error syncing jobs:", error);
    throw error;
  }
}


async function clearCollections() {
  console.log("clearing collections");
  await Promise.all([
    wixData.truncate(COLLECTIONS.CITIES),
    wixData.truncate(COLLECTIONS.AMOUNT_OF_JOBS_PER_DEPARTMENT),
    wixData.truncate(COLLECTIONS.JOBS),
    wixData.truncate(COLLECTIONS.BRANDS),
    wixData.truncate(COLLECTIONS.CUSTOM_VALUES),
    wixData.truncate(COLLECTIONS.CUSTOM_FIELDS),
  ]);
  console.log("cleared collections successfully");
}

async function markTemplateAsExternal() {
  await createCollectionIfMissing(COLLECTIONS.TEMPLATE_TYPE, COLLECTIONS_FIELDS.TEMPLATE_TYPE,null,'singleItem');
  const tempalte = await wixData.save(COLLECTIONS.TEMPLATE_TYPE, {
    templateType: TEMPLATE_TYPE.EXTERNAL
  });
  return tempalte;
}

async function markTemplateAsInternal() {
  await createCollectionIfMissing(COLLECTIONS.TEMPLATE_TYPE, COLLECTIONS_FIELDS.TEMPLATE_TYPE,null,'singleItem');
  const tempalte = await wixData.save(COLLECTIONS.TEMPLATE_TYPE, {
    templateType: TEMPLATE_TYPE.INTERNAL
  });
  return tempalte;
}

async function fillSecretManagerMirror() {
  for(const tokenName of Object.values(TOKEN_NAME)){
    try{
      await insertSecretValToCMS(tokenName);
      console.log("inserted ", tokenName, "into the SecretManagerMirror collection successfully");
    } catch (error) {
      console.warn("Error with inserting ", tokenName, "into the SecretManagerMirror collection:", error);
    }
  }
}

async function insertSecretValToCMS(tokenName) {
  const token = await retrieveSecretVal(tokenName);
  console.log("token is: ", token);
  await wixData.save(COLLECTIONS.SECRET_MANAGER_MIRROR, {
    tokenName: tokenName,
    value: token.value,
    _id: normalizeString(tokenName)
  });
}


module.exports = {
  syncJobsFast,
  referenceJobs,
  aggregateJobs,
  createCollections,
  saveJobsDataToCMS,
  saveJobsDescriptionsAndLocationApplyUrlReferencesToCMS,
  aggregateJobsByFieldToCMS,
  referenceJobsToField,
  fillSecretManagerMirror,
  markTemplateAsExternal,
  markTemplateAsInternal,
};

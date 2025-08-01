const { items: wixData, collections } = require('@wix/data');
const { fetchPositionsFromSRAPI, fetchJobDescription } = require('./fetchPositionsFromSRAPI');
const { createCollectionIfMissing } = require('@hisense-staging/velo-npm/backend');
const { COLLECTIONS, COLLECTIONS_FIELDS,JOBS_COLLECTION_FIELDS } = require('./collectionConsts');
const { secrets } = require("@wix/secrets");
const { auth } = require('@wix/essentials');
const { chunkedBulkOperation, delay, countJobsPerGivenField, fillCityLocationAndLocationAddress ,prepareToSaveArray,normalizeCityName} = require('./utils');
const { getAllPositions } = require('./queries');


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
  if (!position.location || !position.location.city || !position.location.remote) {
    throw new Error('Position location is required and must have a city and remote');
  }

}

async function saveJobsDataToCMS() {
  const positions = await fetchPositionsFromSRAPI();
  // bulk insert to jobs collection without descriptions first
  const jobsData = positions.content.map(position => {
    validatePosition(position);
    const basicJob = {
      _id: position.id,
      title: position.title,
      department: position.department.label,
      cityText: normalizeCityName(position.location.city),
      location: position.location,
      country: position.location.country,
      remote: position.location.remote,
      language: position.language.label,
      postingStatus: position.postingStatus,
      jobDescription: null, // Will be filled later
    };
    return basicJob;
  });

  const chunkSize = 1000;
  let totalSaved = 0;
  const totalChunks = Math.ceil(jobsData.length / chunkSize);

  console.log(
    `Processing ${jobsData.length} jobs in ${totalChunks} chunks of max ${chunkSize} items each`
  );

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

async function saveJobsDescriptionsAndLocationApplyUrlToCMS() {
  console.log('🚀 Starting job descriptions update process for ALL jobs');

  try {
    let jobsWithNoDescriptions = await getJobsWithNoDescriptions();
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
            const applyLink = fetchApplyLink(jobDetails);


            const updatedJob = {
              ...job,
              locationAddress: jobLocation,
              jobDescription: jobDetails.jobAd.sections,
              applyLink: applyLink,
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
        if (chunkNumber * API_CHUNK_SIZE < jobsWithNoDescriptions.items.length) {
          console.log('  Waiting 2 seconds before next API chunk...');
          await delay(2000);
        }
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
  const toSave = prepareToSaveArray(jobsPerField, cityLocations, field,citylocationAddress);
  if (toSave.length === 0) {
    console.log('No jobs found.');
    return { success: true, message: 'No jobs to save.' };
  }
  try {
    const saveResult = await wixData.bulkSave(collection, toSave);
    console.log(`Saved ${toSave.length} ${field} counts to ${collection}.`);
    return { success: true, saved: toSave.length, result: saveResult };
  } catch (err) {
    console.error(`Error saving jobs per ${field}:`, err);
    return { success: false, error: err.message };
  }
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

function fetchApplyLink(jobDetails) {
    return jobDetails.actions.applyOnWeb.url;
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


function getSmartToken() {
  const elevatedGetSecretValue = auth.elevate(secrets.getSecretValue);
  return elevatedGetSecretValue("x-smarttoken")
    .then((secret) => {
      return secret;
    })
    .catch((error) => {
      console.error(error);
      throw error;
    });
}


async function createApiKeyCollectionAndFillIt() {
    console.log("Creating ApiKey collection and filling it with the smart token");
    await createCollectionIfMissing(COLLECTIONS.API_KEY, COLLECTIONS_FIELDS.API_KEY,null,'singleItem');
    console.log("Getting the smart token");
    const token = await getSmartToken();
    console.log("token is :  ", token);
    console.log("Inserting the smart token into the ApiKey collection");
    await wixData.insert(COLLECTIONS.API_KEY, {
        token: token.value
    });

    console.log("Smart token inserted into the ApiKey collection");
}


module.exports = {
    saveJobsDataToCMS,
    saveJobsDescriptionsAndLocationApplyUrlToCMS,
    aggregateJobsByFieldToCMS,
    referenceJobsToField,
    createApiKeyCollectionAndFillIt,
};

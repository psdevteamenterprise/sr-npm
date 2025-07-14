const { items: wixData } = require('@wix/data');
const { fetchPositionsFromSRAPI, fetchJobDescription } = require('./fetchPositionsFromSRAPI');
const { createCollectionIfMissing } = require('@hisense-staging/velo-npm/backend');
const { COLLECTIONS, COLLECTIONS_FIELDS } = require('./collectionConsts');
const { secrets } = require("@wix/secrets");
const { auth } = require('@wix/essentials');
const { chunkedBulkOperation, delay, countJobsPerGivenField, fillCityLocation ,prepateToSaveArray,normalizeCityName} = require('./utils');
const { getAllPositions } = require('./queries');



async function saveJobsDataToCMS() {
  const positions = await fetchPositionsFromSRAPI();
  // bulk insert to jobs collection without descriptions first
  const jobsData = positions.content.map(position => {
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
        const result = await wixData.bulkSave('Jobs1', chunk);
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

async function saveJobsDescriptionsAndLocationToCMS() {
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

            const updatedJob = {
              ...job,
              locationAddress: jobLocation,
              jobDescription: jobDetails.jobAd.sections,
            };
            await wixData.update('Jobs1', updatedJob);
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
    countJobsPerGivenField(results, field, jobsPerField);
    if (field === 'cityText') {
      fillCityLocation(results, cityLocations);
    }
    return { jobsPerField, cityLocations };
}

async function aggregateJobsByFieldToCMS({ field, collection }) {
  console.log(`counting jobs per ${field}.`);
  let results = await getAllPositions();
  const { jobsPerField, cityLocations } = iterateOverAllJobs(results, field);
  const toSave = prepateToSaveArray(jobsPerField, cityLocations, field);
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
    .query('Jobs1')
    .limit(1000)
    .isEmpty('jobDescription')
    .find();
  return jobswithoutdescriptionsQuery;
}

/**
 * @param {Object} params
 * @param {"city"|"departmentRef"} params.referenceField
 * @param {"cities1"|"AmountOfJobsPerDepartment1"} params.sourceCollection
 * @param {"cityText"|"department"} params.jobField
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
      await wixData.bulkUpdate('Jobs1', chunk);
    },
  });

  return { success: true, updated: jobsToUpdate.length };
}

function fetchJobLocation(jobDetails) {
  const isZeroLocation =
    jobDetails.location.latitude === '0.0000' && jobDetails.location.longitude === '0.0000';
  const jobLocation = {
    location: isZeroLocation
      ? {}
      : {
          latitude: parseFloat(jobDetails.location.latitude),
          longitude: parseFloat(jobDetails.location.longitude),
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
    saveJobsDescriptionsAndLocationToCMS,
    aggregateJobsByFieldToCMS,
    referenceJobsToField,
    createApiKeyCollectionAndFillIt,
};

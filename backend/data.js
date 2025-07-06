const { items: wixData } = require('@wix/data');
const { fetchPositionsFromSRAPI, fetchJobDescription } = require('./fetchPositionsFromSRAPI');
const { chunkedBulkOperation } = require('./utils');

// Utility function to normalize city names
function normalizeCityName(city) {
    if (!city) return city;
    // Remove accents/diacritics, trim whitespace
    return city.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
}

async function saveDataJobsToCMS() {
    const positions = await fetchPositionsFromSRAPI();
    // bulk insert to jobs collection without descriptions first
    const jobsData = positions.content.map((position) => {
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
            jobDescription: null // Will be filled later
        }
        return basicJob;
    });
    
    const chunkSize = 1000;
    let totalSaved = 0;
    const totalChunks = Math.ceil(jobsData.length / chunkSize);
    
    console.log(`Processing ${jobsData.length} jobs in ${totalChunks} chunks of max ${chunkSize} items each`);

    await chunkedBulkOperation({
        items: jobsData,
        chunkSize,
        processChunk: async (chunk, chunkNumber) => {
            console.log(`Saving chunk ${chunkNumber}/${totalChunks}: ${chunk.length} jobs`);
            try {
                const result = await wixData.bulkSave("Jobs", chunk);
                const saved = result.inserted + result.updated || chunk.length;
                totalSaved += saved;
                console.log(`✓ Chunk ${chunkNumber} saved successfully. Inserted: ${result.inserted}, Updated: ${result.updated}`);
            } catch (error) {
                console.error(`✗ Error saving chunk ${chunkNumber}:`, error);
                throw error;
            }
        }
    });
    
    console.log(`✓ All chunks processed. Total jobs saved: ${totalSaved}/${jobsData.length}`);

}

async function saveJobsDescriptionsAndLocationToCMS() {
    
   console.log('🚀 Starting job descriptions update process for ALL jobs using pagination...');
    
    try {
        let jobsWithNoDescriptions = await getJobsWithNoDescriptions();
        let totalUpdated = 0;
        let totalFailed = 0;
        let totalProcessed = 0;
        let pageNumber = 1;
        
        // Start with the first page query - limit to 100 jobs per page
       // let jobsQuery = await wixData.query("Jobs").limit(300).find();
        
        console.log(`Total jobs in database without descriptions:  ${jobsWithNoDescriptions.totalCount}`);
        
        if (jobsWithNoDescriptions.totalCount === 0) {
            console.log('No jobs found in database');
            return { success: true, message: 'No jobs found' };
        }

        // Process all pages using hasNext() pagination
        do {
            const currentPageJobs = jobsWithNoDescriptions.items;
            console.log(`\n📄 Processing page ${pageNumber} with ${currentPageJobs.length} jobs...`);
            
            // Process jobs in smaller chunks of 5 for API calls within each page
            const API_CHUNK_SIZE = 80;
            const pageChunks = Math.ceil(currentPageJobs.length / API_CHUNK_SIZE);
            
            await chunkedBulkOperation({
                items: currentPageJobs,
                chunkSize: API_CHUNK_SIZE,
                processChunk: async (chunk, chunkNumber) => {
                    console.log(`  Processing API chunk ${chunkNumber}/${pageChunks} (${chunk.length} jobs)`);
                    const chunkPromises = chunk.map(async (job) => {
                        try {
                            //   console.log(`    Fetching description for: ${job.title} (${job._id})`);
                            const jobDetails = await fetchJobDescription(job._id);
                            const jobLocation = fetchJobLocation(jobDetails)
                            
                            const updatedJob = {
                                ...job,
                                locationAddress: jobLocation,
                                jobDescription: jobDetails.jobAd.sections
                            };
                            await wixData.update("Jobs", updatedJob);
                            // console.log(`    ✅ Updated description for: ${job.title}`);
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
                    console.log(`  API chunk ${chunkNumber} completed: ${chunkSuccesses} success, ${chunkFailures} failed`);
                    if (chunkNumber * API_CHUNK_SIZE < currentPageJobs.length) {
                        console.log('  Waiting 2 seconds before next API chunk...');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            });
            
            console.log(`📄 Page ${pageNumber} completed. Updated: ${totalUpdated}, Failed: ${totalFailed}, Total processed: ${totalProcessed}/${jobsWithNoDescriptions.totalCount}`);
            
            // Check if there are more pages and get the next page
            if (jobsWithNoDescriptions.hasNext()) {
                console.log('🔄 Moving to next page...');
                jobsWithNoDescriptions = await jobsWithNoDescriptions.next();
                pageNumber++;
                
                // Add a delay between pages
                console.log('Waiting 3 seconds before next page...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            
        } while (jobsWithNoDescriptions.hasNext());
        
        console.log(`\n✅ Finished updating ALL job descriptions using pagination!`);
        console.log(`📊 Final Results:`);
        console.log(`   Total pages processed: ${pageNumber}`);
        console.log(`   Total jobs processed: ${totalProcessed}`);
        console.log(`   Total updated: ${totalUpdated}`);
        console.log(`   Total failed: ${totalFailed}`);
        
        return {
            success: true,
            totalPages: pageNumber,
            totalProcessed: totalProcessed,
            totalUpdated: totalUpdated,
            totalFailed: totalFailed,
            message: `Successfully updated ${totalUpdated} job descriptions out of ${totalProcessed} total jobs across ${pageNumber} pages`
        };
        
    } catch (error) {
        console.error('❌ Error in updateJobDescriptions:', error);
        throw error;
    }
}

async function aggregateJobsByFieldToCMS({ field, collection }) {
    console.log(`counting jobs per ${field}.`);
    let jobsPerField = {};
    let cityLocations = {};
    let query = wixData.query("Jobs").limit(1000);
    let results = await query.find();
    let page = 1;
    do {
        console.log(`Page ${page}: ${results.items.length} jobs.`);
        for (const job of results.items) {
            if (!job[field])
                {
                    throw new Error(`Job ${job._id} has no ${field} field`);
                } 
            jobsPerField[job[field]] = (jobsPerField[job[field]] || 0) + 1;
            if (field === 'cityText' && !cityLocations[job[field]]) {
                cityLocations[job[field]] = job.location;
            }
        }
        if (results.hasNext()) {
            results = await results.next();
            page++;
        }
    } while (results.hasNext());
    let toSave = [];
    if (field === 'cityText') {
         toSave = Object.entries(jobsPerField).map(([value, amount]) => {
            const loc = cityLocations[value] || {};
            value = normalizeCityName(value);

            return {
                title: value,
                _id: value.replace(/\s+/g, ''),
                count: amount,
                location: loc,
                countryCode: loc.countryCode,
                country: loc.country,
                region: loc.region,
                city: loc.city,
                manual: loc.manual.toString(),
                remote: loc.remote.toString(),
                regionCode: loc.regionCode,
                latitude: loc.latitude,
                longitude: loc.longitude
            };
        });
    }
    else{
    // Prepare array for bulkSave
     toSave = Object.entries(jobsPerField).map(([value, amount]) => ({
        title: value,
        _id: value.replace(/\s+/g, ''),
        count: amount
    }));
    }
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
    
    let jobswithoutdescriptionsQuery = await wixData.query("Jobs").limit(1000).isEmpty("jobDescription").find(); // with 900 as the limit, 429 error won't happen
    return jobswithoutdescriptionsQuery;
}

async function referenceJobsToField({
    referenceField,      // e.g., "city" or "department"
    sourceCollection,    // e.g., "cities" or "departments"
    jobField,            // e.g., "cityText" or "department"
    
}) {
    // Fetch all source items (cities or departments)
    const sources = await wixData.query(sourceCollection).limit(1000).find();
    const sourceMap = {};
    for (const item of sources.items) {
        sourceMap[item.title] = item._id;
    }

    // Fetch all jobs
    let jobsResults = await wixData.query("Jobs").limit(1000).find();
    let jobsToUpdate = [];
    console.log('jobsResults',jobsResults.items);

    do {
        for (const job of jobsResults.items) {
            const refId = sourceMap[job[jobField]];
            if (refId) {
                jobsToUpdate.push({
                    ...job,
                    [referenceField]: refId
                });
            }
        }
        if (jobsResults.hasNext()) {
            jobsResults = await jobsResults.next();
        } else {
            break;
        }
    } while (true);

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
        processChunk: async (chunk) => {
            await wixData.bulkUpdate("Jobs", chunk);
        }
    });

    return { success: true, updated: jobsToUpdate.length };
}

function fetchJobLocation(jobDetails) {
    console.log("jobDetails.location is ", jobDetails.location);
    const isZeroLocation = jobDetails.location.latitude === "0.0000" && jobDetails.location.longitude === "0.0000";
    const jobLocation = {
        location: isZeroLocation ? {} : {
            latitude: parseFloat(jobDetails.location.latitude),
            longitude: parseFloat(jobDetails.location.longitude)
        },
        city: jobDetails.location.city,
        country: jobDetails.location.country,
        formatted: "",
        streetAddress: {},
        subdivision: "",
        postalCode: ""
    };

    console.log("jobLocation", jobLocation);
    return jobLocation;

}

module.exports = {
    saveDataJobsToCMS,
    saveJobsDescriptionsAndLocationToCMS,
    aggregateJobsByFieldToCMS,
    referenceJobsToField,
};
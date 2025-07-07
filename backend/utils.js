async function chunkedBulkOperation({ items, chunkSize, processChunk }) {
    for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        await processChunk(chunk, Math.floor(i / chunkSize) + 1);
    }
}

async function delay(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

function processJobsForField(jobs, field, jobsPerField, cityLocations) {
    for (const job of jobs) {
        if (!job[field]) {
            throw new Error(`Job ${job._id} has no ${field} field`);
        }
        jobsPerField[job[field]] = (jobsPerField[job[field]] || 0) + 1;
        if (field === 'cityText' && !cityLocations[job[field]]) {
            cityLocations[job[field]] = job.location;
        }
    }
}


module.exports = {
    chunkedBulkOperation,
    delay,
    processJobsForField,
};
async function chunkedBulkOperation({ items, chunkSize, processChunk }) {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await processChunk(chunk, Math.floor(i / chunkSize) + 1);
  }
}

async function delay(ms) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

function countJobsPerGivenField(jobs, field,jobsPerField) {
  for (const job of jobs) {
    if (!job[field]) {
      console.warn(`Job ${job._id} missing required field '${field}' - continue`);
      continue;
    }
    else{
      jobsPerField[job[field]] = (jobsPerField[job[field]] || 0) + 1;
    }
  }
}

function fillCityLocationAndLocationAddress(jobs, cityLocations,citylocationAddress) {
  for (const job of jobs) {
    if (!cityLocations[job.cityText] && !citylocationAddress[job.cityText]) {
      cityLocations[job.cityText] = job.location;
      citylocationAddress[job.cityText] = job.locationAddress;
    }
  }
}

function prepareToSaveArray(jobsPerField, cityLocations, field,citylocationAddress) {
  if (field === 'cityText') {
    return Object.entries(jobsPerField).map(([value, amount]) => {
      const loc = cityLocations[value] || {};
      const locAddress = citylocationAddress[value] || {};
      value = normalizeString(value).trim();
      return {
        title: value,
        _id: value.replace(/\s+/g, ''),
        count: amount,
        locationAddress: locAddress,
        country: loc.country,
        city: loc.city,
    };
    });
  } else {
    return Object.entries(jobsPerField).map(([value, amount]) => ({
      title: value,
      _id: normalizeString(value).replace(/&/g, 'and'),
      count: amount,
    }));
  }
}

function normalizeString(str) {
  if (!str) return str;
  // Remove accents/diacritics, keep spaces, trim whitespace
  return str
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^A-Za-z0-9-\s]/g, '');
}



module.exports = {
  chunkedBulkOperation,
  delay,
  countJobsPerGivenField,
  fillCityLocationAndLocationAddress,
  prepareToSaveArray,
  normalizeString,
  
};

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
      throw new Error(`Job ${job._id} has no ${field} field`);
    }
    jobsPerField[job[field]] = (jobsPerField[job[field]] || 0) + 1;
  }
}

function fillCityLocation(jobs, cityLocations) {
  for (const job of jobs) {
    if (!cityLocations[job.cityText]) {
      cityLocations[job.cityText] = job.location;
    }
  }
}

function prepateToSaveArray(jobsPerField, cityLocations, field, toSave) {
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
        longitude: loc.longitude,
      };
    });
  } else {
    toSave = Object.entries(jobsPerField).map(([value, amount]) => ({
      title: value,
      _id: value.replace(/\s+/g, ''),
      count: amount,
    }));
  }
}

function normalizeCityName(city) {
  if (!city) return city;
  // Remove accents/diacritics, trim whitespace
  return city
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}

module.exports = {
  chunkedBulkOperation,
  delay,
  countJobsPerGivenField,
  fillCityLocation,
  prepateToSaveArray,
  normalizeCityName,
};

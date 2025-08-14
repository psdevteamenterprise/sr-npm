const { fetch } = require('wix-fetch');
const { items: wixData } = require('@wix/data');
const { COLLECTIONS } = require('./collectionConsts');
async function makeSmartRecruitersRequest(path,token) {
   const baseUrl = 'https://api.smartrecruiters.com'; // PROD
//  const baseUrl = 'https://bayank2.wixstudio.com/my-site-3//_functions'; // TEST
  const fullUrl = `${baseUrl}${path}`;
  
    //console.log(`Making request to: ${fullUrl}`);
  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept-Language': 'en',
        'accept': 'application/json',
        'x-smarttoken': token,
        'Cookie': 'AWSALB=GYltFw3fLKortMxHR5vIOT1CuUROyhWNIX/qL8ZnPl1/8mhOcnIsBKYslzmNJPEzSy/jvNbO+6tXpH8yqcpQJagYt57MhbKlLqTSzoNq1G/w7TjOxPGR3UTdXW0d; AWSALBCORS=GYltFw3fLKortMxHR5vIOT1CuUROyhWNIX/qL8ZnPl1/8mhOcnIsBKYslzmNJPEzSy/jvNbO+6tXpH8yqcpQJagYt57MhbKlLqTSzoNq1G/w7TjOxPGR3UTdXW0d'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error making SmartRecruiters API request:', error);
    throw error;
  }
}

async function fetchPositionsFromSRAPI() {
  let allPositions = [];
  let totalFound = 0;
  let nextPageId = null; // Start with no page ID for the first request
  let page = 0;
  const MAX_PAGES = 30 // Safety limit to prevent infinite loops
  const token = await getSmartTokenFromCMS();
  console.log('Starting to fetch all positions with pagination...');

  do {
    try {
      page++;

      // Build the API path - first request has no page parameter, subsequent use nextPageId
      let apiPath = '/jobs?limit=50&postingStatus=PUBLIC';
      if (nextPageId) {
        apiPath += `&pageId=${nextPageId}`;
      }
      
      console.log(`Fetching page ${page} with path: ${apiPath}`);
      const response = await makeSmartRecruitersRequest(apiPath,token);
      
      // Add positions from this page to our collection
      if (response.content && Array.isArray(response.content)) {
        // No filtering, just dump all the damn positions in
        allPositions = allPositions.concat(response.content);
        console.log(`Page ${page}: Found ${response.content.length} positions`);
      }

      // Update total count from first response
      if (page === 1) {
        totalFound = response.totalFound || 0;
        console.log(`Total positions available: ${totalFound}`);
      }

      // Get the nextPageId for the next iteration
      nextPageId = response.nextPageId && response.nextPageId !== '' ? response.nextPageId : null;

      if (nextPageId) {
        console.log(`Next page ID: ${nextPageId}`);
      } else {
        console.log('No more pages to fetch');
      }
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      throw error;
    }

    // Safety check to prevent infinite loops
    if (page >= MAX_PAGES) {
      console.warn(`Reached maximum page limit of ${MAX_PAGES}. Stopping pagination.`);
      break;
    }
  } while (nextPageId); // Continue while there's a nextPageId

  console.log(`Finished fetching all pages. Total positions collected: ${allPositions.length}`);

  // Return response in the same format as before, but with all positions
  const result = {
    totalFound: totalFound,
    offset: 0,
    limit: allPositions.length,
    nextPageId: '', // Always empty since we've fetched everything
    content: allPositions,
  };

  const amountOfUniqueJobs = new Set(allPositions.map(job => job.id)).size;
  console.log('amountOfUniqueJobs ===');
  console.log(amountOfUniqueJobs);
  console.log('amountOfUniqueJobs ===');
  console.log('result ===');
  console.log(result);
  console.log('result ===');
  return result;
}

async function fetchJobDescription(jobId) {
  const token = await getSmartTokenFromCMS();
  return await makeSmartRecruitersRequest(`/jobs/${jobId}`,token);
}

async function getSmartTokenFromCMS() {
  const result = await wixData.query(COLLECTIONS.API_KEY).limit(1).find();
  if (result.items.length > 0) {
      return result.items[0].token; // This is your string token
  } else {
      throw new Error('[getSmartTokenFromCMS], No token found');
  }
}


module.exports = {
  fetchPositionsFromSRAPI,
  fetchJobDescription,
};

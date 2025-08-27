const { fetch } = require('wix-fetch');
const { items: wixData } = require('@wix/data');
const { COLLECTIONS } = require('./collectionConsts');
const secretsData = require('./secretsData');
async function makeSmartRecruitersRequest(path) {
   const baseUrl = 'https://api.smartrecruiters.com';
  const fullUrl = `${baseUrl}${path}`;
  
  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept-Language': 'en',
        'accept': 'application/json',
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
  let page = 0;
  const MAX_PAGES = 30 // Safety limit to prevent infinite loops
  const companyId = await getCompanyIdFromCMS();
  const templateType = await getTemplateTypeFromCMS();
  console.log('Starting to fetch all positions with pagination...');
  let offset=0;

  do {
    try {
      page++;

      // Build the API path - first request has no page parameter, subsequent use nextPageId
      const apiPath = `/v1/companies/${companyId}/postings?offset=${offset}&destination=${templateType}`;
      
      console.log(`Fetching page ${page} with path: ${apiPath}`);
      const response = await makeSmartRecruitersRequest(apiPath);
      
      // Add positions from this page to our collection
      if (response.content && Array.isArray(response.content)) {
        allPositions = allPositions.concat(response.content);
        console.log(`Page ${page}: Found ${response.content.length} positions`);
      }

      // Update total count from first response
      if (page === 1) {
        totalFound = response.totalFound || 0;
        console.log(`Total positions available: ${totalFound}`);
      }

     offset+=100;
     
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      throw error;
    }

    // Safety check to prevent infinite loops
    if (page >= MAX_PAGES) {
      console.warn(`Reached maximum page limit of ${MAX_PAGES}. Stopping pagination.`);
      break;
    }
  } while (offset<totalFound); // Continue while there's a nextPageId

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
  const companyId = await getCompanyIdFromCMS();
  return await makeSmartRecruitersRequest(`/v1/companies/${companyId}/postings/${jobId}`);
}

async function getCompanyIdFromCMS() {
  const result = await wixData.query(COLLECTIONS.COMPANY_ID).limit(1).find();
  if (result.items.length > 0) {
      return result.items[0].companyId; 
  } else {
      throw new Error('[getCompanyIdFromCMS], No companyId found');
  }
}
async function getTemplateTypeFromCMS() {
  const result = await wixData.query(COLLECTIONS.TEMPLATE_TYPE).limit(1).find();
  if (result.items.length > 0) {
      return result.items[0].templateType; 
  } else {
      throw new Error('[getTemplateTypeFromCMS], No templateType found');
  }
}


module.exports = {
  fetchPositionsFromSRAPI,
  fetchJobDescription,
  getCompanyIdFromCMS
};

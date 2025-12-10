const { fetch } = require('wix-fetch');
const { TEMPLATE_TYPE,TOKEN_NAME } = require('./collectionConsts');
const { getTokenFromCMS,getApiKeys } = require('./secretsData');

async function makeSmartRecruitersRequest(path,templateType) {
  const baseUrl = 'https://api.smartrecruiters.com';
  const fullUrl = `${baseUrl}${path}`;
  
  try {
    const headers = {
      'Accept-Language': 'en',
      'accept': 'application/json',
      'Cookie': 'AWSALB=GYltFw3fLKortMxHR5vIOT1CuUROyhWNIX/qL8ZnPl1/8mhOcnIsBKYslzmNJPEzSy/jvNbO+6tXpH8yqcpQJagYt57MhbKlLqTSzoNq1G/w7TjOxPGR3UTdXW0d; AWSALBCORS=GYltFw3fLKortMxHR5vIOT1CuUROyhWNIX/qL8ZnPl1/8mhOcnIsBKYslzmNJPEzSy/jvNbO+6tXpH8yqcpQJagYt57MhbKlLqTSzoNq1G/w7TjOxPGR3UTdXW0d'
    };
    if (templateType === TEMPLATE_TYPE.INTERNAL) {
      const smartToken = await getTokenFromCMS(TOKEN_NAME.SMART_TOKEN);
      headers['x-smarttoken'] = smartToken;
    }
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: headers
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

async function fetchPositionsFromSRAPI(testObject=undefined) {
  let allPositions = [];
  let totalFound = 0;
  let page = 0;
  const MAX_PAGES = 30 // Safety limit to prevent infinite loops
  
  let companyId, templateType;
  if (testObject) {
    ({ companyId, templateType } = testObject);
  } else {
    ({ companyId, templateType } = await getApiKeys());
  }
  console.log('Starting to fetch all positions with pagination...');
  let offset=0;

  do {
    try {
      page++;
      // Build the API path - first request has no page parameter, subsequent use nextPageId
      const apiPath = `/v1/companies/${companyId}/postings?offset=${offset}&destination=${templateType}`;
      
      console.log(`Fetching page ${page} with path: ${apiPath}`);
      const response = await makeSmartRecruitersRequest(apiPath,templateType);
      
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

async function fetchJobDescription(jobId,testObject=undefined) {
  let companyId, templateType;
  if (testObject) {
    ({ companyId, templateType } = testObject);
  } else {
    ({ companyId, templateType } = await getApiKeys());
  }
  return await makeSmartRecruitersRequest(`/v1/companies/${companyId}/postings/${jobId}`,templateType);
}

async function htmlRichContentConverter(sections,richContentConverterToken) {
  
  const richContentObject = {}
  for (const [sectionTitle, sectionData] of Object.entries(sections)) {
    if (sectionData.text) {
      // Strip span tags but keep their content , since <span> tags paragraphs are deleted by the converter
      const cleanedHtml = sectionData.text.replace(/<\/?span[^>]*>/gi, '');
      const raw = JSON.stringify({
        content: cleanedHtml,
      });
      const requestOptions = {
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'XSRF-TOKEN=1753949844|p--a7HsuVjR4',
          Authorization: 'Bearer '+richContentConverterToken,
        },
        body: raw,
      };
      const response = await fetch(
        'https://www.wixapis.com/data-sync/v1/abmp-content-converter',
        requestOptions
      );
      if (response.ok) {
        const data = await response.json();
        // Fix list items with nested paragraphs (causes line breaks after bold text)
        const flattenedContent = flattenListItems(data.richContent.richContent);
       // const richContentWithSpacing=addSpacingToRichContent(cleanedHtml,flattenedContent);
       const richContentWithSpacing=addEmptyParagraphsBetweenConsecutive(cleanedHtml,flattenedContent);
        richContentObject[sectionTitle] = richContentWithSpacing
      }
      else {
        throw new Error("Error converting html to rich content response: "+response);
      }
    }
  }
  return richContentObject;
}


function createEmptyParagraph(id) {
  return {
      type: "PARAGRAPH",
      id: id,
      nodes: [
          {
              type: "TEXT",
              id: "",
              nodes: [],
              textData: {
                  text: "",
                  decorations: []
              }
          }
      ],
      paragraphData: {
          textStyle: {
              textAlignment: "AUTO"
          }
      }
  };
}

// Flattens LIST_ITEM nodes by removing nested PARAGRAPH wrappers
// Fixes Wix converter bug where bold text + regular text in <li> creates line breaks
function flattenListItems(richContent) {
  if (!richContent || !richContent.nodes) return richContent;
  
  const processNode = (node) => {
    if (node.type === 'BULLETED_LIST' || node.type === 'ORDERED_LIST') {
      return {
        ...node,
        nodes: node.nodes.map(listItem => {
          if (listItem.type !== 'LIST_ITEM') return listItem;
          
          // Flatten: extract TEXT nodes from nested PARAGRAPHs
          const flattenedChildren = [];
          for (const child of listItem.nodes) {
            if (child.type === 'PARAGRAPH' && child.nodes) {
              // Pull TEXT nodes out of the PARAGRAPH
              flattenedChildren.push(...child.nodes);
            } else {
              flattenedChildren.push(child);
            }
          }
          
          return { ...listItem, nodes: flattenedChildren };
        })
      };
    }
    return node;
  };
  
  return {
    ...richContent,
    nodes: richContent.nodes.map(processNode)
  };
}

// Adds empty paragraph nodes between consecutive paragraphs and before lists
function addEmptyParagraphsBetweenConsecutive(html, richContent) {
  if (!richContent || !richContent.nodes) return richContent;
  const hasConsecutiveParagraphs = /<\/p>\s*<p/i.test(html);
  const hasParagraphBeforeList = /<\/p>\s*<ul/i.test(html);
  const hasParagraphAfterList = /<\/ul>\s*<p/i.test(html);
  
  if (!hasConsecutiveParagraphs && !hasParagraphBeforeList && !hasParagraphAfterList) return richContent;
  
  const nodes = richContent.nodes;
  const newNodes = [];
  let nodeIdCounter = 0;
  
  for (let i = 0; i < nodes.length; i++) {
    const currentNode = nodes[i];
    const nextNode = nodes[i + 1];
    
    newNodes.push(currentNode);
    
    if (currentNode.type === 'PARAGRAPH' && nextNode) {
      // Add empty paragraph between consecutive paragraphs
      if (hasConsecutiveParagraphs && nextNode.type === 'PARAGRAPH') {
        newNodes.push(createEmptyParagraph(`empty_consecutive_${nodeIdCounter++}`));
      }
      // Add empty paragraph before list
      if (hasParagraphBeforeList && nextNode.type === 'BULLETED_LIST') {
        newNodes.push(createEmptyParagraph(`empty_before_list_${nodeIdCounter++}`));
      }
    }
    
    // Add empty paragraph after list
    if (hasParagraphAfterList && currentNode.type === 'BULLETED_LIST' && nextNode && nextNode.type === 'PARAGRAPH') {
      newNodes.push(createEmptyParagraph(`empty_after_list_${nodeIdCounter++}`));
    }
  }
  
  return {
    ...richContent,
    nodes: newNodes
  };
}










module.exports = {
  fetchPositionsFromSRAPI,
  fetchJobDescription,
  makeSmartRecruitersRequest,
  htmlRichContentConverter
};

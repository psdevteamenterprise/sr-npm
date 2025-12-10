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
      const raw = JSON.stringify({
        content: sectionData.text,
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
        const richContentWithSpacing=addSpacingToRichContent(sectionData.text,data.richContent.richContent);
        richContentObject[sectionTitle] = richContentWithSpacing
      }
      else {
        throw new Error("Error converting html to rich content response: "+response);
      }
    }
  }
  return richContentObject;
}

//Adds empty paragraph nodes between sections in rich content 
// to create visual spacing that the Wix RICOS converter strips out
function addSpacingToRichContent(html, richContent) {
  if (!richContent || !richContent.nodes) {
      return richContent;
  }

  // Extract paragraph texts from HTML that end with &#xa0;
  const htmlParagraphsWithSpace = [];
  // Extract paragraphs with <br> tags
  const htmlParagraphsWithBr = new Map(); // text -> array of parts split by <br>
  // Check if HTML has consecutive paragraphs (</p><p> pattern)
  const hasConsecutiveParagraphs = /<\/p>\s*<p/i.test(html);
  
  const pTagRegex = /<p>(.*?)<\/p>/gi;
  let match;
  
  while ((match = pTagRegex.exec(html)) !== null) {
      const content = match[1];
      
      // Check if this paragraph ends with &#xa0; (before closing tags)
      if (content.includes('&#xa0;')) {
          const textOnly = content.replace(/<[^>]+>/g, '').trim();
          htmlParagraphsWithSpace.push(textOnly);
      }
      
      // Check if this paragraph contains <br> tags
      if (content.includes('<br>') || content.includes('<br/>') || content.includes('<br />')) {
          // Split by <br> tags and extract text parts
          const parts = content.split(/<br\s*\/?>/i).map(part => 
              part.replace(/<[^>]+>/g, '').trim()
          ).filter(part => part.length > 0);
          
          if (parts.length > 1) {
              // Store the parts for this paragraph
              const fullText = content.replace(/<[^>]+>/g, '').replace(/\s+/g, '').trim();
              htmlParagraphsWithBr.set(fullText, parts);
          }
      }
  }

  const nodes = richContent.nodes;
  const newNodes = [];
  let nodeIdCounter = 0;
  
  // Check if a paragraph is bold (has BOLD decoration)
  const isBoldParagraph = (node) => {
      if (node.type !== 'PARAGRAPH') return false;
      const decorations = node.nodes?.[0]?.textData?.decorations || [];
      return decorations.some(d => d.type === 'BOLD');
  };
  
  // Check if a paragraph node's text matches one with &#xa0; in HTML
  const needsSpacingAfter = (node, nextNode) => {
      if (node.type !== 'PARAGRAPH') return false;
      
      // Add spacing after bold paragraphs
      if (isBoldParagraph(node)) {
          return true;
      }
      
      // If HTML has consecutive <p> tags and next node is also a paragraph, add spacing
      if (hasConsecutiveParagraphs && nextNode && nextNode.type === 'PARAGRAPH') {
          return true;
      }
      
      const text = node.nodes?.[0]?.textData?.text || '';
      const trimmedText = text.trim();
      
      // Check if this text matches any HTML paragraph that had &#xa0;
      return htmlParagraphsWithSpace.some(htmlText => {
          const cleanHtml = htmlText.replace(/&#xa0;/g, ' ').trim();
          return trimmedText.includes(cleanHtml) || cleanHtml.includes(trimmedText);
      });
  };
  
  // Check if a paragraph contains text that should be split by <br>
  const shouldSplitByBr = (node) => {
      if (node.type !== 'PARAGRAPH') return null;
      
      const text = node.nodes?.[0]?.textData?.text || '';
      const normalizedText = text.replace(/\s+/g, '').trim();
      
      // Find matching HTML paragraph with <br>
      for (const [htmlText, parts] of htmlParagraphsWithBr.entries()) {
          if (normalizedText.includes(htmlText) || htmlText.includes(normalizedText)) {
              return parts;
          }
      }
      return null;
  };
  
  // Add spacing after bulleted lists
  const isListEnd = (currentNode, nextNode) => {
      return currentNode.type === 'BULLETED_LIST' && 
             nextNode && 
             nextNode.type === 'PARAGRAPH';
  };

  for (let i = 0; i < nodes.length; i++) {
      const currentNode = nodes[i];
      const nextNode = nodes[i + 1];
      
      // Check if this paragraph should be split by <br>
      const brParts = shouldSplitByBr(currentNode);
      if (brParts && brParts.length > 1) {
          // Split into multiple paragraphs and add spacing between them
          const decorations = currentNode.nodes?.[0]?.textData?.decorations || [];
          
          brParts.forEach((part, idx) => {
              newNodes.push({
                  ...currentNode,
                  id: `${currentNode.id}_split_${idx}`,
                  nodes: [{
                      type: "TEXT",
                      id: "",
                      nodes: [],
                      textData: {
                          text: part,
                          decorations: decorations
                      }
                  }]
              });
              
              // Add empty paragraph after each split part except the last
              if (idx < brParts.length - 1) {
                  newNodes.push(createEmptyParagraph(`empty_br_${nodeIdCounter++}`));
              }
          });
          
          // Add spacing after the split paragraphs if there's a next node
          if (nextNode) {
              newNodes.push(createEmptyParagraph(`empty_${nodeIdCounter++}`));
          }
      } else {
          newNodes.push(currentNode);
          
          // Add empty paragraph after paragraphs with &#xa0;, consecutive paragraphs, or after lists
          if ((needsSpacingAfter(currentNode, nextNode) || isListEnd(currentNode, nextNode)) && nextNode) {
              newNodes.push(createEmptyParagraph(`empty_${nodeIdCounter++}`));
          }
      }
  }
  
  return {
      ...richContent,
      nodes: newNodes
  };
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










module.exports = {
  fetchPositionsFromSRAPI,
  fetchJobDescription,
  makeSmartRecruitersRequest,
  htmlRichContentConverter
};

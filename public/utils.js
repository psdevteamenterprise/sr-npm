const { fetch } = require('wix-fetch');

function htmlToText(html) {
  if (!html) return '';

  // Remove HTML tags and decode entities
  let text = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?(p|div|h[1-6])\s*\/?>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');

  // Clean up whitespace
  return text.replace(/\n\s*\n+/g, '\n\n').replace(/[ \t]+\n/g, '\n').trim();
}

async function htmlToRichContent(htmlString) {
  console.log("htmlString **********",htmlString)
  const raw = JSON.stringify({
    "content": htmlString
  });


  const requestOptions = {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      "Cookie": "XSRF-TOKEN=1753949844|p--a7HsuVjR4",
      "Authorization": "Bearer 2e19efe5f44d29d74480f5b744a5a90f19ba6ca7012ced19e7b14edb1ad6a641"

    },
    body: raw
  };
  
  try{
        const response = await fetch("https://www.wixapis.com/data-sync/v1/abmp-content-converter", requestOptions);
        if (response.ok) {
          const data = await response.json();
          console.log("data.richContent **********",data.richContent)
          return data.richContent;
      }

      else
      {
        console.error(`error in fetching data, response: ${response}`);
        
      }
  }
  catch(error){
    console.error("error in fetching data",error);
  }
}

function filterBrokenMarkers(items) {
  return items
        .filter(item => {
            const locationAddress = item.locationAddress;
            const location = locationAddress && locationAddress.location;
            return (
                location !== undefined &&
                location !== null &&
                location.latitude !== undefined &&
                location.latitude !== null &&
                location.longitude !== undefined &&
                location.longitude !== null
            );
        })
}


  module.exports = {
    htmlToText,
    filterBrokenMarkers,
    htmlToRichContent
  };
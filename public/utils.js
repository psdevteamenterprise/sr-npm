const { fetch } = require('wix-fetch');
const { secrets } = require("@wix/secrets");


async function getServerlessAuth() {
  const serverlessAuth =  await secrets.getSecretValue("serverless_auth")
  console.log("serverlessAuth **********",serverlessAuth)
  return serverlessAuth;

}

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
  console.log("i am here")
  const serverlessAuth =  await getServerlessAuth()
  console.log("serverlessAuth **********",serverlessAuth)
  // console.log("htmlString **********",htmlString)
  // const raw = JSON.stringify({
  //   "content": htmlString
  // });


  // const requestOptions = {
  //   method: "post",
  //   headers: {
  //     "Content-Type": "application/json",
  //     "Cookie": "XSRF-TOKEN=1753949844|p--a7HsuVjR4",
  //     "Authorization": "Bearer "+await getServerlessAuth()

  //   },
  //   body: raw
  // };

  // console.log("requestOptions **********",requestOptions)
  
  // try{
  //       const response = await fetch("https://www.wixapis.com/data-sync/v1/abmp-content-converter", requestOptions);
  //       if (response.ok) {
  //         const data = await response.json();
  //         console.log("data.richContent **********",data.richContent)
  //         return data.richContent;
  //     }

  //     else
  //     {
  //       console.error(`error in fetching data, response: ${response}`);
        
  //     }
  // }
  // catch(error){
  //   console.error("error in fetching data",error);
  // }
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
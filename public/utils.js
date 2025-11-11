
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


function appendQueryParams(url,query){
  console.log("appendQueryParams url: ", url);
  console.log("appendQueryParams query: ", query);
  const urlObj=new URL(url);
  console.log("urlObj urlObj: ", urlObj);
  Object.entries(query).forEach(([key,value])=>{
    urlObj.searchParams.set(key,value);
  });
  console.log("urlObj urlObj: ", urlObj);
  console.log("urlObj urlObj.toString(): ", urlObj.toString());
  return urlObj.toString();
}

  module.exports = {
    htmlToText,
    filterBrokenMarkers,
    appendQueryParams
  };
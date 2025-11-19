
function htmlToText(html) {
  
  // Let the browser decode ALL HTML entities automatically
  const textarea = document.createElement('textarea');
  console.log("textarea: ",textarea);
  textarea.innerHTML = html;
  console.log("textarea.innerHTML: ",textarea.innerHTML);
  let decoded = textarea.value;
  console.log("decoded: ",decoded);
  // Now clean up the HTML tags and formatting
  let text = decoded
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?(p|div|h[1-6])\s*\/?>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]*>/g, '');
  console.log("text: ",text);
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
  const urlObj=new URL(url);
  Object.entries(query).forEach(([key,value])=>{
    urlObj.searchParams.set(key,value);
  });
  return urlObj.toString();
}

  module.exports = {
    htmlToText,
    filterBrokenMarkers,
    appendQueryParams
  };
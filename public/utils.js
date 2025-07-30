

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

  console.log(text);
  // Clean up whitespace
  return text.replace(/\n\s*\n+/g, '\n\n').replace(/[ \t]+\n/g, '\n').trim();
}


  module.exports = {
    htmlToText
  };
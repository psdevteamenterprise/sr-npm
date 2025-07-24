//const { items:wixData } = require('@wix/data');
const {wixData} = require('wix-data');

function getFilter(fieldsToSearch = [], mode = 'or') {
    const baseFilter = wixData.filter();
    // if no fields to search, return empty filter
    if (fieldsToSearch.length === 0) {
        return baseFilter;
    }

    // build filters
    let filter;
    fieldsToSearch.forEach(({ field, searchTerm }) => {
        const condition = typeof searchTerm === 'boolean' 
            ? baseFilter.eq(field, searchTerm)
            : baseFilter.contains(field, searchTerm);

        filter = filter
            ? (mode === 'or' ? filter.or(condition) : filter.and(condition))
            : condition;
    });

    return filter;
}

function debounce(fn, delay = 400,thisObject) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        console.log("thisObject is: ", thisObject);
        console.log("args is: ", args);
        timeout = setTimeout(() => fn.apply(thisObject, args), delay);
    };
}

module.exports = {
    getFilter,
    debounce
  };
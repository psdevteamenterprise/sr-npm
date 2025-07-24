const { items:wixData } = require('@wix/data');

export function getFilter(fieldsToSearch = [], mode = 'or') {
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

export function debounce(fn, delay = 400) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
}

module.exports = {
    getFilter,
    debounce
  };
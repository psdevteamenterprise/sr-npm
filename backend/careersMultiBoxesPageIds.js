const CAREERS_MULTI_BOXES_PAGE_CONSTS={
    JOBS_DATASET: '#jobsDataset',
    FILTER_REPEATER: '#filterReapter',
    JOBS_REPEATER: '#jobsReapter',
    JOBS_REPEATER_ITEM_TITLE: '#jobTitle',
    JOBS_REPEATER_ITEM_LOCATION: '#locationLabel',
    JOBS_REPEATER_ITEM_EMPLOYMENT_TYPE: '#employmentTypeLabel',
    TotalJobsCountText: '#totalJobsCountText',
    FILTER_LABEL: '#FilterTextInput',
    FILTER_CHECKBOX_CONTAINER: '#FilterCheckBoxContainer',
    FILTER_REPEATER_ITEM_CHECKBOX: '#filterCheckBox',
    SELECTED_VALUES_REPEATER: '#selectedValuesReapter',
    SELECTED_VALUES_REPEATER_ITEM_LABEL: '#selectedValueLabel',
    DESELECT_BUTTON_ID: '#deselectFilterValueButton',
    CLEAR_ALL_BUTTON_ID: '#clearAllButton',
    PAGE_BUTTON_NEXT: '#nextPageButton',
    PAGE_BUTTON_PREVIOUS: '#previousPageButton',
    paginationCurrentText: '#paginationCurrent',
    paginationTotalCountText: '#paginationTotalCount',
    PRIMARY_SEARCH_RESULTS: '#resultsRepeater',
    SEARCH_BUTTON: '#searchButton',
    SECONDARY_SEARCH_INPUT: '#secondarySearchInput',
    JOBS_MULTI_STATE_BOX:"#jobsMultiStateBox",
    PRIMARY_SEARCH_INPUT: '#primarySearchInput',
    JOB_RESULTS_REPEATER: '#jobResultsRepeater',
    JOB_RESULTS_REPEATER_ITEM: '#jobResultsRepeaterItem',
    CATEGORY_RESULTS_REPEATER: '#categoryResultsRepeater',
    CATEGORY_RESULTS_REPEATER_ITEM: '#categoryResultsRepeaterItem',
    PRIMARY_SEARCH_MULTI_BOX: '#primarySearchMultiBox',
    PRIMARY_SEARCH_POSITION_BUTTON: '#primarySearchPositionButton',
    PRIMARY_SEARCH_CATEGORY_BUTTON: '#primarySearchCategoryButton',
    RESULTS_CONTAINER: '#resultsContainer',
    PRIMARY_SEARCH_BUTTON: '#primarySearchButton',
}

const JOBS_COLLECTION_FIELDS={
    LINK_JOBS_TITLE: 'link-jobs-title',
    LINK_JOBS_REF_ID_SLUG: 'link-jobs-refId-slug',
}

const CATEGORY_CUSTOM_FIELD_ID_IN_CMS='5cd8c873c9e77c0008aa7d23';

// used for filters - don't add anything else here
const fieldTitlesInCMS={
    "brand": "Brands",
    category: "Category",
    visibility: "Visibility",
    location: "Location",
    employmenttype: "Employment Type",
    contracttype: "Contract Type",
    companysegment: "Company Segment",
    storename: "Store Name",
}

const FiltersIds={
    Category: 'Category',
    "Company Segment": 'CompanySegment',
    Location: 'Location',
    "Store Name": 'StoreName',
    "Employment Type": 'employmentType',
   "Contract Type": 'contractType',
   Brands: 'Brands',
   Visibility: 'Visibility',
}

const possibleUrlParams=[
     "brand",
     "location",
    "employmenttype",
    "contracttype",
    "visibility",
    "category",
    "companysegment",
    "storename",
]

module.exports = {
    CAREERS_MULTI_BOXES_PAGE_CONSTS,
    FiltersIds,
    fieldTitlesInCMS,   
    CATEGORY_CUSTOM_FIELD_ID_IN_CMS,
    possibleUrlParams,
    JOBS_COLLECTION_FIELDS,
}
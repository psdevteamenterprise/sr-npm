const { executeApiRequest } = require('tests-utils');
const { items: wixData } = require('@wix/data');
const { clearCollections } = require('./testsUtils');
const { TEMPLATE_TYPE, COLLECTIONS } = require('./consts');

beforeAll(async () => {
    clearCollections(wixData);
});


it.each([
    { templateName: 'Internal', templateType: TEMPLATE_TYPE.INTERNAL },
    { templateName: 'External', templateType: TEMPLATE_TYPE.EXTERNAL },
])('should successfully mark template as $templateName', async ({ templateName,templateType }) => {
    // damn, let's build the request body dynamically
    const requestBody = `markTemplateAs${templateName}();`;
    await executeApiRequest(requestBody);
    const TemplateTypeFromCMS = await wixData.query(COLLECTIONS.TEMPLATE_TYPE).limit(1).find();
    expect(TemplateTypeFromCMS.items[0].templateType).toBe(templateType);
  });






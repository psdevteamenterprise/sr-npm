const { executeApiRequest } = require('tests-utils');
const { items: wixData } = require('@wix/data');
const { clearCollections } = require('./testsUtils');
const { TEMPLATE_TYPE } = require('./consts');
const { COLLECTIONS } = require('./consts');

beforeAll(async () => {
    clearCollections(wixData);
});



it.each([
    { name: 'internal', templateType: TEMPLATE_TYPE.INTERNAL },
    { name: 'external', templateType: TEMPLATE_TYPE.EXTERNAL },
])('should successfully mark template as $name', async ({ templateType }) => {
    const requestBody = `markTemplateAs${templateType}();`;
    await executeApiRequest(requestBody);
    const TemplateTypeFromCMS = await wixData.query(COLLECTIONS.TEMPLATE_TYPE).limit(1).find();
    expect(TemplateTypeFromCMS.items[0].templateType).toBe(templateType);
  });






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
    const requestBody = `markTemplateAs${templateName}();`;
    const response = await executeApiRequest(requestBody);
    console.log("response: ", response);
    expect(response.status).toBe(200);
  });






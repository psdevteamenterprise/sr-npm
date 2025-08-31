const { executeApiRequest } = require('tests-utils');
const { clearCollections } = require('./testsUtils');
const { TEMPLATE_TYPE } = require('./consts');

beforeAll(async () => {
    clearCollections();
});



it.each([
    { templateName: 'Internal', templateType: TEMPLATE_TYPE.INTERNAL },
    { templateName: 'External', templateType: TEMPLATE_TYPE.EXTERNAL },
])('should successfully mark template as $templateName', async ({ templateName,templateType }) => {
    const requestBody = `markTemplateAs${templateName}();`;
    const response = await executeApiRequest(requestBody);
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(response.data.result.templateType).toBe(templateType);
  });






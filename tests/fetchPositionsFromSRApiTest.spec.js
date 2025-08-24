const { executeApiRequest } = require('tests-utils');


describe('Job details fetch from SR API Tests', () => {
  
    // beforeEach(async () => {
    //   await cleanCollection(); 
    // });
  
    describe('fetching job details from SR API', () => {
      test('should successfully fetch job details from SR API', async () => {
        const requestBody = `await fetchPositionsFromSRAPI();`;
        const wixDataResponse = await executeApiRequest(requestBody);
        console.log("wixDataResponse: ", wixDataResponse);

        // const uniqueId = generateUniqueId();
        
        // const items = await scheduleTask({uniqueId: uniqueId});
        // expect(items.length).toBe(1);
  
        // const taskData = items[0];
        // expect(taskData.data.uniqueId).toBe(uniqueId);
        // expect(taskData.type).toBe(TASK_TYPE.SCHEDULED);
        // expect(taskData.status).toBe(TASK_STATUS.PENDING);
        // expect(taskData.amountOfRetries).toBe(0);
        // expect(taskData.parentTaskId).toBeUndefined();
        // expect(taskData.name).toBe(TASKS.TEST_TASK.name);
      });
  
    //   test('should return 500 error when scheduling task with invalid data', async () => {
    //     try {
    //       const response = await scheduleTask("");
    //       expect(response.status).not.toBe(200);
  
    //     } catch (error) {
    //       // Check if it's an HTTP error (from Axios) or an assertion error (from Jest)
    //       if (error.response) {
    //         // HTTP error from server
    //         expect(error.response.status).toBe(500);
    //         expect(error.response.data.message).toBe('[insertNewTask] Failed for Task TestTask with error [insertNewTask] Invalid params: {\"name\":\"TestTask\",\"data\":\"\",\"type\":\"scheduled\"}');
    //       } else {
    //         // Re-throw assertion errors or other unexpected errors
    //         throw error;
    //       }
    //     }
    //   });
    });
  

  });
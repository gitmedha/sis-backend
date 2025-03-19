'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async createBulkOutreach(ctx) {
      const { body } = ctx.request;
      try {
        const createdData = await strapi.services["studentOutreach"].createMany(body);
        return createdData;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    async searchOps(ctx) {
        try {
          const { searchField, searchValue } = ctx.request.body;
      
          // Validate the request body
          if (!searchField || !searchValue) {
            return ctx.badRequest('Both searchField and searchValue are required.');
          }
      
          // Ensure the searchField is 'state'
          if (searchField !== 'state') {
            return ctx.badRequest('Invalid search field. Only "state" is supported.');
          }
      
          // Define the allowed state values
          const allowedStates = ['Bihar', 'Uttarakhand', 'Uttar Pradesh', 'Haryana'];
      
          // Validate the searchValue
          if (!allowedStates.includes(searchValue)) {
            return ctx.badRequest('Invalid state value. Allowed values are: Bihar, Uttarakhand, Uttar Pradesh, Haryana.');
          }
      
          // Query the student-outreach model
          const records = await strapi.query('student-outreach').find({
            [`${searchField}_contains`]: searchValue, // Filter by state
            isActive: true, // Only fetch active records
            _limit: 1000000, // Fetch all records (adjust as needed)
            _start: 0,
          });
      
          // Return the filtered records
          return ctx.send(records);
        } catch (error) {
          console.error('Error in searchOps:', error);
          return ctx.internalServerError('An error occurred while searching records.');
        }
      }
}
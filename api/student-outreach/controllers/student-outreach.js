'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async createBulkOutreach(ctx) {
      const { body } = ctx.request;
      try {
        console.log('backednd student outreach')
        const createdData = await strapi.services["student-outreach"].createMany(body);
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
        const allowedStates = ['Haryana', 'Uttar Pradesh', 'Bihar', 'Uttarakhand'];
    
        // Validate the searchValue
        if (!allowedStates.includes(searchValue)) {
          return ctx.badRequest(
            'Invalid state value. Allowed values are: Haryana, UttarPradesh, Bihar, Uttarkhand.'
          );
        }
    
        // Query the student-outreach model
        const records = await strapi.query('student-outreach').find({
          [`${searchField}`]: searchValue, // Filter by state
          isactive: true, // Only fetch active records
          _limit: 1000, // Fetch a reasonable number of records
          _start: 0,
        });
    
        // Return the filtered records
        return ctx.send(records);
      } catch (error) {
        console.error('Error in searchOps:', error);
        // Use ctx.send with a 500 status code for internal server errors
        return ctx.send({ message: 'An error occurred while searching records.' }, 500);
      }
    }
  
}
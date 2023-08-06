'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async createBulkupskills(ctx) {
        const { body } = ctx.request;
        
        try {
          const createdData = await strapi.services['students-upskilling'].createMany(body);
          return createdData;
       
        } catch (error) {
          console.error(error);
          throw error;
        }
      },
      async deactiveStudentsUpSkills(ctx) {
        const { id } = ctx.params;
        const { fieldToUpdate, newValue } = ctx.request.body;
    
        try {
          // Get the existing record
          const existingRecord = await strapi.query('students-upskilling').findOne({ id });
    
          if (!existingRecord) {
            return ctx.throw(404, 'Record not found');
          }
    
          // Update the specified field
          existingRecord[fieldToUpdate] = newValue;
    
          // Save the updated record
          const updatedRecord = await strapi.query('students-upskilling').update({ id }, existingRecord);
    
          ctx.send(updatedRecord);
        } catch (err) {
          ctx.throw(500, 'Internal Server Error');
        }
      }
};

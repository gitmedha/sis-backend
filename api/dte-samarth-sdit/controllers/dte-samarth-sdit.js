'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async createBulkSamarths(ctx) {
        const { body } = ctx.request;
        
        try {
          const createdData = await strapi.services['dte-samarth-sdit'].createMany(body);
          return createdData;
       
        } catch (error) {
          console.error(error);
          throw error;
        }
      }
};


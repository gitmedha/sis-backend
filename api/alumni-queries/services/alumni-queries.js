'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
    createMany: async (data) => {
        try {
          const createdData = await strapi.query('alumni-queries').createMany(data);
          return createdData;
        } catch (error) {
          console.error(error);
          throw error;
        }
      },
      async searchOps(ctx) {
        const { searchField, searchValue } = ctx.request.body;
      
        try {
          if (!searchField || !searchValue) {
            return ctx.badRequest('Field and value are required.');
          }
          
          const records = await strapi.query('alumni-queries').find({
            [`${searchField}_contains`]: searchValue,
            _limit:1000000,
            _start: 0
          });
          
    
          return ctx.send(records);
        } catch (error) {
          console.log(error);
          throw error;
        }
      }
};

'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async createMany(ctx) {
        const { request } = ctx;
        const { body } = request;
    
        try {
          // Assuming your model name is "mydata"
          const createdData = await strapi.services.mydata.createMany(body);
          return createdData;
        } catch (error) {
          console.error(error);
          throw error;
        }
      },
};

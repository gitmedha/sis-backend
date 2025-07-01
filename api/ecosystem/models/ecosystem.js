'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
    createMany: async (data) => {
        try {
          const createdData = await strapi.query('ecosystem').createMany(data);
          return createdData;
        } catch (error) {
          console.error(error);
          throw error;
        }
      },
};

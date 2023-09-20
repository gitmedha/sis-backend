'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
    createMany: async (data) => {
        try {
          const createdData = await strapi.query('users-ops-activities').createMany(data);
          return createdData;
        } catch (error) {
          console.error(error);
          throw error;
        }
      },
};

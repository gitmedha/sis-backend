'use strict';

module.exports = {
    createMany: async (data) => {
        try {
          const createdData = await strapi.query('pmus').createMany(data);
          return createdData;
        } catch (error) {
          console.error(error);
          throw error;
        }
    },
};
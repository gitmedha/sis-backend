"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
    async createMany(data) {
      try {
        const createdRecords = await strapi.query('student-outreach').createMany(data);
        return createdRecords;
      } catch (error) {
        console.error('Error creating bulk records:', error);
        throw error;
      }
    },
  };

"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
    async create(data) {
      try {
        // Process the record to ensure valid gender
        const processedData = {
          ...data,
          gender: data.gender || 'Male' // Set default gender if not provided
        };

        const createdRecord = await strapi.query('student-outreach').create(processedData);
        return createdRecord;
      } catch (error) {
        console.error('Error creating record:', error);
        throw error;
      }
    },

    async createMany(data) {
      try {
        // Validate input
        if (!Array.isArray(data)) {
          throw new Error('Input must be an array of records');
        }

        // Process each record to ensure valid gender
        const processedData = data.map(record => ({
          ...record,
          gender: record.gender || 'Male' // Set default gender if not provided
        }));

        const createdRecords = await strapi.query('student-outreach').createMany(processedData);
        return createdRecords;
      } catch (error) {
        console.error('Error creating bulk records:', error);
        throw error;
      }
    },
  };

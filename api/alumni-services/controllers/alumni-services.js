"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async createBulkAlumni(ctx) {
    const { body } = ctx.request;

    try {
      const createdData = await strapi.services["alumni-services"].createMany(
        body
      );
      return createdData;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  async bulkUpdate(ctx) {
    try {
      const data = ctx.request.body;
      const updatedData = await Promise.all(
        data.map(async (item) => {
          const updatedRecord = await strapi
            .query("alumni-services")
            .update({ id: item.id }, item);
          return updatedRecord;
        })
      );

      return updatedData;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
};

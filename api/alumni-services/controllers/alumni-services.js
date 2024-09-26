"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async createBulkAlumni(ctx) {
    const { body } = ctx.request;

    try {
      const studentUpdates = await Promise.all(
        body.map(async (students) => {

          const student = await strapi.services['students'].findOne({ id: students.student });
          if (student) {
            const updateResult = await strapi.services['students'].update(
              { id: students.student },
              { last_update_at: new Date() }  
            );
  
            if (updateResult) {
              console.warn(`Student ${students.student} updated successfully.`, updateResult);
            } else {
              console.warn(`Student ${students.student} update failed.`);
            }
            return updateResult;
          } else {
            console.warn(`Student with ID ${students.student} not found.`);
            return null;  
          }
        })
      );
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
      const studentUpdates = await Promise.all(
        data.map(async (students) => {

          const student = await strapi.services['students'].findOne({ id: students.student });
          if (student) {
            // console.log(`Found student ${students.student}:`, student);
  
            
            const updateResult = await strapi.services['students'].update(
              { id: students.student },
              { last_update_at: new Date() }  
            );
  
            if (updateResult) {
              console.warn(`Student ${students.student} updated successfully.`, updateResult);
            } else {
              console.warn(`Student ${students.student} update failed.`);
            }
            return updateResult;
          } else {
            console.warn(`Student with ID ${students.student} not found.`);
            return null;  
          }
        })
      );
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

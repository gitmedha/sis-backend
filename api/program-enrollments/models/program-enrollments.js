'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    // Called after an entry is updated
    async afterCreate(result, data) {
      await strapi.services['students'].handleRegistrationDateLatest( result.student);
    },
    // Called before an entry is updated
    async beforeUpdate(params, data) {
      const { id } = params
      const programEnrollment = await strapi.services['program-enrollments'].findOne({ id })

      // check if batch is present in the data to update and the batch id does not match the old batch id
      if (
        data.batch &&
        programEnrollment.batch.id !== parseInt(data.batch) &&
        ['Certified by Medha', 'Batch Complete'].includes(programEnrollment.status) === false
      ) {
        // batch is changed for the program enrollment where
        // status is not certified or completed
        // delete the attendance records for the program enrollment
        await strapi.query('attendance').delete({ program_enrollment: programEnrollment.id });
      }
    },
    // Called after an entry is updated
    async afterUpdate(result, params, data) {
      await strapi.services['students'].handleRegistrationDateLatest( result.student);
    },
    // Called before an entry is deleted
    async beforeDelete(params) {
      const { id } = params;
      if (!id) return

      // find attendances for the program enrollment and delete them
      await strapi.query('attendance').delete({ program_enrollment: id });
    },
  },
};

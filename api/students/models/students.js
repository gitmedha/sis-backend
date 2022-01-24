'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/models.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    // Called after an entry is deleted
    async beforeDelete(params) {
      const { id } = params;
      if (!id) return

      // delete attendance records for the program enrollment
      let programEnrollments = await strapi.query('program-enrollments').find({ student: id })
      for (let index = 0; index < programEnrollments.length; index++) {
        let programEnrollment = programEnrollments[index];

        // find attendances for the program enrollment and delete them
        await strapi.query('attendance').delete({ program_enrollment: programEnrollment.id });
      }

      // find program enrollments for the student and delete them
      await strapi.query('program-enrollments').delete({ student: id })

      // find employment connections for the student and delete them
      await strapi.query('employment-connections').delete({ student: id })
    },
  },
};

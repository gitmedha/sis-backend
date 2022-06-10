'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async handleProgramEnrollmentOnCertification(batch) {
    const programEnrollments = await strapi.services['program-enrollments'].find({ batch: batch.id });
    programEnrollments.forEach(async programEnrollment => {
      let attendance = await strapi.services['program-enrollments'].calculateBatchAttendance(programEnrollment);
      let status = attendance >= 75 ? "Batch Complete" : "Student Dropped Out";
      await strapi.services['program-enrollments'].update({ id: programEnrollment.id }, { status });
    });
  }
};

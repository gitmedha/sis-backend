'use strict';

/**
 * Cron config that gives you an opportunity
 * to run scheduled jobs.
 *
 * The cron format consists of:
 * [SECOND (optional)] [MINUTE] [HOUR] [DAY OF MONTH] [MONTH OF YEAR] [DAY OF WEEK]
 *
 * See more details here: https://strapi.io/documentation/developer-docs/latest/concepts/configurations.html#cron-tasks
 */

module.exports = {
  '* * * * *': async () => {
    const programEnrollments = await strapi.services['program-enrollments'].find({ medha_program_certificate_status: 'processing', _limit: 4 });
    programEnrollments.forEach(async programEnrollment => {
      // generate certificate for program enrollment
      let batchAttendancePercent = await strapi.services['program-enrollments'].calculateBatchAttendance(programEnrollment);
      if (batchAttendancePercent >= 75) {
        await strapi.services['program-enrollments'].generateCertificate(programEnrollment);
      } else {
        await strapi.services['program-enrollments'].update({ id: programEnrollment.id }, { medha_program_certificate_status: 'low-attendance' });
      }
    });
  }
};

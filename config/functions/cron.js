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
      // create the certificate
      await strapi.services['program-enrollments'].generateCertificate(programEnrollment);
    });
  },
  '* * * * *': async () => {
    // cron to parse all students and fill registration_date_latest for them
    let studentIds = await strapi.connections.default.raw(
      `select DISTINCT(program_enrollments.student) from program_enrollments
      join students on students.id = program_enrollments.student
      where students.registration_date_latest is null
      order by program_enrollments.student
      limit 1000`
    );
    studentIds = JSON.stringify(studentIds.rows);
    studentIds = JSON.parse(studentIds).map((a) => a.student);
    console.log('studentIds', studentIds);
    await studentIds.forEach(async studentId => {
      let student = await strapi.services['students'].findOne({id: studentId});
      await strapi.services['students'].handleRegistrationDateLatest(student);
    });
  },
};

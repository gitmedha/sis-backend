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
    await generateProgramEnrollmentCertificates();
    await bulkUpdateRegisteredBy();
  },
};

const bulkUpdateRegisteredBy = async () => {
  await strapi.services['students'].bulkUpdateRegisteredBy();
}

const generateProgramEnrollmentCertificates = async () => {
  const programEnrollments = await strapi.services['program-enrollments'].find({ medha_program_certificate_status: 'processing', _limit: 3 });
  console.log('programEnrollments', programEnrollments.length);
  for (const programEnrollment of programEnrollments) {
    // create the certificate
    await strapi.services['program-enrollments'].generateCertificate(programEnrollment);
  }
}

const processRegistrationDateLatestForStudents = async () => {
  // cron to parse all students and fill registration_date_latest for them
  // disabled as of 2022-07-06 based on this task: https://github.com/gitmedha/medha-react-ui/issues/477
  let studentIds = await strapi.connections.default.raw(
    `select DISTINCT(program_enrollments.student) from program_enrollments
    join students on students.id = program_enrollments.student
    where students.registration_date_latest is null
    and program_enrollments.registration_date is not null
    order by program_enrollments.student
    limit 1000`
  );
  studentIds = JSON.stringify(studentIds.rows);
  studentIds = JSON.parse(studentIds).map((a) => a.student);
  console.log('studentIds', studentIds.length);
  await studentIds.forEach(async studentId => {
    let student = await strapi.services['students'].findOne({id: studentId});
    await strapi.services['students'].handleRegistrationDateLatest(student);
  });
}

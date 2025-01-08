'use strict';
const moment = require('moment');

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
  // '* * * * *': async () => {
  //   await generateCertificates();
  // },
'0 9 * * *': async () => { // Runs daily at 9:00 AM
    const batches = await strapi.services['batches'].find({status: 'In Progress'});

    for (const batch of batches) {
      const { last_attendance_date, status_changed_date} = batch;
      

    var assignedTo = await strapi.plugins['users-permissions'].services.user.fetch({
      id: Number(batch.assigned_to.id)
    });

    var srmName = assignedTo.username;
      var srmEmail = assignedTo.email;
      var managerEmail = assignedTo.reports_to?.email;
      const now = moment();

      // Grace period logic for batches transitioning from "On Hold" to "In-Progress"
      if (status_changed_date && moment(status_changed_date).isAfter(moment().subtract(5, 'days'))) {
        continue; // Skip batches within the grace period
      }

      // Check if last attendance was more than 5 days ago
      if (last_attendance_date && now.diff(moment(last_attendance_date), 'days') > 5) {
        // Trigger email
        await strapi.plugins['email'].services.email.send({
          to: srmEmail,
          cc: [managerEmail],
          subject: `Reminder: Please Mark Attendance for Batch ${batch.name}`,
          text: `
            Dear ${srmName},
            
            This is a reminder that attendance for batch ${batch.name} has not been updated since ${moment(last_attendance_date).format('MMMM DD, YYYY')}.
            Please ensure it is marked within the next 2 days to maintain accurate records.
            
            You can update the attendance by clicking on the following link:
            [Mark Attendance Now]
            
            Best,
            Data Management
          `,
        });
      }
    }
  }
};

const generateCertificates = async () => {
  const programEnrollments = await strapi.services['program-enrollments'].find({ medha_program_certificate_status: 'processing', _limit: 3 });
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

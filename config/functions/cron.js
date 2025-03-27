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
'00 11 * * *': async () => { // Runs daily at 11:00 AM
  try{
    const batches = await strapi.services['batches'].find({ status: 'In Progress' });

    for (const batch of batches) {
        const { last_attendance_date, status_changed_date, id, name } = batch;

        const assignedTo = await strapi.plugins['users-permissions'].services.user.fetch({
            id: Number(batch.assigned_to.id),
        });

        const srmName = assignedTo.username;
        const srmEmail = assignedTo.email;
        const managerEmail = assignedTo.reports_to?.email;

        const now = moment();

        // Skip batches within the grace period
        if (status_changed_date && moment(status_changed_date).isAfter(moment().subtract(5, 'days'))) {
            continue;
        }

        // Check if last attendance was more than 5 days ago
        if (last_attendance_date && now.diff(moment(last_attendance_date), 'days') > 1) {
            // Generate the dynamic link
            const baseUrl = 'https://sisstg.medha.org.in/';
            const attendanceLink = `${baseUrl}/batch/${id}`;

            // Trigger email
            await strapi.plugins['email'].services.email.send({
                to:srmEmail,
                cc: [managerEmail, 'kirti.gour@medha.org.in','maryam.raza@medha.org.in','sanskaar.pradhan@medha.org.in'],
                subject: `Reminder: Please Mark Attendance for Batch ${name}`,
                text: `
                    Dear ${srmName},
                    
                    This is a reminder that attendance for batch "${name}" has not been updated since ${moment(last_attendance_date).format('MMMM DD, YYYY')}.
                    Please ensure it is marked within the next 2 days to maintain accurate records.
                    
                    You can update the attendance by clicking on the following link:
                    [Mark Attendance Now](${attendanceLink})
                    
                    Best,
                    Data Management
                `,
                html: `
                    <p>Dear ${srmName},</p>
                    <p>
                        This is a reminder that attendance for batch "<strong>${name}</strong>" has not been updated since ${moment(last_attendance_date).format('MMMM DD, YYYY')}.
                        Please ensure it is marked within the next 2 days to maintain accurate records.
                    </p>
                    <p>
                        You can update the attendance by clicking on the following link:<br>
                        <a href="${attendanceLink}" target="_blank">Mark Attendance Now</a>
                    </p>
                    <p>Best,<br>Data Management</p>
                `,
            });
        }
    }

  }catch(e){
    console.log('Error in cron job', e);
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

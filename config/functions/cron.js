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
'30 5 * * 1-5': async () => { // Runs only Monday to Friday at 11:00 PM
  try {
    const batches = await strapi.services['batches'].find({ status: 'In Progress' });

    for (const batch of batches) {
        const { last_attendance_date, status_changed_date, id, name, assigned_to } = batch;

        // Skip if no assigned SRM
        if (!assigned_to) {
            console.log(`Skipping batch ${id} as no assigned SRM`);
            continue;
        }

        const assignedTo = await strapi.plugins['users-permissions'].services.user.fetch({
            id: Number(assigned_to.id),
        });

        const srmName = assignedTo?.username || "SRM";
        const srmEmail = assignedTo?.email;
        const managerEmail = assignedTo?.reports_to?.email;

        const now = moment();

        // Log dates for debugging

        // Skip batches within the grace period (excluding weekends)
        if (status_changed_date) {
            const workingDaysSinceStatusChange = countWeekdaysBetween(status_changed_date, now);
            if (workingDaysSinceStatusChange < 5) {
                console.log(`Skipping batch ${name} (ID: ${id}): Status changed recently (${workingDaysSinceStatusChange} working days ago)`);
                continue;
            }
        }

        // Check if last attendance was more than 5 working days ago
        if (last_attendance_date) {
            const workingDaysSinceAttendance = countWeekdaysBetween(last_attendance_date, now);
            if (workingDaysSinceAttendance > 5) {
                // Generate the dynamic link
                const baseUrl = 'https://sisstg.medha.org.in/';
                const attendanceLink = `${baseUrl}batch/${id}`;

                // Trigger email with error handling
                const emailBody = {
                  subject: `Reminder: Please Mark Attendance for Batch ${name}`,
                  text: `Dear ${srmName},\n\nThis is a reminder that attendance for batch "${name}" has not been updated since ${moment(last_attendance_date).format('MMMM DD, YYYY')}.\nPlease ensure it is marked within the next 2 days to maintain accurate records.\n\nYou can update the attendance by clicking on the following link:\n[Mark Attendance Now](${attendanceLink})\n\nBest,\nData Management`,
                  html: `
                  <p>Dear ${srmName},</p>
                  <p>This is a reminder that attendance for batch "<strong>${name}</strong>" has not been updated since ${moment(last_attendance_date).format('MMMM DD, YYYY')}.</p>
                  <p>Please ensure it is marked by today to maintain accurate records.</p>
                  <p>You can update the attendance by clicking on the following link : <a href="${attendanceLink}" target="_blank">Mark Attendance Now</a></p>
                  <p>Best,<br>Data Management</p>
              `
                }
                try {

                  await strapi.plugins['email'].services.email.sendTemplatedEmail({
                    to:'deepak.sharma@medha.org.in',
                    // cc:[managerEmail, 'kirti.gour@medha.org.in', 'maryam.raza@medha.org.in', 'sanskaar.pradhan@medha.org.in']
                  }, emailBody);
                  
                  await strapi.services['batches'].update({ id }, { reminder_sent: true});

                    console.log(`Email sent to ${srmEmail} for batch ${name} (ID: ${id})`);
                } catch (emailError) {
                    console.error(`Failed to send email for batch ${id}:`, emailError);
                }
            } else {
                console.log(`Skipping batch ${name} (ID: ${id}): Attendance was recently updated.`);
            }
        }
    }

  } catch (e) {
    console.error('Error in cron job:', e);
  }
}

};

const countWeekdaysBetween = (startDate, endDate) => {
  let count = 0;
  let current = moment(startDate);

  while (current.isBefore(endDate, 'day')) {
      const day = current.isoWeekday(); // 1 = Monday, 7 = Sunday
      if (day >= 1 && day <= 5) { // Only count weekdays
          count++;
      }
      current.add(1, 'day');
  }

  return count;
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

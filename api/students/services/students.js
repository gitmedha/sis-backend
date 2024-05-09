'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/services.html#core-services)
 * to customize this service
 */

module.exports = {
  async handleRegistrationDateLatest(student) {
    // get latest program enrollment for the student
    let latestProgramEnrollment = await strapi.services['students'].getLatestProgramEnrollment(student);
    if (latestProgramEnrollment) {
      await strapi.services['students'].update({ id: student.id }, {
        registration_date_latest: latestProgramEnrollment.registration_date
      });
    }
  },
  async getLatestProgramEnrollment(student) {
    return await strapi.services['program-enrollments'].findOne({ student: student.id, _sort: 'id:desc' });
  },
  async sendConfirmationEmail(studentInformation){
    let studentId = studentInformation.studentId;
    let name = studentInformation.name;
    let studentEmail = studentInformation.email;
    let parentsName = studentInformation.parentsName;
    let dateOfBirth = studentInformation.dateofBirth;
    let educationalInstitution = studentInformation.educationalInstitution;
    let course = studentInformation.course;
    let courseLevel = studentInformation.courseLevel;
    let yearOfStudy = studentInformation.yearOfStudy;
    let yearOfCompletion = studentInformation.yearOfCompletion;
    let courseName = studentInformation.courseName;
    let email = studentEmail;
    const emailTemplate = {
      subject: `Registered Successfully!`,
      text: ``,
      html: `
      <body>
        <p>Dear ${name},</p>
        <p>You have successfully registered for $program_name with Medha!</p>
        <p>Here are your details:</p>
        <ul>
            <li><strong>Student ID:</strong> ${studentId}</li>
            <li><strong>Name:</strong> ${name}</li>
            <li><strong>Father's/Mother's Name:</strong> ${parentsName}</li>
            <li><strong>Date Of Birth:</strong> ${dateOfBirth}</li>
            <li><strong>Course:</strong> ${course}</li>
            <li><strong>Course Level:</strong> ${courseLevel}</li>
            <li><strong>Year of Study:</strong> ${yearOfStudy}</li>
            <li><strong>Educational Institution:</strong> ${educationalInstitution}</li>
            <li><strong>Year of Course Completion:</strong> ${yearOfCompletion}</li>
            <li><strong>Course Name:</strong> ${courseName}"<li>
        </ul>
        <p>Please reach out to your trainer if any changes are required. </p>
        <p>Regards,<br>Medha</p>
      </body>
    `,
    };
    await strapi.plugins['email'].services.email.sendTemplatedEmail({
      to: email,
    }, emailTemplate);
    return true;
  }
};

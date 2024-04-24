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
  async sendEmailConfirmation(){
    let email = "jyoti.srivastav@coloredcow.com";
    const emailTemplate = {
      subject: `Congratulations!`,
      text: ``,
      html: `
      <p>Dear Jyoti,</p>
      Mail Triggered
    `,
    };
    await strapi.plugins['email'].services.email.sendTemplatedEmail({
      to: email,
    }, emailTemplate);
    return true;
  }
};

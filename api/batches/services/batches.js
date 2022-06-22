'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async handleProgramEnrollmentOnCompletion(batch) {
    const programEnrollments = await strapi.services['program-enrollments'].find({ batch: batch.id });
    programEnrollments.forEach(async programEnrollment => {
      let isEligibleForCertification = await strapi.services['program-enrollments'].isProgramEnrollmentEligibleForCertification(programEnrollment);

      let status = isEligibleForCertification ? 'Batch Complete' : 'Student Dropped Out';
      await strapi.services['program-enrollments'].update({ id: programEnrollment.id }, {
        status: status
      });
    });
    return batch;
  },

  async handleProgramEnrollmentOnCertification(batch) {
    await strapi.services['batches'].handleProgramEnrollmentOnCompletion(batch);

    // update certification date for the program enrollment record
    const programEnrollments = await strapi.services['program-enrollments'].find({ batch: batch.id });
    programEnrollments.forEach(async programEnrollment => {

      let isEligibleForCertification = await strapi.services['program-enrollments'].isProgramEnrollmentEligibleForCertification(programEnrollment);

      if (!isEligibleForCertification) {
        return;
      }
      let today = new Date().toISOString().split('T')[0]
      if (programEnrollment.certification_date !== null) {
        today = new Date(programEnrollment.certification_date).toISOString().split('T')[0]
      }
      await strapi.services['program-enrollments'].update({ id: programEnrollment.id }, {
        certification_date: today,
      });
    });

    // update status for the batch
    let updatedBatch = await strapi.services['batches'].update({ id: batch.id }, {
      status: 'Certified',
    });
    return updatedBatch;
  },

  async generateProgramEnrollmentCertificates(batch) {
    await strapi.services['batches'].handleProgramEnrollmentOnCompletion(batch);

    // update medha_program_certificate_status so that certificates can be generated by cron
    const programEnrollments = await strapi.services['program-enrollments'].find({ batch: batch.id });
    programEnrollments.forEach(async programEnrollment => {
      let isEligibleForCertification = await strapi.services['program-enrollments'].isProgramEnrollmentEligibleForCertification(programEnrollment);

      let medha_program_certificate_status = isEligibleForCertification ? 'processing' : 'low-attendance';
      await strapi.services['program-enrollments'].update({ id: programEnrollment.id }, {
        medha_program_certificate_status: medha_program_certificate_status,
      });
    });

    let updatedBatch = await strapi.services['batches'].update({ id: batch.id }, {
      certificates_generated_at: new Date(),
    });
    return updatedBatch;
  },

  async sendCertificateEmailToSrm(batch) {
    // send email to batch SRM
    let email = batch.assigned_to.email;
    let username = batch.assigned_to.username;
    let batchName = batch.name;
    let batchUrl = strapi.config.get('server.url') + `/batch/${batch.id}`; // to be replaced by batch URL
    const emailTemplate = {
      subject: 'Batch has been marked as certified by SIS Admin',
      text: `Dear ${username},\n\n
      Your batch ${batchName} has been marked as certified by the SIS admin.\n
      ${batchUrl}\n\n
      Please expect certificates to be distributed to the students in the next hour or so via email.\n\n
      Regards,\n
      Medha SIS
      `,
      html: `<p>Dear ${username},</p>
      <p>Your batch ${batchName} has been marked as certified by the SIS admin.<br>
      <a href="${batchUrl}">See the batch details</a><br><br>
      Please expect certificates to be distributed to the students in the next hour or so via email.
      </p>
      <p>Regards,<br>
      Medha SIS</p>`,
    };
    await strapi.plugins['email'].services.email.sendTemplatedEmail({
      to: email,
    }, emailTemplate);
  },

  async emailProgramEnrollmentCertificates(batch) {
    let updatedBatch = await strapi.services['batches'].update({ id: batch.id }, {
      certificates_emailed_at: new Date(),
    });
    await strapi.services['batches'].sendCertificateEmailToSrm(batch);
    const programEnrollments = await strapi.services['program-enrollments'].find({ batch: batch.id });
    programEnrollments.forEach(async programEnrollment => {
      await strapi.services['program-enrollments'].emailCertificate(programEnrollment);
    });
    return updatedBatch;
  },
};

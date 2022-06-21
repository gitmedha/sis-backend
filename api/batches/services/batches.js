'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async handleProgramEnrollmentOnCompletion(batch, handleCertificationProcessing = false) {
    console.log('handleProgramEnrollmentOnCompletionhandleProgramEnrollmentOnCompletion');
    const programEnrollments = await strapi.services['program-enrollments'].find({ batch: batch.id });
    const considerAssignmentFile = batch.require_assignment_file_for_certification;
    programEnrollments.forEach(async programEnrollment => {
      let isEligibleForCertification = await strapi.services['program-enrollments'].isProgramEnrollmentEligibleForCertification(programEnrollment);

      let medha_program_certificate_status = 'low-attendance';
      let status = 'Student Dropped Out';

      if (isEligibleForCertification) {
        medha_program_certificate_status = 'processing';
        status = 'Batch Complete';
      }

      let dataToUpdate = {status: status};
      if (handleCertificationProcessing) {
        dataToUpdate.medha_program_certificate_status = medha_program_certificate_status;
      }
      await strapi.services['program-enrollments'].update({ id: programEnrollment.id }, dataToUpdate);
    });

    return batch;
  },

  async handleProgramEnrollmentOnCertification(batch) {
    await strapi.services['batches'].handleProgramEnrollmentOnCompletion(batch);
    // update status for the batch
    let updatedBatchRecord = await strapi.services['batches'].update({ id }, {
      status: 'Certified',
    });
    return updatedBatchRecord;
  },

  async generateProgramEnrollmentCertificates(batch) {
    await strapi.services['batches'].handleProgramEnrollmentOnCompletion(batch, true);
    return batch;
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
    await strapi.services['batches'].sendCertificateEmailToSrm(batch);
    const programEnrollments = await strapi.services['program-enrollments'].find({ batch: batch.id });
    programEnrollments.forEach(async programEnrollment => {
      await strapi.services['program-enrollments'].emailCertificate(programEnrollment);
    });
    return batch;
  },
};

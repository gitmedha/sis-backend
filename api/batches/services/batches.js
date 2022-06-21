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
      let attendance = await strapi.services['program-enrollments'].calculateBatchAttendance(programEnrollment);

      let medha_program_certificate_status = 'processing';
      let status = 'Batch Complete';

      // check attendance is high enough or not
      if (isNaN(attendance) || attendance < 75) {
        medha_program_certificate_status = 'low-attendance';
        status = 'Student Dropped Out';
      }

      // check if assignment file is required or not
      // if assignment file is required, then it should be present
      if (considerAssignmentFile && !programEnrollment.assignment_file) {
        medha_program_certificate_status = 'low-attendance';
        status = 'Student Dropped Out';
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

  async emailProgramEnrollmentCertificates(batch) {
    const programEnrollments = await strapi.services['program-enrollments'].find({ batch: batch.id });
    programEnrollments.forEach(async programEnrollment => {
      await strapi.services['program-enrollments'].emailCertificate(programEnrollment);
    });
    return batch;
  },
};

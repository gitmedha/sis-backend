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
  async bulkUpdateRegisteredBy() {
    let students = await strapi.services['students'].find({ registered_by_null: true, _limit: 1000 });
    if (students.length) {
      console.log('total students to process: ', students.length);
      for (const student of students) {
        console.log('processing student: ', student.id);
        let studentProgramEnrollment = await strapi.services['program-enrollments'].findOne({
          student: student.id,
          institution_null: false,
          _sort: 'created_at:asc'
        });
        if (studentProgramEnrollment) {
          await strapi.services['students'].update({ id: student.id }, {
            registered_by: studentProgramEnrollment.institution.assigned_to
          });
        }
      }
      console.log('finished processing.');
    }
  }
};

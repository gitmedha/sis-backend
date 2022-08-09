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
    let students = await strapi.services['students'].find({ registered_by_null: true, _limit: 5000 });
    if (students.length) {
      console.log('total students to process: ', students.length);
      let count = 0;
      for (const student of students) {
        let studentProgramEnrollment = await strapi.services['program-enrollments'].findOne({
          student: student.id,
          institution_null: false,
          _sort: 'created_at:asc'
        });
        if (studentProgramEnrollment) {
          console.log('processing student: ', student.id);
          await strapi.services['students'].update({ id: student.id }, {
            registered_by: studentProgramEnrollment.institution.assigned_to
          });
          count++;
          if (count >= 1000) {
            // do 1000 updates and then exit
            break;
          }
        }
      }
      console.log('finished processing.');
    }
  }
};

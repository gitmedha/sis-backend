'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    // create from webhook
    async createFromWebhook (ctx) {

        const data = ctx.request.body
        var date = new Date(data.date_of_birth); // M-D-YYYY
        var dob_date = date.getDate();
        var dob_month = date.getMonth() + 1;
        var dob_year = date.getFullYear();

        const institution = await strapi.services.institutions.findOne({ id: data.institution_id });
        //add leading 0 if value of date and month is less than 10
        const dateString = dob_year+ '-'+(dob_month <= 9 ? '0' + dob_month : dob_month) + '-' + (dob_date <= 9 ? '0' + dob_date : dob_date); 

        const student = {}
        student.full_name = data.full_name
        student.email = data.email
        student.phone = data.phone
        student.status = 'New Request' // default status is Registered
        student.date_of_birth = dateString
        student.name_of_parent_or_guardian = data.parent_or_guardian_name
        student.category = data.category
        student.gender = data.gender
        student.assigned_to = institution.assigned_to.id
        student.income_level = data.income_level
        student.medha_champion = false
        student.interested_in_employment_opportunities = true
        student.address = data.address
        student.city = data.city
        student.pin_code = data.pin_code
        student.state = data.state
        student.district = data.district
        student.medha_area = data.area

        let studentEntity = await strapi.services.students.create(student)
        let sanitizedStudentEntity = sanitizeEntity(studentEntity, { model: strapi.models.students })
        console.log(`
            STUDENT CREATED ID: ${sanitizedStudentEntity.id}
            NAME: ${sanitizedStudentEntity.full_name}
            CREATED AT: ${sanitizedStudentEntity.created_at}
        `)

        const program = await strapi.services.programs.findOne({ id:data.program_id });   
        const money_id = data.payuMoneyId

        // create a program enrollment for the student
        const programEnrollment = {}
        programEnrollment.student = sanitizedStudentEntity
        programEnrollment.institution = institution
        programEnrollment.batch = program.default_enrollment_batch
        programEnrollment.status = 'Enrollment Request Received' // default status is Enrolled
        programEnrollment.registration_date = new Date()
        programEnrollment.fee_status = money_id == 0 ? 'Waived Off' : 'Paid'
        programEnrollment.fee_amount = data.amount
        programEnrollment.fee_transaction_id = data.fee_transaction_id
        programEnrollment.course_type = data.course_type
        programEnrollment.course_level = data.course_level
        programEnrollment.course_year = data.course_year
        programEnrollment.year_of_course_completion= data.year_of_course_completion
        programEnrollment.course_name_in_current_sis = data.course_name_in_current_sis
        programEnrollment.program_selected_by_student =program.name

        let programEnrollmentEntity = await strapi.services['program-enrollments'].create(programEnrollment)
        let sanitizedProgramEnrollmentEntity = sanitizeEntity(programEnrollmentEntity, { model: strapi.models['program-enrollments'] })
        console.log(`
            PROGRAM ENROLLMENT CREATED ID: ${sanitizedProgramEnrollmentEntity.id}
            STUDENT: ${sanitizedProgramEnrollmentEntity.student}
            CREATED AT: ${sanitizedProgramEnrollmentEntity.created_at}
        `)

        ctx.send(sanitizedStudentEntity)
        return sanitizedStudentEntity
    }
};

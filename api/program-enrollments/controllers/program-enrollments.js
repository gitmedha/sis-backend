'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    // create from webhook
    async createFromWebhook (ctx){
        const data = ctx.request.body
        
        const student = await strapi.services.students.findOne({ id: data.student_id });
        const institution = await strapi.services.institutions.findOne({ id: data.institution_id });
        const program = await strapi.services.programs.findOne({ id:data.program_id });
        const money_id = data.payuMoneyId

        // create a program enrollment for the student
        const programEnrollment = {}
        programEnrollment.student = student
        programEnrollment.institution = institution
        programEnrollment.batch = program.default_enrollment_batch
        programEnrollment.status = 'Enrollment Request Received' // default status is Enrolled
        programEnrollment.registration_date = new Date()
        programEnrollment.fee_status = money_id == 0 ? 'Waived Off' : 'Paid'
        programEnrollment.fee_amount = data.amount ? data.amount : null
        programEnrollment.fee_transaction_id = data.fee_transaction_id
        programEnrollment.course_type = data.course_type
        programEnrollment.course_level = data.course_level
        programEnrollment.course_year = data.course_year
        programEnrollment.program_selected_by_student = program.name
        programEnrollment.year_of_course_completion = data.year_of_course_completion
        programEnrollment.course_name_in_current_sis = data.course_name_in_current_sis
        programEnrollment.discount_code_id = data.discount_code ? data.discount_code : null
        programEnrollment.fee_payment_date = money_id == 0 ? null : new Date()

        let programEnrollmentEntity = await strapi.services['program-enrollments'].create(programEnrollment)
        let sanitizedProgramEnrollmentEntity = sanitizeEntity(programEnrollmentEntity, { model: strapi.models['program-enrollments'] })
        console.log(`
            PROGRAM ENROLLMENT CREATED ID: ${sanitizedProgramEnrollmentEntity.id}
            STUDENT: ${sanitizedProgramEnrollmentEntity.student}
            CREATED AT: ${sanitizedProgramEnrollmentEntity.created_at}
        `)

        ctx.send(sanitizedProgramEnrollmentEntity)
        return sanitizedProgramEnrollmentEntity
    }
};

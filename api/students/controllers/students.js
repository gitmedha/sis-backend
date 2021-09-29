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

        const student = {}
        student.first_name = data.firstname
        student.last_name = data.lastname
        student.email = data.email
        student.phone = data.phone
        student.status = 'Registered' // default status is Registered
        // student.date_of_birth = NOT_FOUND
        // student.name_of_parent_or_guardian = NOT_FOUND
        // student.category = NOT_FOUND
        // student.gender = NOT_FOUND
        // student.old_sis_id = NOT_FOUND
        // student.income_level = NOT_FOUND
        // student.cv = NOT_FOUND
        // student.logo = NOT_FOUND
        // student.registration_date_latest = NOT_FOUND
        // student.certification_date_latest = NOT_FOUND
        // student.internship_date_latest = NOT_FOUND
        // student.placement_date_latest = NOT_FOUND
        // student.course_type_latest = NOT_FOUND
        student.medha_champion = false
        student.interested_in_employment_opportunities = true
        student.address = `${data.address1} ${data.address2}`
        student.city = data.city
        student.pin_code = data.zipcode
        // student.state = data.zipcode
        // student.medha_area = data.zipcode
        // student.assigned_to = NOT_FOUND

        let studentEntity = await strapi.services.students.create(student)
        let sanitizedStudentEntity = sanitizeEntity(studentEntity, { model: strapi.models.students })
        console.log(`
            STUDENT CREATED ID: ${sanitizedStudentEntity.id}
            NAME: ${sanitizedStudentEntity.first_name}
            CREATED AT: ${sanitizedStudentEntity.created_at}
        `)

        const institution = await strapi.services.restaurant.findOne({ id: data.batch_id });
        const batch = await strapi.services.restaurant.findOne({ id: data.institution_id });

        // create a program enrollment for the student
        const programEnrollment = {}
        programEnrollment.student = sanitizedStudentEntity
        programEnrollment.batch = batch
        programEnrollment.institution = institution
        programEnrollment.status = 'Enrolled' // default status is Enrolled
        // programEnrollment.registration_date = NOT_FOUND
        // programEnrollment.fee_status = NOT_FOUND
        programEnrollment.fee_payment_date = data.addedon
        programEnrollment.fee_amount = data.net_amount_debit
        programEnrollment.fee_transaction_id = data.txnid
        // programEnrollment.fee_refund_status = NOT_FOUND
        // programEnrollment.fee_refund_date = NOT_FOUND
        // programEnrollment.course_type = NOT_FOUND
        // programEnrollment.course_level = NOT_FOUND
        // programEnrollment.course_year = NOT_FOUND
        // programEnrollment.year_of_course_completion = NOT_FOUND
        // programEnrollment.certification_date = NOT_FOUND
        // programEnrollment.institution_name_entered_by_student = NOT_FOUND
        // programEnrollment.medha_program_certificate = NOT_FOUND
        // programEnrollment.course_name_in_current_sis = NOT_FOUND
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

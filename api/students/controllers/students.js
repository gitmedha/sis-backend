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
        const dob =data.date_of_birth
        var date = new Date(dob); // M-D-YYYY
        var d = date.getDate();
        var m = date.getMonth() + 1;
        var y = date.getFullYear();
        const dateString = y+ '-'+(m <= 9 ? '0' + m : m) + '-' + (d <= 9 ? '0' + d : d);

        const student = {}
        student.full_name = data.full_name
        student.email = data.email
        student.phone = data.phone
        student.status = 'New Request' // default status is Registered
        student.date_of_birth = dateString
        student.name_of_parent_or_guardian = data.parent_or_guardian_name
        student.category = data.category
        student.gender = data.gender
        student.assigned_to = 353 //pehel.signup@medha.org.in
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

        const institution = await strapi.services.institutions.findOne({ id: data.institution_id });
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

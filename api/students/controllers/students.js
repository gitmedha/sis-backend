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
        student.full_name = data.full_name
        student.email = data.email
        student.phone = data.phone
        student.status = 'New Request' // default status is Registered
	student.date_of_birth = data.date_of_birth
        student.name_of_parent_or_guardian = data.parent_or_guardian_name
        student.category = data.category
        student.gender = data.gender
	student.assigned_to = 353
        // student.old_sis_id = NOT_FOUND
        student.income_level = data.income_level
	// student.cv = NOT_FOUND
        // student.logo = NOT_FOUND
	// student.registration_date_latest = NOT_FOUND
        // student.certification_date_latest = NOT_FOUND
        // student.internship_date_latest = NOT_FOUND
        // student.placement_date_latest = NOT_FOUND
        // student.course_type_latest = NOT_FOUND
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

       // const batch = await strapi.services.batches.findOne({ id: data.batch_id });
        const institution = await strapi.services.institutions.findOne({ id: data.institution_id });
	const program = await strapi.services.programs.findOne({ id:data.program_id });   
        const money_id = data.payuMoneyId

        // create a program enrollment for the student
        const programEnrollment = {}
        programEnrollment.student = sanitizedStudentEntity
        //programEnrollment.batch = batch
        programEnrollment.institution = institution
	programEnrollment.batch = program.default_enrollment_batch
        programEnrollment.status = 'Enrollment Request Received' // default status is Enrolled
        programEnrollment.registration_date = new Date()
	
	    if(money_id == 0){
              programEnrollment.fee_status ='Waived off'
	    }   
	    else{
  	      programEnrollment.fee_status='Paid'
	    }
        // programEnrollment.fee_status = NOT_FOUND
        // programEnrollment.fee_payment_date = data.addedon
        programEnrollment.fee_amount = data.amount
        programEnrollment.fee_transaction_id = data.fee_transaction_id
        // programEnrollment.fee_refund_status = NOT_FOUND
        // programEnrollment.fee_refund_date = NOT_FOUND
        programEnrollment.course_type = data.course_type
        programEnrollment.course_level = data.course_level
        programEnrollment.course_year = data.course_year
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

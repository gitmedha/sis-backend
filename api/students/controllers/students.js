'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {

    async create(ctx) {
        let entity;    
        logged_in_user = ctx.state.user.id;
        data = ctx.request.body;
        data.assigned_to = data.assigned_to == null ? logged_in_user : data.assigned_to;
        data.created_by_frontend = logged_in_user;
        data.updated_by_frontend = logged_in_user;
        entity = await strapi.services.students.create(data);
        return sanitizeEntity(entity, { model: strapi.models.students});
      },
    
      async update(ctx) {
        const { id } = ctx.params;
        let entity;
        logged_in_user = ctx.state.user.id;
        data = ctx.request.body;
        data.updated_by_frontend = logged_in_user;
        entity = await strapi.services.students.update({ id }, data);
        return sanitizeEntity(entity, { model: strapi.models.students });
      },

    // create from webhook
    async createFromWebhook (ctx) {
        const data = ctx.request.body
        var date = new Date(data.date_of_birth); // M-D-YYYY
        var dob_date = date.getDate();
        var dob_month = date.getMonth() + 1;
        var dob_year = date.getFullYear();

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
    },

    async delete(ctx) {
        const { id } = ctx.params;
        const record = await strapi.services.students.findOne({ id });
        if (!record.assigned_to) {
            ctx.throw(401, 'This record is not assigned to any user!');
        } else if ( 
            (ctx.state.user.role.name == "Basic" && record.assigned_to.id == ctx.state.user.id) ||
            (ctx.state.user.role.name == "Advanced" && record.medha_area == ctx.state.user.area) ||
            ctx.state.user.role.name == "Admin"
        ) {
            const entity = await strapi.services.students.delete({ id });
            return sanitizeEntity(entity, { model: strapi.models.students });
        } else {
            ctx.throw(401, 'You are not allowed to delete this record!', { user: ctx.state.user.username});
        }
      },
};

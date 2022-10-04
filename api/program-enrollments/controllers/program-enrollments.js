const { sanitizeEntity } = require('strapi-utils');

module.exports = {

  async create(ctx) {
    let entity;
    logged_in_user = ctx.state.user.id;
    data = ctx.request.body;
    data.created_by_frontend = logged_in_user;
    data.updated_by_frontend = logged_in_user;
    entity = await strapi.services['program-enrollments'].create(data);
    return sanitizeEntity(entity, { model: strapi.models['program-enrollments']});
  },

  async update(ctx) {
    const { id } = ctx.params;
    let entity;
    logged_in_user = ctx.state.user.id;
    data = ctx.request.body;
    data.updated_by_frontend = logged_in_user;
    entity = await strapi.services['program-enrollments'].update({ id }, data);
    return sanitizeEntity(entity, { model: strapi.models['program-enrollments'] });
  },

  async generateCertificate(ctx) {
    const { id } = ctx.params;
    // fetch program enrollment details
    const programEnrollment = await strapi.services['program-enrollments'].findOne({ id });

    // AuditLog: user triggered certificate generation
    const logged_in_user = ctx.state.user;
    await strapi.services['audit-logs'].create({
      user: ctx.state?.user?.id,
      action: 'user_triggered_certificate_generation',
      content: `Certificate generation started for program enrollment ID ${programEnrollment.id} by user "${ctx.state.user.username}" having ID ${logged_in_user.id}`,
    });

    let isEligibleForCertification = await strapi.services['program-enrollments'].isProgramEnrollmentEligibleForCertification(programEnrollment);
    if (isEligibleForCertification) {
      const updatedProgramEnrollment = await strapi.services['program-enrollments'].generateCertificate(programEnrollment);
      return ctx.send({programEnrollment: updatedProgramEnrollment});
    }
    return ctx.send({ programEnrollment });
  },

  async deleteCertificate(ctx) {
    const { id } = ctx.params;
    // fetch program enrollment details
    const programEnrollment = await strapi.services['program-enrollments'].findOne({ id });

    // AuditLog: user triggered certificate generation
    const logged_in_user = ctx.state.user;
    await strapi.services['audit-logs'].create({
      user: ctx.state?.user?.id,
      action: 'user_triggered_certificate_deletion',
      content: `Certificate deleted for program enrollment ID ${programEnrollment.id} by user "${ctx.state.user.username}" having ID ${logged_in_user.id}`,
    });

    const updatedProgramEnrollment = await strapi.services['program-enrollments'].deleteCertificate(programEnrollment);
    return ctx.send({programEnrollment: updatedProgramEnrollment});
  },

  async delete(ctx) {
    const { id } = ctx.params;
    const record = await strapi.services['program-enrollments'].findOne({ id });
    if (!record.student.assigned_to) {
        ctx.throw(401, 'This student is not assigned to any user!');
    } else if (
        (ctx.state.user.role.name == "Basic" && record.student.assigned_to.id == ctx.state.user.id) ||
        (ctx.state.user.role.name == "Advanced" && record.student.medha_area == ctx.state.user.area) ||
        ctx.state.user.role.name == "Admin"
    ) {
        const entity = await strapi.services['program-enrollments'].delete({ id });
        return sanitizeEntity(entity, { model: strapi.models['program-enrollments'] });
    } else {
        ctx.throw(401, 'You are not allowed to delete this record!', { user: ctx.state.user.username});
    }
  },

  // create from webhook
  async createFromWebhook (ctx){
    const data = ctx.request.body
    const logged_in_user = ctx.state.user.id;

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
    programEnrollment.created_by_frontend = logged_in_user;
    programEnrollment.updated_by_frontend = logged_in_user;

    let programEnrollmentEntity = await strapi.services['program-enrollments'].create(programEnrollment)
    let sanitizedProgramEnrollmentEntity = sanitizeEntity(programEnrollmentEntity, { model: strapi.models['program-enrollments'] })
    console.log(`
        PROGRAM ENROLLMENT CREATED ID: ${sanitizedProgramEnrollmentEntity.id}
        STUDENT: ${sanitizedProgramEnrollmentEntity.student}
        CREATED AT: ${sanitizedProgramEnrollmentEntity.created_at}
    `)

    if (data.discount_code) {
      await strapi.services['discount-codes'].markDiscountCodeAsExpired(data.discount_code);
    }

    ctx.send(sanitizedProgramEnrollmentEntity)
    return sanitizedProgramEnrollmentEntity
  },

};

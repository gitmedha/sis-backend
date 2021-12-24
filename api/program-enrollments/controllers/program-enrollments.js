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
    const record = await strapi.services['program-enrollments'].findOne({ id });
    student_name = record.student.full_name
    student_id  = record.student.student_id
    batch_name = record.batch.name
    institution_name = record.institution.name
    institution_area = record.institution.medha_area
    course_type = record.course_type


    // const { id } = ctx.params;
    let entity;
    logged_in_user = ctx.state.user.id;
    data = ctx.request.body;
    data.updated_by_frontend = logged_in_user;
    entity = await strapi.services['program-enrollments'].update({ id }, data);
    return sanitizeEntity(entity, { model: strapi.models['program-enrollments'] });
  },

  async markAsCertified(ctx) {
    const fs = require('fs');
    const path = require('path');
    const puppeteer = require('puppeteer');
    const content = fs.readFileSync(
      path.resolve(__dirname, 'certificate.html'),
      'utf8'
    );
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage();
    await page.setContent(content);
    let certificateFileName = (new Date()).getTime() + '.pdf';
    let certficatePath = `./public/uploads/program-enrollment-certificates/${certificateFileName}`;
    let certficateUrl = `http://localhost:1339/uploads/program-enrollment-certificates/${certificateFileName}`;
    await page.pdf({
      path: certficatePath,
      format: 'A4',
      printBackground: true,
      margin: {
        left: '0px',
        top: '0px',
        right: '0px',
        bottom: '0px'
      }
    });
    await browser.close();

    const programEnrollment = {certficateUrl: certficateUrl};
    return programEnrollment;
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
  },

};

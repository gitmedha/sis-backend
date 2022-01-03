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
    const record = await strapi.services['program-enrollments'].findOne({ id });
    const program = await strapi.services['programs'].findOne({ id: record.batch.program });
    student_name = record.student.full_name
    student_id  = record.student.student_id
    program_name = program.name
    institution_name = record.institution.name
    institution_area = record.institution.medha_area
    course_type = record.course_type
    certification_date = new Date(record.certification_date);
    let monthsList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    certification_date_formatted = certification_date.getDate() + " " + monthsList[certification_date.getMonth()] + ", " + certification_date.getFullYear();

    // load dependencies
    const fs = require('fs');
    const path = require('path');
    const puppeteer = require('puppeteer');

    // read html file content and save it in a variable
    let content = fs.readFileSync(
      path.resolve('./public/program-enrollment-certificate-template/certificate.html'),
      'utf8'
    );

    // replace template variables with program enrollment data
    let institution_logo_html = '';
    if (record.institution.logo) {
      institution_logo_html = `<img src="${record.institution.logo.url}" class="institution-logo" alt="${institution_name}">`;
    }
    content = content.replace(/{{institution_logo}}/g, institution_logo_html);

    if (institution_area) {
      institution_name = `${institution_name}, ${institution_area}`
    }
    content = content.replace(/{{app_url}}/g, strapi.config.get('server.url'));
    content = content.replace(/{{institution_name}}/g, institution_name);
    content = content.replace(/{{student_name}}/g, student_name);
    content = content.replace(/{{program_name}}/g, program_name);
    content = content.replace(/{{student_id}}/g, student_id);
    content = content.replace(/{{certification_date}}/g, certification_date_formatted);
    content = content.replace(/{{certificate_no}}/g, id);

    // create puppeteer instance
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage();
    await page.setContent(content, { waitUntil: 'networkidle2' });

    // set certificate file details
    let certificateFileName = `${id}-` + (new Date()).getTime() + '.pdf';
    let certificatePath = `./public/${certificateFileName}`;

    // generate pdf
    await page.pdf({
      path: certificatePath,
      width: '1440px',
      height: '1120px',
      printBackground: true,
      margin: {
        left: '0px',
        top: '0px',
        right: '0px',
        bottom: '0px'
      }
    });

    // terminate puppeteer instance
    await browser.close();

    // prepare file to be uploaded into strapi media uploads
    let filePath = certificatePath;
    let fileStat = fs.statSync(filePath);
    let fileUpload = await strapi.plugins.upload.services.upload.upload({
      data: {},
      files: {
        path: filePath,
        name: certificateFileName,
        type: 'application/pdf',
        size: fileStat.size,
      }
    });

    // update certificate url for the program enrollment record
    const updatedRecord = await strapi.services['program-enrollments'].update({ id }, {
      medha_program_certificate: fileUpload[0].id,
      status: 'Certified by Medha',
    });

    // delete the generated certificate file
    fs.unlinkSync(certificatePath);

    // // send email
    // let email = record.student.email;
    // let username = student_name;
    // let certificateLink = updatedRecord.medha_program_certificate.url;
    // const emailTemplate = {
    //   subject: 'Your program enrollment certificate from Medha SIS',
    //   text: `Dear ${username},\n\n
    //   Thank you for enrolling in our program. Please click on the below link to see your program enrollment certificate.\n
    //   ${certificateLink}\n\n
    //   Regards,\n
    //   Medha SIS
    //   `,
    //   html: `<p>Dear ${username},</p>
    //   <p>Thank you for enrolling in our program. Please click on the below link to see your program enrollment certificate.<br>
    //   <a href="${certificateLink}">See your certificate</a></p>
    //   <p>Regards,<br>
    //   Medha SIS</p>`,
    // };
    // await strapi.plugins['email'].services.email.sendTemplatedEmail({
    //   to: email,
    // }, emailTemplate);

    return ctx.send({programEnrollment: updatedRecord});
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

    ctx.send(sanitizedProgramEnrollmentEntity)
    return sanitizedProgramEnrollmentEntity
  },

};

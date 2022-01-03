const { sanitizeEntity } = require('strapi-utils');

module.exports = {

  async create(ctx) {
    let entity;
    logged_in_user = ctx.state.user.id;
    data = ctx.request.body;
    data.assigned_to = data.assigned_to == null ? logged_in_user : data.assigned_to;
    data.created_by_frontend = logged_in_user;
    data.updated_by_frontend = logged_in_user;
    entity = await strapi.services.batches.create(data);
    return sanitizeEntity(entity, { model: strapi.models.batches});
  },

  async update(ctx) {
    const { id } = ctx.params;
    let entity;
    logged_in_user = ctx.state.user.id;
    data = ctx.request.body;
    data.updated_by_frontend = logged_in_user;
    entity = await strapi.services.batches.update({ id }, data);
    return sanitizeEntity(entity, { model: strapi.models.batches });
  },

  async delete(ctx) {
    const { id } = ctx.params;
    const record = await strapi.services.batches.findOne({ id });
    if (!record.assigned_to) {
        ctx.throw(401, 'This record is not assigned to any user!');
    } else if (
        (ctx.state.user.role.name == "Basic" && record.assigned_to.id == ctx.state.user.id) ||
        (ctx.state.user.role.name == "Advanced" && record.medha_area == ctx.state.user.area) ||
        ctx.state.user.role.name == "Admin"
    ) {
        const entity = await strapi.services.batches.delete({ id });
        return sanitizeEntity(entity, { model: strapi.models.batches });
    } else {
        ctx.throw(401, 'You are not allowed to delete this record!', { user: ctx.state.user.username});
    }
  },

  async markAsComplete(ctx) {

    const { id } = ctx.params;

    // fetch batch details
    const batch = await strapi.services['batches'].findOne({ id });
    const programEnrollments = await strapi.services['program-enrollments'].find({ batch: batch.id });
    const program = batch.program;
    const monthsList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // load dependencies
    const fs = require('fs');
    const path = require('path');
    const puppeteer = require('puppeteer');

    // loop every programEnrollment
    programEnrollments.forEach(async (record) => {
      let student_name = record.student.full_name
      let student_id  = record.student.student_id
      let program_name = program.name
      let institution_name = record.institution.name
      let institution_area = record.institution.medha_area
      let certification_date = new Date(record.certification_date);
      let certification_date_formatted = certification_date.getDate() + " " + monthsList[certification_date.getMonth()] + ", " + certification_date.getFullYear();

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
      content = content.replace(/{{certificate_no}}/g, record.id);

      // create puppeteer instance
      let browser = await puppeteer.launch({ headless: true })
      let page = await browser.newPage();
      await page.setContent(content, { waitUntil: 'networkidle2' });

      // set certificate file details
      let certificateFileName = `${record.id}-` + (new Date()).getTime() + '.pdf';
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
      let updatedRecord = await strapi.services['program-enrollments'].update({ id: record.id }, {
        medha_program_certificate: fileUpload[0].id,
        status: 'Certified by Medha',
      });

      // delete the generated certificate file
      fs.unlinkSync(certificatePath);

      // // send email
      // let email = record.student.email;
      // let username = student_name;
      // let certificateLink = updatedRecord.medha_program_certificate.url;
      // let emailTemplate = {
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
    });

    // update status for the batch
    let updatedBatchRecord = await strapi.services['batches'].update({ id }, {
      status: 'Certified',
    });

    return ctx.send({batch: updatedBatchRecord});
  },
};

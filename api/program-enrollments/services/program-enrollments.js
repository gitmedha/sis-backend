'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async generateCertificate(programEnrollment) {
    const program = await strapi.services['programs'].findOne({ id: programEnrollment.batch.program });
    let student_name = programEnrollment.student.full_name
    let student_id  = programEnrollment.student.student_id
    let program_name = program.name
    let institution_name = programEnrollment.institution.name
    let course_name = programEnrollment.course_name_in_current_sis

    let today = new Date().toISOString().split('T')[0]
    let certification_date = new Date(today);
    if (programEnrollment.certification_date !== null) {
      today = new Date(programEnrollment.certification_date).toISOString().split('T')[0]
      certification_date = new Date(today);
    }

    let monthsList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    let certification_date_formatted = certification_date.getDate() + " " + monthsList[certification_date.getMonth()] + ", " + certification_date.getFullYear();

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
    if (programEnrollment.institution.logo) {
      institution_logo_html = `<img src="${programEnrollment.institution.logo.url}" class="institution-logo" alt="${institution_name}">`;
    }
    content = content.replace(/{{institution_logo}}/g, institution_logo_html);

    content = content.replace(/{{app_url}}/g, strapi.config.get('server.url'));
    content = content.replace(/{{institution_name}}/g, institution_name);
    content = content.replace(/{{student_name}}/g, student_name);
    content = content.replace(/{{program_name}}/g, program_name);
    content = content.replace(/{{course_name}}/g, course_name);
    content = content.replace(/{{student_id}}/g, student_id);
    content = content.replace(/{{certification_date}}/g, certification_date_formatted);
    content = content.replace(/{{certificate_no}}/g, programEnrollment.id);

    // create puppeteer instance
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage();
    await page.setContent(content, { waitUntil: 'networkidle2' });

    // set certificate file details
    let certificateFileName = `${programEnrollment.id}-` + (new Date()).getTime() + '.pdf';
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
    const updatedProgramEnrollment = await strapi.services['program-enrollments'].update({ id: programEnrollment.id }, {
      medha_program_certificate: fileUpload[0].id,
      status: 'Certified by Medha',
      medha_program_certificate_status: 'complete',
      certification_date: today,
    });

    // update status for the student record
    await strapi.services['students'].update({ id: programEnrollment.student.id }, {
      status: 'Certified',
    });

    // delete the generated certificate file
    fs.unlinkSync(certificatePath);

    return updatedProgramEnrollment;
  },

  async isProgramEnrollmentEligibleForCertification(programEnrollment) {
    let attendance = await strapi.services['program-enrollments'].calculateBatchAttendance(programEnrollment);

    // check attendance is high enough or not
    if (isNaN(attendance) || attendance < 75) {
      return false;
    }

    // check if assignment file is required or not
    // if assignment file is required, then it should be present
    const considerAssignmentFile = programEnrollment.batch.require_assignment_file_for_certification;
    if (considerAssignmentFile && !programEnrollment.assignment_file) {
      return false;
    }

    return true;
  },

  async emailCertificate(programEnrollment) {
    if (!programEnrollment.medha_program_certificate) {
      return false;
    }

    let isEligibleForCertification = await strapi.services['program-enrollments'].isProgramEnrollmentEligibleForCertification(programEnrollment);
    if (!isEligibleForCertification) {
      return false;
    }

    // send email
    let username = programEnrollment.student.full_name
    let email = programEnrollment.student.email;
    let batchName = programEnrollment.batch.name;
    let assignedToName = programEnrollment.batch.assigned_to.username;
    let certificateLink = programEnrollment.medha_program_certificate.url;
    let strapiUrl = strapi.config.get('server.url');
    let fbIconLink = `${strapiUrl}/images/email/icon-facebook.png`;
    let igIconLink = `${strapiUrl}/images/email/icon-instagram.png`;
    let liIconLink = `${strapiUrl}/images/email/icon-linkedin.png`;
    let gplayIconLink = `${strapiUrl}/images/email/icon-googleplay.png`;
    let emailImageLink = `${strapiUrl}/images/email/student-certification-email-image.jpg`;

    const emailTemplate = {
      subject: `Congratulations! You have successfully completed ${batchName}`,
      text: ``,
      html: `
        <p>Dear ${username},</p>
        <p><strong>Congratulations!</strong> You have completed the <strong>${batchName}</strong>. Please download your e-certificate using the link below.</p><br>
        <a href="${certificateLink}">Download Medha e-certificate</a><br><br>
        <p style="font-style: italic;">Your journey hasn't ended; it has just begun...</p><br>
        <p>You are now a proud member of our Medhavi Association with over 15,000 young and diverse people like you! Our team will continue to support you in your career dreams through our distinct alumni engagement programs.</p><br>
        <img src="${emailImageLink}" height="350" /><br><br>
        <p>To know more, join our channels:</p><br>
        <div>
          <a style="display: inline;text-decoration: none;" href="https://facebook.com">
            <img src="${fbIconLink}" height="45" />
          </a>
          <a style="display: inline;text-decoration: none;margin-left: 30px;" href="https://instagram.com">
            <img src="${igIconLink}" height="45" />
          </a>
          <a style="display: inline;text-decoration: none;margin-left: 30px;" href="https://linkedin.com">
            <img src="${liIconLink}" height="45" />
          </a>
        </div><br><br>
        <p>And download the Medhavi app to stay updated on upcoming events and opportunities!</p><br>
        <a style="display: inline;text-decoration: none;" href="https://google.com">
          <img src="${gplayIconLink}" height="55" />
        </a><br>
        <p>For any queries/concerns regarding your e-certificate, please call: 9454354135.</p><br>
        <p style="font-style: italic;">Medha force be with you!</p><br>
        <p>Best wishes<br>
        ${assignedToName}</p>
      `,
    };
    await strapi.plugins['email'].services.email.sendTemplatedEmail({
      to: email,
    }, emailTemplate);

    return true;
  },

  // calculates attendance for a program enrollment in it's batch
  async calculateBatchAttendance(programEnrollment) {
    // get batch for the program enrollment
    let batch = programEnrollment.batch;

    // get count of all sessions in the batch
    let sessionCount = await strapi.services['sessions'].count({ batch: batch.id });

    // get count of all attendance entries for the program enrollment
    let attendanceCount = await strapi.services['attendance'].count({ program_enrollment: programEnrollment.id, present: true });

    let percentage = (attendanceCount / sessionCount) * 100;
    percentage = Number.parseFloat(percentage).toFixed(2);

    return percentage;
  }
};

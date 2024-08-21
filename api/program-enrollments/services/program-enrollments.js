'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async generateCertificate(programEnrollment) {

    // AuditLog: certificate generation started
    await strapi.services['audit-logs'].create({
      action: 'certificate_generation_started',
      content: `Certificate generation started for program enrollment ID ${programEnrollment.id}`,
    });

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

    let certifcateFilePath = '';
    switch (program.certificate) {
      case 'svapoorna':
        certifcateFilePath = './public/program-enrollment-certificate-template/svapoorna/certificate.html';
        break;

      case 'pehliudaan':
        certifcateFilePath = './public/program-enrollment-certificate-template/pehliUdaan/certificate.html';
        break;

      case 'default':
      default:
        certifcateFilePath = './public/program-enrollment-certificate-template/default/certificate.html';
        break;
    }

    // read html file content and save it in a variable
    let content = fs.readFileSync(
      path.resolve(certifcateFilePath),
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

    // delete the generated certificate file
    fs.unlinkSync(certificatePath);

    // AuditLog: certificate generation finished
    await strapi.services['audit-logs'].create({
      action: 'certificate_generation_finished',
      content: `Certificate generation finished for program enrollment ID ${programEnrollment.id}. Certificate file upload ID: ${fileUpload[0].id}`,
    });

    return updatedProgramEnrollment;
  },

  async deleteCertificate(programEnrollment) {
    if (programEnrollment.medha_program_certificate) {
      await strapi.plugins['upload'].services.upload.remove({
        id: programEnrollment.medha_program_certificate.id
      });
      programEnrollment.medha_program_certificate = null;
    }
    return programEnrollment;
  },

  async isProgramEnrollmentEligibleForCertification(programEnrollment,changeAttandance) {

    let attendance = await strapi.services['program-enrollments'].calculateBatchAttendance(programEnrollment);

    // check attendance is high enough or not

    if (changeAttandance){
      if(isNaN(attendance) || attendance< 100){
        return false
      }
    }
    else {
      if (isNaN(attendance) || attendance < 75) {
        return false;
      }
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
    let assignedTo = await strapi.plugins['users-permissions'].services.user.fetch({
      id: programEnrollment.batch.assigned_to
    });
    let assignedToName = assignedTo.username || 'Medha Team';
    let certificateLink = programEnrollment.medha_program_certificate.url;
    let strapiUrl = strapi.config.get('server.url');
    let fbIconLink = `${strapiUrl}/images/email/icon-facebook.png`;
    let igIconLink = `${strapiUrl}/images/email/icon-instagram.png`;
    let liIconLink = `${strapiUrl}/images/email/icon-linkedin.png`;
    let gplayIconLink = `${strapiUrl}/images/email/icon-googleplay.png`;
    let emailImageLink = `${strapiUrl}/images/email/student-certificate-email-image.png`;

    const emailTemplate = {
      subject: `Congratulations! You have successfully completed ${batchName}`,
      text: ``,
      html: `
      <p>Dear ${username},</p>
      <p><strong>Congratulations!</strong> You have completed the <strong>${batchName}</strong>. Please find your e-certificate attached to this mail.</p>
      <p>Click to <a href="${certificateLink}">download Medha e-certificate</a><br><br></p>
      <p style="font-style: italic;">Your journey hasn't ended; it has just begun...</p>
      <p>Did you know? You can now become a member of a vibrant community known as Medhavi Association that is for the Medhavis, by the Medhavis!<br><br>
      For more information, reach out to our Medhavi Helpline +91-9454354135.</p>
      <img src="${emailImageLink}" height="500" /><br><br>
      <p>Follow our channels on:</p>
      <div>
        <a style="display: inline;text-decoration: none;" href="https://www.facebook.com/groups/548093505304442">
          <img src="${fbIconLink}" height="45" />
        </a>
        <a style="display: inline;text-decoration: none;margin-left: 15px;" href="https://www.instagram.com/medhavi_association/">
          <img src="${igIconLink}" height="45" />
        </a>
        <a style="display: inline;text-decoration: none;margin-left: 15px;" href="https://www.linkedin.com/company/medhavi-association/">
          <img src="${liIconLink}" height="45" />
        </a>
      </div><br>
      <p>You can also download the Medhavi App to stay updated on upcoming events and opportunities!</p>
      <a style="display: inline;text-decoration: none;" href="https://play.google.com/store/apps/details?id=org.medha">
        <img src="${gplayIconLink}" height="55" />
      </a><br>
      <p style="font-style: italic;">Medha force be with you!</p>
      <p>Best wishes<br>
      ${assignedToName}</p>
    `,
    };
    await strapi.plugins['email'].services.email.sendTemplatedEmail({
      to: email,
    }, emailTemplate);

    return true;
  },

  async sendLink(programEnrollment) {
    let username = programEnrollment.student.full_name
    let email = programEnrollment.student.email;
    let batchId = programEnrollment.batch.program;

    const emailTemplate =
    batchId === 21 ?
    {
      subject: `Medha Program Feedback Form`,
      text: ``,
      html: `
        <p>प्रिय ${username},</p>
        <p>आपने हाल ही में स्वारंभ (मेधा) यात्रा पूरा किया है, जिसके तीन चरण थे: ज्ञान, कौशल और क्षमता। इस यात्रा के दौरान सीखे गए हर पहलू को अपने व्यक्तिगत/व्यावसायिक जीवन में लागू करने के लिए आप तैयार हैं।</p>
        <p>इससे पहले कि आप मेधा से आगे अपनी यात्रा शुरू करें, हमें अच्छा लगेगा कि आप अपने इस स्वरंभ (मेधा) यात्रा का अनुभव हमारे साथ साझा करें। आज हम आपके साथ एक feedback form का लिंक शेयर कर रहें हैं, जिसमें आप हमें बताएंगे की इस स्वारम्भ के यात्रा में आपने क्या क्या सीखा? - <a href="https://medhasurvey.surveycto.com/collect/medha_program_feedback_from_2?caseid=">Medha Program Feedback Form</a></p>
        <p>हम आपके अच्छे भविष्य की कामना करते है।</p>
        <p>धन्यवाद।</p><br>

        <p>Dear ${username},</p>
        <p>You have recently completed the Swarambha (Medha) journey, which had three stages: Knowledge, Skills and Competence. You are ready to apply everything you learned during this journey to your personal/professional life.</p>
        <p>Before you begin your journey beyond Medha, we would love for you to share with us your experience of your Swarambh (Medha) journey. We are sharing with you the link to a feedback form in which you will tell us what you have learned in this initial journey. - <a href="https://medhasurvey.surveycto.com/collect/medha_program_feedback_from_2?caseid=">Medha Program Feedback Form</a></p>
        <p>All the best for your future!</p>
        <p>Regards,<br>
        Medha</p>
      `,
    }:
    {
      subject: `Medha Program Feedback Form`,
      text: ``,
      html: `

        <p>Dear ${username},</p>
        <p>You have just completed your Medha Program and are ready to implement everything you have learned in the program into your personal/professional life.</p>
        <p>Before you start your journey beyond Medha, we would love to hear from you about what you have learned throughout your Medha program.</p>
        <p>Please fill in your response in the feedback form - <a href="https://medhasurvey.surveycto.com/collect/medha_program_feedback_from_2?caseid=">Medha Program Feedback Form</a></p>
        <p>All the best for your future!</p>
        <p>Regards,<br>
        Medha</p><br>

        <p>प्रिय ${username}</p>
        <p>हमें खुशी है की हाल ही में आपने मेधा कार्यक्रम पूरा किया है। अब आप इस कार्यक्रम के दौरान सीखी गयी जानकारी को अपनी निजी एवं पेशेवर ज़िंदगी में लागू करने के लिए पूरी तरह से तैयार हैं।</p>
        <p>मेधा से आगे की यात्रा शुरू करने से पहले हम यह जानना चाहेंगे कि आपने मेधा कार्यक्रम के दौरान क्या सीखा और जाना है? </p>
        <p>फीडबैक फॉर्म पर जाकर अपने विचारों को व्यक्त करे - <a href="https://medhasurvey.surveycto.com/collect/medha_program_feedback_from_2?caseid=">Medha Program Feedback Form</a></p>
        <p>शुभकामनाओं सहित आभार !</p>
        <p>भवदीय, <br>
        मेधा </p>

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
'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async handleProgramEnrollmentOnCompletion(batch) {
    const programEnrollments = await strapi.services['program-enrollments'].find({ batch: batch.id });

    await Promise.all(programEnrollments.map(async (programEnrollment) => {
      let isEligibleForCertification = await strapi.services['program-enrollments'].isProgramEnrollmentEligibleForCertification(programEnrollment);
      let status = isEligibleForCertification ? 'Batch Complete' : 'Student Dropped Out';
      await strapi.services['program-enrollments'].update({ id: programEnrollment.id }, {
        status: status
      });
    }));
    return batch;
  },

  async handleProgramEnrollmentOnCertification(batch) {
    try {
      console.log(`[Certification] Starting certification process for batch ${batch.id}`);
      
      await strapi.services['batches'].handleProgramEnrollmentOnCompletion(batch);
      console.log(`[Certification] Completed handleProgramEnrollmentOnCompletion for batch ${batch.id}`);

      let changeAttandance = batch.program.name === "Pehli Udaan";
      
      const programEnrollments = await strapi.services['program-enrollments'].find({ batch: batch.id });
      console.log(`[Certification] Found ${programEnrollments.length} enrollments to process for batch ${batch.id}`);
      
      const results = await Promise.allSettled(programEnrollments.map(async programEnrollment => {
        try {
          console.log(`[Certification] Processing enrollment ${programEnrollment.id}`);
          
          let isEligibleForCertification = await strapi.services['program-enrollments'].isProgramEnrollmentEligibleForCertification(programEnrollment, changeAttandance);
          console.log(`[Certification] Enrollment ${programEnrollment.id} eligibility: ${isEligibleForCertification}`);

          if (!isEligibleForCertification) {
            const status = changeAttandance ? 
              'Not Certified by Medha -- <100% Attendance' : 
              'Not Certified by Medha -- <75% Attendance';
              
            await strapi.services['program-enrollments'].update({ id: programEnrollment.id }, { status });
            console.log(`[Certification] Marked enrollment ${programEnrollment.id} as not certified`);
            return { success: true, id: programEnrollment.id, status: 'not-eligible' };
          }

          let today = programEnrollment.certification_date ? 
            new Date(programEnrollment.certification_date).toISOString().split('T')[0] :
            new Date().toISOString().split('T')[0];

          await strapi.services['program-enrollments'].update({ id: programEnrollment.id }, {
            certification_date: today,
            status: 'Certified by Medha'
          });

          await strapi.services['students'].update({ id: programEnrollment.student.id }, {
            status: 'Certified',
          });
          
          console.log(`[Certification] Successfully certified enrollment ${programEnrollment.id}`);
          return { success: true, id: programEnrollment.id, status: 'certified' };
        } catch (error) {
          console.error(`[Certification] Error processing enrollment ${programEnrollment.id}:`, error);
          return { success: false, id: programEnrollment.id, error: error.message };
        }
      }));

      const failedEnrollments = results.filter(r => r.status === 'rejected' || (r.value && !r.value.success));
      if (failedEnrollments.length > 0) {
        console.error(`[Certification] Failed enrollments:`, failedEnrollments);
      }

      const updatedBatch = await strapi.services['batches'].update({ id: batch.id }, {
        status: 'Certified',
      });
      console.log(`[Certification] Updated batch ${batch.id} status to Certified`);
      return updatedBatch;
    } catch (error) {
      console.error('[Certification] Error in handleProgramEnrollmentOnCertification:', error);
      throw error;
    }
  },

  // ... existing code ...
  async generateProgramEnrollmentCertificates(batch) {
    try {
      console.log(`[Generation] Starting certificate generation for batch ${batch.id}`);
      
      // Step 1: Verify batch exists and has required data
      if (!batch || !batch.id) {
        throw new Error('Invalid batch data provided');
      }
      
      // Step 2: Handle certification
      try {
        await strapi.services['batches'].handleProgramEnrollmentOnCertification(batch);
        console.log(`[Generation] Completed certification process for batch ${batch.id}`);
      } catch (certError) {
        console.error('[Generation] Error in certification process:', certError);
        throw certError;
      }

      // Step 3: Get program enrollments
      const programEnrollments = await strapi.services['program-enrollments'].find({ batch: batch.id });
      console.log(`[Generation] Found ${programEnrollments.length} enrollments to process for certificate generation`);
      
      if (!programEnrollments || programEnrollments.length === 0) {
        throw new Error(`No program enrollments found for batch ${batch.id}`);
      }

      const maxRetries = 3;
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      // Step 4: Process each enrollment
      for (const programEnrollment of programEnrollments) {
        let retryCount = 0;
        let success = false;

        while (retryCount < maxRetries && !success) {
          try {
            console.log(`[Generation] Processing enrollment ${programEnrollment.id}, attempt ${retryCount + 1}`);
            
            // Check eligibility
            const isEligibleForCertification = await strapi.services['program-enrollments'].isProgramEnrollmentEligibleForCertification(programEnrollment);
            console.log(`[Generation] Enrollment ${programEnrollment.id} eligibility: ${isEligibleForCertification}`);
            
            // Update status
            const medha_program_certificate_status = isEligibleForCertification ? 'processing' : 'low-attendance';
            await strapi.services['program-enrollments'].update({ id: programEnrollment.id }, {
              medha_program_certificate_status: medha_program_certificate_status,
            });

            // Generate certificate if eligible
            if (isEligibleForCertification) {
              console.log(`[Generation] Attempting to generate certificate for enrollment ${programEnrollment.id}`);
              try {
                await strapi.services['program-enrollments'].generateCertificate(programEnrollment);
                console.log(`[Generation] Successfully generated certificate for enrollment ${programEnrollment.id}`);
                success = true;
              } catch (certGenError) {
                console.error(`[Generation] Certificate generation error for enrollment ${programEnrollment.id}:`, certGenError);
                throw certGenError;
              }
            } else {
              console.log(`[Generation] Skipping certificate generation for ineligible enrollment ${programEnrollment.id}`);
              success = true; // Mark as success since we're intentionally skipping
            }
          } catch (error) {
            console.error(`[Generation] Error in attempt ${retryCount + 1} for enrollment ${programEnrollment.id}:`, error);
            
            if (retryCount < maxRetries - 1) {
              retryCount++;
              const waitTime = 1000 * Math.pow(2, retryCount); // Exponential backoff
              console.log(`[Generation] Waiting ${waitTime}ms before retry ${retryCount} for enrollment ${programEnrollment.id}`);
              await delay(waitTime);
            } else {
              console.error(`[Generation] All attempts failed for enrollment ${programEnrollment.id}`);
              // Update status to indicate failure
              await strapi.services['program-enrollments'].update({ id: programEnrollment.id }, {
                medha_program_certificate_status: 'failed',
              }).catch(updateError => {
                console.error(`[Generation] Failed to update status for enrollment ${programEnrollment.id}:`, updateError);
              });
            }
          }
        }
      }

      // Step 5: Update batch status
      try {
        const updatedBatch = await strapi.services['batches'].update({ id: batch.id }, {
          certificates_generated_at: new Date(),
        });
        console.log(`[Generation] Successfully updated batch ${batch.id} with generation timestamp`);
        return updatedBatch;
      } catch (updateError) {
        console.error(`[Generation] Failed to update batch ${batch.id}:`, updateError);
        throw updateError;
      }
    } catch (error) {
      console.error('[Generation] Fatal error in generateProgramEnrollmentCertificates:', error);
      throw error;
    }
  },                                                                                                                                                                                                                                    

  async sendCertificateEmailToSrm(batch) {
    // send email to batch SRM
    let email = batch.assigned_to.email;
    let username = batch.assigned_to.username;
    let batchName = batch.name;
    let batchUrl = strapi.config.get('server.frontend_url') + `/batch/${batch.id}`; // to be replaced by batch URL
    const emailTemplate = {
      subject: 'Batch has been marked as certified by Data Management Team',
      text: `Dear ${username},\n\n
      Your batch ${batchName} has been marked as certified by the Data Management Team.\n
      ${batchUrl}\n\n
      Please expect certificates to be distributed to the students in the next hour or so via email.\n\n
      Regards,\n
      Data Management Team
      `,
      html: `<p>Dear ${username},</p>
      <p>Your batch ${batchName} has been marked as certified by the Data Management Team.<br>
      <a href="${batchUrl}">See the batch details</a><br><br>
      Please expect certificates to be distributed to the students in the next hour or so via email.
      </p>
      <p>Regards,<br>
      Data Management Team</p>`,
    };
    await strapi.plugins['email'].services.email.sendTemplatedEmail({
      to: email,
    }, emailTemplate);
  },

  async emailProgramEnrollmentCertificates(batch) {
    let updatedBatch = await strapi.services['batches'].update({ id: batch.id }, {
      certificates_emailed_at: new Date(),
    });
    await strapi.services['batches'].sendCertificateEmailToSrm(batch);
    const programEnrollments = await strapi.services['program-enrollments'].find({ batch: batch.id });
    programEnrollments.forEach(async programEnrollment => {
      await strapi.services['program-enrollments'].emailCertificate(programEnrollment);
    });
    return updatedBatch;
  },
  async emailProgramEnrollmentLinks(batch) {
    const programEnrollments = await strapi.services['program-enrollments'].find({ batch: batch.id });
    programEnrollments.forEach(async programEnrollment => {
      await strapi.services['program-enrollments'].sendLink(programEnrollment);
    });
    let updatedBatch = await strapi.services['batches'].update({ id: batch.id } ,{
      link_sent_at: new Date(),
    });
    return updatedBatch;
  },
  async sendEmailOnCreationAndCompletion(batch){
    try {
      const {name,start_date,enrollment_type,institution,srmName,certifiedStudents,droppedOutStudents,enrolledStudents,end_date,status,srmEmail,managerEmail,id} = batch;
      const formationBatchEmail = {
        subject: `Formation Mail – ${name}`,
        text: `Batch ${name} has been created.`,
        html: `<p>A new batch has been successfully created by ${srmName}. Below are the details:</p>
              <ul>
                <li><strong>Batch Name:</strong> ${name}</li>
                <li><strong>Batch Start Date:</strong> ${start_date.toISOString().slice(0, 10)}</li>
                <li><strong>Number of Students Registered:</strong> ${enrolledStudents}</li>
                <li><strong>Enrollment Type:</strong> ${enrollment_type}</li>
                <li><strong>College Name:</strong> ${institution}</li>
              </ul>
              <p>Best,<br>${srmName}</p>`,
      };
      
      const closureBatchEmail = {
        subject: `Closure Mail – ${name}`,
        text: `Batch ${name} has been completed.`,
        html: `<p>A batch has been successfully marked as complete by ${srmName}. Below are the details:</p>
            <ul>
              <li><strong>Batch Name:</strong> ${name}</li>
              <li><strong>Batch End Date:</strong> ${end_date.toISOString().slice(0, 10)}</li>
              <li><strong>Number of Certified Students:</strong> ${certifiedStudents}</li>
              <li><strong>Number of Dropout Students:</strong> ${droppedOutStudents}</li>
              <li><strong>Enrollment Type:</strong> ${enrollment_type}</li>
              <li><strong>College Name:</strong> ${institution}</li>
            </ul>
            <p>Best,<br>${srmName}</p>`,
      };
      
      const emailTemplate = status === "Enrollment Complete -- To Be Started"?formationBatchEmail:closureBatchEmail;
      const email = "sis-batchinfo@medha.org.in";
      const ccEmail = [srmEmail,managerEmail];
    
      await strapi.plugins['email'].services.email.sendTemplatedEmail({
        to: email,
        cc:ccEmail
      }, emailTemplate);

      if (status === "Enrollment Complete -- To Be Started") {
        await strapi.services.batches.update(
          { id }, 
          { 
            formation_mail_sent: true, 
            last_attendance_date: new Date().toISOString().split("T")[0]
          }
        );
        
      } else {
        await strapi.services.batches.update({ id }, { closure_mail_sent: true });
      }
    } catch (error) {
      console.log("error",error)
      throw new Error(error.message);
    }
  },
  async emailPreClosedLinks(batch) {
    const programEnrollments = await strapi.services['program-enrollments'].find({ batch: batch.id });
    for (const programEnrollment of programEnrollments) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await strapi.services['program-enrollments'].preBatchlinks(programEnrollment);
        break; // Exit after sending the first link
      } catch (error) {
        console.error(`Error processing program enrollment ${programEnrollment.id}:`, error);
      }
    }
  },
  async emailPostClosedLinks(batch){
    const programEnrollments = await strapi.services['program-enrollments'].find({ batch: batch.id });
    for (const programEnrollment of programEnrollments) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await strapi.services['program-enrollments'].postBatchLinks(programEnrollment);
      } catch (error) {
        console.error(`Error processing program enrollment ${programEnrollment.id}:`, error);
      }
    }
  }
  ,
  async updateLastAttendanceDate(batch) {
    try {
      let updatedBatch = await strapi.services['batches'].update(
        { id: batch }, 
        { last_attendance_date: new Date().toISOString().split("T")[0] }
      );
  
      console.log(updatedBatch);
      return updatedBatch;
    } catch (error) {
      console.error("Error updating last attendance date:", error);
      return null;
    }
  }
,  
async updateLastStatusChanged(batch) {
  try {
   
    let updatedBatch = await strapi.services['batches'].update(
      { id: batch},
      { status_changed_date: new Date().toISOString().split("T")[0] }
    );

    console.log(updatedBatch);
    return updatedBatch;
  } catch (error) {
    console.error("Error updating last status changed date:", error);
    return null;
  }
}
}

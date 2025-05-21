const { sanitizeEntity } = require("strapi-utils");
const moment = require('moment');


module.exports = {
  async create(ctx) {
    let entity;
    logged_in_user = ctx.state.user.id;
    data = ctx.request.body;
    data.assigned_to =
      data.assigned_to == null ? logged_in_user : data.assigned_to;
    data.created_by_frontend = logged_in_user;
    data.updated_by_frontend = logged_in_user;
    entity = await strapi.services.batches.create(data);
    return sanitizeEntity(entity, { model: strapi.models.batches });
  },

  async update(ctx) {
    const { id } = ctx.params;
    let entity;
    logged_in_user = ctx.state.user.id;
    data = ctx.request.body;
    data.updated_by_frontend = logged_in_user;

    if (data.status === 'In Progress') {
      // Query the batch to check the current status
      const batch = await strapi.services['batches'].find({ id:id });  
      if (batch[0].status === 'On Hold') {
        console.log('Batch status is On Hold');
        // Update the status_changed_date field before updating the batch
        data.status_changed_date =  new Date().toISOString().split("T")[0];
      }
    }
    entity = await strapi.services.batches.update({ id }, data);
    const isEmailSent = await strapi.services.batches.findOne({id});
    const {formation_mail_sent,closure_mail_sent} = isEmailSent;
    
    if(data.status === 'Enrollment Complete -- To Be Started'){
      
      data.id = id;
      const institution = await strapi.services['institutions'].findOne({id: data.institution});
      let assignedTo = await strapi.plugins['users-permissions'].services.user.fetch({
        id: Number(data.assigned_to)
      });

      data.srmName = assignedTo.username;
      data.srmEmail = assignedTo.email;
      data.managerEmail = assignedTo.reports_to?.email;
      data.institution = institution.name;

      
      const programEnrollments = await strapi.services['program-enrollments'].find({ batch: data.id });
  
      let droppedOutStudents = 0;
      let completedStudent = 0;
  
      programEnrollments.forEach((student) => {
        if (student.status === "Batch Complete") {
          completedStudent++;
        } else if (student.status === "Student Dropped Out") {
          droppedOutStudents++;
        }
      });
  
      data.enrolledStudents = programEnrollments.length;
      data.certifiedStudents = completedStudent;
      data.droppedOutStudents = droppedOutStudents;

      
      await strapi.services['batches'].sendEmailOnCreationAndCompletion(data);
    }
    if (data.status === "Complete" && !closure_mail_sent) {
      await strapi.services["batches"].handleProgramEnrollmentOnCompletion(entity);
  
      data.id = id;
      const institution = await strapi.services['institutions'].findOne({id: data.institution});
      let assignedTo = await strapi.plugins['users-permissions'].services.user.fetch({
        id: Number(data.assigned_to)
      });

      data.srmName = assignedTo.username;
      data.srmEmail = assignedTo.email;
      data.managerEmail = assignedTo.reports_to?.email;
      data.institution = institution.name;

      
      const programEnrollments = await strapi.services['program-enrollments'].find({ batch: data.id });
  
      let droppedOutStudents = 0;
      let completedStudent = 0;
  
      programEnrollments.forEach((student) => {
        if (student.status === "Batch Complete") {
          completedStudent++;
        } else if (student.status === "Student Dropped Out") {
          droppedOutStudents++;
        }
      });
  
      data.enrolledStudents = programEnrollments.length;
      data.certifiedStudents = completedStudent;
      data.droppedOutStudents = droppedOutStudents;

      
      await strapi.services['batches'].sendEmailOnCreationAndCompletion(data);  
    } else if (data.status === "Certified") {
      await strapi.services["batches"].handleProgramEnrollmentOnCertification(entity);
  
      // AuditLog: batch certification triggered by user
      await strapi.services["audit-logs"].create({
        user: ctx.state?.user?.id,
        action: "batch_mark_as_certified",
        content: `Batch "${entity.name}" having ID ${entity.id} is marked as certified by user "${ctx.state.user.username}" having ID ${ctx.state.user.id}`,
      });
    }
  
    return sanitizeEntity(entity, { model: strapi.models.batches });
  },

  async delete(ctx) {
    const { id } = ctx.params;
    const record = await strapi.services.batches.findOne({ id });
    if (!record.assigned_to) {
      ctx.throw(401, "This record is not assigned to any user!");
    } else if (
      (ctx.state.user.role.name == "Basic" &&
        record.assigned_to.id == ctx.state.user.id) ||
      (ctx.state.user.role.name == "Advanced" &&
        record.medha_area == ctx.state.user.area) ||
      ctx.state.user.role.name == "Admin"
    ) {
      const entity = await strapi.services.batches.delete({ id });
      return sanitizeEntity(entity, { model: strapi.models.batches });
    } else {
      ctx.throw(401, "You are not allowed to delete this record!", {
        user: ctx.state.user.username,
      });
    }
  },

  async generateCertificates(ctx) {
    const { id } = ctx.params;
    const batch = await strapi.services["batches"].findOne({ id });
    let updatedBatch = await strapi.services[
      "batches"
    ].generateProgramEnrollmentCertificates(batch);

    // AuditLog: batch generate certificates triggered by user
    await strapi.services["audit-logs"].create({
      user: ctx.state.user.id,
      action: "batch_certificate_generation",
      content: `Certificates generation triggered by user "${ctx.state.user.username}" having ID ${ctx.state.user.id} for batch "${batch.name}" having ID ${batch.id}.`,
    });

    // AuditLog: total pending certificates
    const pendingProgramEnrollmentsCount = await strapi.services[
      "program-enrollments"
    ].count({ medha_program_certificate_status: "processing" });
    await strapi.services["audit-logs"].create({
      action: "batch_certificate_pending_count",
      content: `Total pending certificates for generation: ${pendingProgramEnrollmentsCount}`,
    });

    return ctx.send({ batch: updatedBatch });
  },

  async emailCertificates(ctx) {
    const { id } = ctx.params;
    const batch = await strapi.services["batches"].findOne({ id });
    await strapi.services["batches"].emailProgramEnrollmentCertificates(batch);
    // AuditLog: batch email certificates triggered by user
    await strapi.services["audit-logs"].create({
      user: ctx.state?.user?.id,
      action: "batch_certificate_email",
      content: `Certificates emails triggered by user "${ctx.state.user.username}" having ID ${ctx.state.user.id} for batch "${batch.name}" having ID ${batch.id}`,
    });
    return ctx.send({ batch: batch });
  },
  async sendLinks(ctx) {
    const { id } = ctx.params;
    const batch = await strapi.services["batches"].findOne({ id });
    await strapi.services["batches"].emailProgramEnrollmentLinks(batch);
    return ctx.send({ batch: batch });
  },
  async findDistinctField(ctx) {
    const { field, tab, info } = ctx.params; // Extract the field name from the query parameters
    let optionsArray = [];

    const queryString = info.substring();
    const infoObject = JSON.parse(
      '{"' + queryString.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
      function (key, value) {
        return key === "" ? value : decodeURIComponent(value.replace(/\+/g, ' '));
      }
    );

    try {
      const totalRecords = await strapi.query("batches").count();
      const values = await strapi.query("batches").find({
        _limit: totalRecords,
        _start: 0,
        ...((tab === "my_data" && { assigned_to: infoObject.id }) ||
          (tab === "my_state" && { state: infoObject.state }) ||
          (tab === "my_area" && { medha_area: infoObject.area })),
      });

      const uniqueValuesSet = new Set();

      for (let row = 0; row < values.length; row++) {
        let valueToAdd;

        if (values[row][field] && field == "assigned_to") {
          valueToAdd = values[row][field].username;
        } else if (field == "program") {
          valueToAdd = values[row][field].name;
        } else if (field == "institution" && values[row].institution) {
          valueToAdd = values[row][field].name;
        } else if (field === "grant") {
          valueToAdd = values[row][field].name;
        } else {
          if (values[row][field]) {
            valueToAdd = values[row][field];
          }
        }

        if (!uniqueValuesSet.has(valueToAdd)) {
          optionsArray.push({
            key: row,
            label: valueToAdd,
            value: valueToAdd,
          });
          uniqueValuesSet.add(valueToAdd);
        }
      }

      return ctx.send(optionsArray);
    } catch (error) {
      return ctx.badRequest(
        "An error occurred while fetching distinct values."
      );
    }
  },  
  
  async sendEmailOnCreationAndCompletion(data) {
    try {
      const institution = await strapi.services['institutions'].findOne({id: data.institution});
      let assignedTo = await strapi.plugins['users-permissions'].services.user.fetch({
        id: Number(data.assigned_to)
      });
  
      data.srmName = assignedTo.username;
      data.srmEmail = assignedTo.email;
      data.managerEmail = assignedTo.reports_to?.email;
      data.institution = institution.name;
  
      const programEnrollments = await strapi.services['program-enrollments'].find({ batch: data.id });
  
      let droppedOutStudents = 0;
      let completedStudent = 0;
  
      programEnrollments.forEach((student) => {
        if (student.status === "Batch Complete") {
          completedStudent++;
        } else if (student.status === "Student Dropped Out") {
          droppedOutStudents++;
        }
      });
  
      data.enrolledStudents = programEnrollments.length;
      data.certifiedStudents = completedStudent;
      data.droppedOutStudents = droppedOutStudents;
    
      await strapi.services['batches'].sendEmailOnCreationAndCompletion(data);
      return ctx.send("successfully! email sent");
    } catch (error) {
      console.log("Error in sendEmailOnCreationAndCompletion:", error);
      return ctx.badRequest(error.message);
    }
  },

  async sendPreBatchLinks(ctx) {
    try {
      const { id } = ctx.params;
      const batch = await strapi.services['batches'].findOne({ id:id });
      await strapi.services['batches'].emailPreClosedLinks(batch);
      await strapi.services['batches'].update(
        { id: id },
        { pre_batch_email_sent: true }
      );
      return ctx.send("successfully! email sent");
    } catch (error) {
      console.log("Error in sendEmailOnCreationAndCompletion:", error);
      return ctx.badRequest(error.message);
    }
  },
  async sendPostBatchLinks(ctx) {
    try {
      const { id } = ctx.params;
      const batch = await strapi.services['batches'].findOne({ id:id });
      await strapi.services['batches'].emailPostClosedLinks(batch);
      await strapi.services['batches'].update(
        { id: id },
        { post_batch_email_sent: true }
      );
      return ctx.send("successfully! email sent");
    } catch (error) {
      console.log("Error in sendEmailOnCreationAndCompletion:", error);
      return ctx.badRequest(error.message);
    }
  },
 async sendReminderEmail (ctx){
    try{
      const { id } = ctx.params;
        const batches = await strapi.services['batches'].find({ id:id});
    
        for (const batch of batches) {
            const { last_attendance_date, id, name } = batch;
    
            const assignedTo = await strapi.plugins['users-permissions'].services.user.fetch({
                id: Number(batch.assigned_to.id),
            });
    
            const srmName = assignedTo.username;
            const srmEmail = assignedTo.email;
            const managerEmail = assignedTo.reports_to?.email;
             // Generate the dynamic link
                const baseUrl ='https://sisstg.medha.org.in/';
                const attendanceLink = `${baseUrl}batch/${id}`;
             // Trigger email

             const emailBody = {
                               subject: `Reminder: Please Mark Attendance for Batch ${name}`,
                               text: `Dear ${srmName},\n\nThis is a reminder that attendance for batch "${name}" has not been updated since ${moment(last_attendance_date).format('MMMM DD, YYYY')}.\nPlease ensure it is marked within the next 2 days to maintain accurate records.\n\nYou can update the attendance by clicking on the following link:\n[Mark Attendance Now](${attendanceLink})\n\nBest,\nData Management`,
                               html: `
                               <p>Dear ${srmName},</p>
                               <p>This is a reminder that attendance for batch "<strong>${name}</strong>" has not been updated since ${moment(last_attendance_date).format('MMMM DD, YYYY')}.</p>
                               <p>Please ensure it is marked by today to maintain accurate records.</p>
                               <p>You can update the attendance by clicking on the following link : <a href="${attendanceLink}" target="_blank">Mark Attendance Now</a></p>
                               <p>Best,<br>Data Management</p>
                           `
                             }

             await strapi.plugins['email'].services.email.sendTemplatedEmail({
              to:'deepak.sharma@medha.org.in',
              // cc:[managerEmail, 'kirti.gour@medha.org.in', 'maryam.raza@medha.org.in', 'sanskaar.pradhan@medha.org.in']
             },emailBody)
    
        }
        return ctx.send("successfully! reminder sent");

      }catch(e){
        console.log('Error in cron job', e);
      }   
  }

};

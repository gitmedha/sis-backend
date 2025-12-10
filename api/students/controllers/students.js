"use strict";
const { parseMultipartData, sanitizeEntity } = require("strapi-utils");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async create(ctx) {
    let entity;
    const logged_in_user = ctx.state.user.id;
    let data = ctx.request.body;
    data.assigned_to =
      data.assigned_to == null ? logged_in_user : data.assigned_to;
    data.created_by_frontend = logged_in_user;
    data.updated_by_frontend = logged_in_user;
    // if registered by is not present, then set it to logged in user
    if (!data.registered_by) {
      data.registered_by = logged_in_user;
    }
    entity = await strapi.services.students.create(data);
    return sanitizeEntity(entity, { model: strapi.models.students });
  },

  async update(ctx) {
    const { id } = ctx.params;
    let entity;
    const logged_in_user = ctx.state.user.id;
    let data = ctx.request.body;
    data.updated_by_frontend = logged_in_user;
    entity = await strapi.services.students.update({ id }, data);
    return sanitizeEntity(entity, { model: strapi.models.students });
  },

  // create from webhook
  async createFromWebhook(ctx) {
    const data = ctx.request.body;
    const logged_in_user = ctx.state.user.id;
    var date = new Date(data.date_of_birth); // M-D-YYYY
    var dob_date = date.getDate();
    var dob_month = date.getMonth() + 1;
    var dob_year = date.getFullYear();

    const institution = await strapi.services.institutions.findOne({
      id: data.institution_id,
    });
    //add leading 0 if value of date and month is less than 10
    const dateString =
      dob_year +
      "-" +
      (dob_month <= 9 ? "0" + dob_month : dob_month) +
      "-" +
      (dob_date <= 9 ? "0" + dob_date : dob_date);

    const student = {};
    student.full_name = data.full_name;
    student.email = data.email;
    student.phone = data.phone;
    student.alternate_phone = data.alternate_phone || null;
    student.status = "New Request"; // default status is Registered
    student.date_of_birth = dateString;
    student.name_of_parent_or_guardian = data.parent_or_guardian_name;
    student.category = data.category;
    student.gender = data.gender;
    student.department = "Core Programs";
    student.assigned_to = institution?.assigned_to.id ? institution?.assigned_to.id :'2';
    student.registered_by = institution?.assigned_to.id ? institution?.assigned_to.id :'2';
    student.income_level = data.income_level;
    student.family_annual_income = data.family_annual_income;
    student.medha_champion = false;
    student.interested_in_employment_opportunities = true;
    student.address = data.address;
    student.city = data.city;
    student.pin_code = data.pin_code;
    student.state = data.state;
    student.district = data.district;
    student.medha_area = institution?.medha_area ? institution?.medha_area : data.medha_area;
    student.created_by_frontend = logged_in_user;
    student.updated_by_frontend = logged_in_user;
    student.how_did_you_hear_about_us = data.how_did_you_hear_about_us;
    student.how_did_you_hear_about_us_other =
      data.how_did_you_hear_about_us_other;
    student.your_plan_after_your_current_course = data.your_plan_after_your_current_course;
    let studentEntity = await strapi.services.students.create(student);
    let sanitizedStudentEntity = sanitizeEntity(studentEntity, {
      model: strapi.models.students,
    });
    console.log(`
            STUDENT CREATED ID: ${sanitizedStudentEntity.id}
            NAME: ${sanitizedStudentEntity.full_name}
            CREATED AT: ${sanitizedStudentEntity.created_at}
        `);

    const program = await strapi.services.programs.findOne({
      id: data.program_id,
    });
    const money_id = data.payuMoneyId;

    // create a program enrollment for the student
    const programEnrollment = {};
    programEnrollment.student = sanitizedStudentEntity;
    programEnrollment.institution = institution;
    programEnrollment.batch = program.default_enrollment_batch;
    programEnrollment.status = "Enrollment Request Received"; // default status is Enrolled
    programEnrollment.registration_date = new Date();
    programEnrollment.fee_status = money_id == 0 ? "Waived Off" : "Paid";
    programEnrollment.fee_amount = data.amount;
    programEnrollment.fee_transaction_id = data.fee_transaction_id;
    programEnrollment.course_type = data.course_type;
    programEnrollment.course_level = data.course_level;
    programEnrollment.course_year = data.course_year;
    programEnrollment.year_of_course_completion =
      data.year_of_course_completion;
    programEnrollment.course_name_in_current_sis =
      data.course_name_in_current_sis;
    programEnrollment.course_name_other = data.course_name_other;
    programEnrollment.program_selected_by_student = program.name;
    programEnrollment.discount_code_id = data.discount_code
      ? data.discount_code
      : null;
    programEnrollment.fee_payment_date = money_id == 0 ? null : new Date();
    programEnrollment.created_by_frontend = logged_in_user;
    programEnrollment.updated_by_frontend = logged_in_user;

    let programEnrollmentEntity = await strapi.services[
      "program-enrollments"
    ].create(programEnrollment);
    let sanitizedProgramEnrollmentEntity = sanitizeEntity(
      programEnrollmentEntity,
      { model: strapi.models["program-enrollments"] }
    );

    if (data.discount_code) {
      await strapi.services["discount-codes"].markDiscountCodeAsExpired(
        data.discount_code
      );
    }

    ctx.send(sanitizedStudentEntity);
    return sanitizedStudentEntity;
  },

  async createFromSystemAdoptionWebhook(ctx) {
    const data = ctx.request.body;
    const logged_in_user = ctx.state.user.id;

    // Generate custom student ID
    const customStudentId = generateCustomStudentId(data.state, data.phone, data.type, data.course_type);


    var date = new Date(data.date_of_birth); // M-D-YYYY
    var dob_date = date.getDate();
    var dob_month = date.getMonth() + 1;
    var dob_year = date.getFullYear();

    const institution = await strapi.services.institutions.findOne({
      id: data.institution_id,
    });
    //add leading 0 if value of date and month is less than 10
    const dateString =
      dob_year +
      "-" +
      (dob_month <= 9 ? "0" + dob_month : dob_month) +
      "-" +
      (dob_date <= 9 ? "0" + dob_date : dob_date);

    const student = {};
    student.full_name = data.full_name;
    student.email = data.email;
    student.phone = data.phone;
    student.alternate_phone = data.alternate_phone || null;
    student.status = "New Request"; // default status is Registered
    student.date_of_birth = dateString;
    student.name_of_parent_or_guardian = data.parent_or_guardian_name;
    student.category = data.category;
    student.gender = data.gender;
    student.student_id = customStudentId; // Store as student_id field
    student.department = "System Adoption";
    student.assigned_to = '2';
    student.registered_by = '2';
    student.income_level = data.income_level;
    student.family_annual_income = data.family_annual_income;
    student.medha_champion = false;
    student.interested_in_employment_opportunities = true;
    student.address = data.address;
    student.city = data.city;
    student.pin_code = data.pin_code;
    student.state = data.state;
    student.district = data.district;
    student.medha_area = "";
    student.created_by_frontend = logged_in_user;
    student.updated_by_frontend = logged_in_user;
    student.how_did_you_hear_about_us = data.how_did_you_hear_about_us;
    student.how_did_you_hear_about_us_other =
      data.how_did_you_hear_about_us_other;
    student.your_plan_after_your_current_course = data.your_plan_after_your_current_course;
    let studentEntity = await strapi.services.students.create(student);
    let sanitizedStudentEntity = sanitizeEntity(studentEntity, {
      model: strapi.models.students,
    });
    
    console.log(`
            STUDENT CREATED ID: ${sanitizedStudentEntity.student_id}
            NAME: ${sanitizedStudentEntity.full_name}
            CREATED AT: ${sanitizedStudentEntity.created_at}
        `);
    const program = await strapi.services.programs.findOne({
      id: data.program_id,
    });
    const money_id = data.payuMoneyId;

    // create a program enrollment for the student
    const programEnrollment = {};
    programEnrollment.student = sanitizedStudentEntity;
    programEnrollment.institution = institution;
    programEnrollment.batch = program.default_enrollment_batch;
    programEnrollment.status = "Enrollment Request Received"; // default status is Enrolled
    programEnrollment.registration_date = new Date();
    programEnrollment.fee_status = money_id == 0 ? "Waived Off" : "Paid";
    programEnrollment.fee_amount = data.amount;
    programEnrollment.fee_transaction_id = data.fee_transaction_id;
    programEnrollment.course_type = data.course_type;
    programEnrollment.course_level = data.course_level;
    programEnrollment.course_year = data.course_year;
    programEnrollment.year_of_course_completion =
      data.year_of_course_completion;
    programEnrollment.course_name_in_current_sis =
      data.course_name_in_current_sis;
    programEnrollment.course_name_other = data.course_name_other;
    programEnrollment.program_selected_by_student = program.name;
    programEnrollment.discount_code_id = data.discount_code
      ? data.discount_code
      : null;
    programEnrollment.fee_payment_date = money_id == 0 ? null : new Date();
    programEnrollment.created_by_frontend = logged_in_user;
    programEnrollment.updated_by_frontend = logged_in_user;

    let programEnrollmentEntity = await strapi.services[
      "program-enrollments"
    ].create(programEnrollment);
    let sanitizedProgramEnrollmentEntity = sanitizeEntity(
      programEnrollmentEntity,
      { model: strapi.models["program-enrollments"] }
    );

    if (data.discount_code) {
      await strapi.services["discount-codes"].markDiscountCodeAsExpired(
        data.discount_code
      );
    }

    // Function to generate custom student ID
function generateCustomStudentId(state, phone, type, course_type) {
  // State code mapping
  const stateCodeMap = {
      'UP': '1',
      'Uttar Pradesh': '1',
      'Haryana': '2',
      'Bihar': '3',
      'UK': '4',
      'Uttarakhand': '4',
      'Delhi': '5'
  };
  
  const couseCodeMap = {
    'ITI': '1',
    'Polytechnic': '2',
    'UG': '3',
  };
  
  // Get state code (default to 6 for other states)
  const stateCode = stateCodeMap[state] || '6';

  const courseCode = couseCodeMap[course_type] || '4';
  
  // Clean phone number (remove spaces, dashes, etc.)
  const cleanPhone = phone.replace(/\D/g, '');

  
  // Determine prefix by type (default: Student → SAS)
  const normalizedType = (type || '').toString().trim().toLowerCase();
  const prefix = normalizedType === 'faculty' ? 'SAF' : 'SAS';

  
  // Create custom ID: SAS + StateCode + PhoneNumber
  const customId = `${prefix}${stateCode}${courseCode}${cleanPhone}`;
 
  return customId;
}

    // Ensure department and custom_id are included in the response
    const responseEntity = {
      ...sanitizedStudentEntity,
      department: student.department,
    };
    
    ctx.send(responseEntity);
    return responseEntity;
  },



  async delete(ctx) {
    const { id } = ctx.params;
    const record = await strapi.services.students.findOne({ id });
    if (!record.assigned_to) {
      ctx.throw(401, "This record is not assigned to any user!");
    } else if (
      (ctx.state.user.role.name == "Basic" &&
        record.assigned_to.id == ctx.state.user.id) ||
      (ctx.state.user.role.name == "Advanced" &&
        record.medha_area == ctx.state.user.area) ||
      ctx.state.user.role.name == "Admin"
    ) {
      const entity = await strapi.services.students.delete({ id });
      return sanitizeEntity(entity, { model: strapi.models.students });
    } else {
      ctx.throw(401, "You are not allowed to delete this record!", {
        user: ctx.state.user.username,
      });
    }
  },
  async findDistinctField(ctx) {
    const { field, tab, info } = ctx.params;
    let optionsArray = [];

    const queryString = info.substring();
    const infoObject = JSON.parse(
      '{"' + queryString.replace(/&/g, '","').replace(/=/g, '":"') + '"}',
      function (key, value) {
        return key === "" ? value : decodeURIComponent(value.replace(/\+/g, ' '));
      }
    );

    try {
      const values = await strapi.query("students").find({
        _limit: 100,
        _start: 0,
        ...((tab === "my_data" && { assigned_to: infoObject.id }) ||
          (tab === "my_state" && { state: infoObject.state }) ||
          (tab === "my_area" && { medha_area: infoObject.area })),
      });

      const uniqueValuesSet = new Set();

      for (let row = 0; row < values.length; row++) {
        let valueToAdd;

        if (values[row][field] && field === "assigned_to") {
          valueToAdd = values[row][field].username;
        } else {
          valueToAdd = values[row][field];
        }

        if (values[row][field]) {
          if (!uniqueValuesSet.has(valueToAdd)) {
            optionsArray.push({
              label: valueToAdd,
              value: valueToAdd,
            });
            uniqueValuesSet.add(valueToAdd);
          }
        }
      }

      return ctx.send(optionsArray);
    } catch (error) {
      return ctx.badRequest(
        "An error occurred while fetching distinct values."
      );
    }
  },
  async sendEmail(ctx) {
    const data = ctx.request.body;
    await strapi.services["students"].sendConfirmationEmail(data);
    return true;
  },
};

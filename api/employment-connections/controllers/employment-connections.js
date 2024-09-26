const { sanitizeEntity } = require('strapi-utils');

module.exports = {

  async create(ctx) {
    let entity;    
    logged_in_user = ctx.state.user.id;
    data = ctx.request.body;
    data.created_by_frontend = logged_in_user;
    data.updated_by_frontend = logged_in_user;
    entity = await strapi.services['employment-connections'].create(data);
    return sanitizeEntity(entity, { model: strapi.models['employment-connections']});
  },

  async update(ctx) {
    const { id } = ctx.params;
    let entity;
    logged_in_user = ctx.state.user.id;
    data = ctx.request.body;
    data.updated_by_frontend = logged_in_user;
    entity = await strapi.services['employment-connections'].update({ id }, data);
    return sanitizeEntity(entity, { model: strapi.models['employment-connections'] });
  },

  async delete(ctx) {
    const { id } = ctx.params;
    const record = await strapi.services['employment-connections'].findOne({ id });
    if (!record.student.assigned_to) {
        ctx.throw(401, 'This student is not assigned to any user!');
    } else if ( 
        (ctx.state.user.role.name == "Basic" && record.student.assigned_to.id == ctx.state.user.id) ||
        (ctx.state.user.role.name == "Advanced" && record.student.medha_area == ctx.state.user.area) ||
        ctx.state.user.role.name == "Admin"
    ) {
        const entity = await strapi.services['employment-connections'].delete({ id });
        return sanitizeEntity(entity, { model: strapi.models['employment-connections'] });
    } else {
        ctx.throw(401, 'You are not allowed to delete this record!', { user: ctx.state.user.username});
    }
  },
  async createBulkEmploymentConnection(ctx) {
    const { body } = ctx.request;
    try {
      const studentUpdates = await Promise.all(
        body.map(async (students) => {

          const student = await strapi.services['students'].findOne({ id: students.student });
          if (student) {
            console.log(`Found student ${students.student}:`, student);
  
            
            const updateResult = await strapi.services['students'].update(
              { id: students.student },
              { last_update_at: new Date() }  
            );
  
            if (updateResult) {
              console.log(`Student ${students.student} updated successfully.`, updateResult);
            } else {
              console.warn(`Student ${students.student} update failed.`);
            }
            return updateResult;
          } else {
            console.warn(`Student with ID ${students.student} not found.`);
            return null;  
          }
        })
      );
      const createdData = await strapi.services['employment-connections'].createMany(body);
      return createdData;
  
    } catch (error) {
      console.error('Error creating bulk employment connection:', error);
      throw error;
    }
  },
  async bulkUpdate(ctx) {
    try {
      const data = ctx.request.body;
  
      const studentUpdates = await Promise.all(
        data.map(async (students) => {

          const student = await strapi.services['students'].findOne({ id: students.student });
          if (student) {
            console.log(`Found student ${students.student}:`, student);
  
            
            const updateResult = await strapi.services['students'].update(
              { id: students.student },
              { last_update_at: new Date() }  
            );
  
            if (updateResult) {
              console.log(`Student ${students.student} updated successfully.`, updateResult);
            } else {
              console.warn(`Student ${students.student} update failed.`);
            }
            return updateResult;
          } else {
            console.warn(`Student with ID ${students.student} not found.`);
            return null;  
          }
        })
      );
  
      const employmentUpdates = await Promise.all(
        data.map(async (item) => {
          const updatedRecord = await strapi.query('employment-connections').update(
            { id: item.id }, item
          );
          return updatedRecord;
        })
      );
  
      console.log("Employment connections updated successfully:", employmentUpdates);
  
      // Return the updated employment connections data
      return employmentUpdates;
    } catch (err) {
      console.error("Error during bulk update:", err);
      throw err;
    }
  }
  
};



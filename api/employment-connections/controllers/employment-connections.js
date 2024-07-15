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
    console.log(body);
    try {
      const createdData = await strapi.services['employment-connections'].createMany(body);
      return createdData;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
  async bulkUpdate(ctx) {
    try {
      const data = ctx.request.body;
      const updatedData = await Promise.all(
        data.map(async (item) => {
          const updatedRecord = await strapi
            .query("employment-connections")
            .update({ id: item.id }, item);
          return updatedRecord;
        })
      );

      return updatedData;
    } catch (err) {
      console.error(err);
      throw err;
    }
  },
};



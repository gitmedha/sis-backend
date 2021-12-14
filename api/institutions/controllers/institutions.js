const { sanitizeEntity } = require('strapi-utils');

module.exports = {

  async create(ctx) {
    let entity;    
    logged_in_user = ctx.state.user.id;
    data = ctx.request.body;
    data.assigned_to = data.assigned_to == null ? logged_in_user : data.assigned_to;
    data.created_by_frontend = logged_in_user;
    data.updated_by_frontend = logged_in_user;
    entity = await strapi.services.institutions.create(data);
    return sanitizeEntity(entity, { model: strapi.models.institutions});
  },

  async update(ctx) {
    const { id } = ctx.params;
    let entity;
    logged_in_user = ctx.state.user.id;
    data = ctx.request.body;
    data.updated_by_frontend = logged_in_user;
    entity = await strapi.services.institutions.update({ id }, data);
    return sanitizeEntity(entity, { model: strapi.models.institutions });
  },

  async delete(ctx) {
    const { id } = ctx.params;
    const record = await strapi.services.institutions.findOne({ id });
    if (!record.assigned_to) {
        ctx.throw(401, 'This record is not assigned to any user!');
    } else if ( 
        (ctx.state.user.role.name == "Basic" && record.assigned_to.id == ctx.state.user.id) ||
        (ctx.state.user.role.name == "Advanced" && record.medha_area == ctx.state.user.area) ||
        ctx.state.user.role.name == "Admin"
    ) {
        const entity = await strapi.services.institutions.delete({ id });
        return sanitizeEntity(entity, { model: strapi.models.institutions });
    } else {
        ctx.throw(401, 'You are not allowed to delete this record!', { user: ctx.state.user.username});
    }
  },
};

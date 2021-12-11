const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

module.exports = {
  /**
   * Create a record.
   *
   * @return {Object}
   */

  async create(ctx) {
    let entity;    
    logged_in_user = ctx.state.user.id;
    data = ctx.request.body;      
    data.created_by_frontend = logged_in_user;
    data.updated_by_frontend = logged_in_user;
    entity = await strapi.services.surveys.create(data);
    return sanitizeEntity(entity, { model: strapi.models.surveys});
  },

  async update(ctx) {
    const { id } = ctx.params;
    let entity;
    logged_in_user = ctx.state.user.id;
    data = ctx.request.body;
    data.updated_by_frontend = logged_in_user;
    entity = await strapi.services.surveys.update({ id }, data);
    return sanitizeEntity(entity, { model: strapi.models.surveys });
  },
};

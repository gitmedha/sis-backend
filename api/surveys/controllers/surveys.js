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

  async delete(ctx) {
    const { id } = ctx.params;

    const record = await strapi.services.surveys.findOne({ id });

    if ( record.created_by_frontend.id == ctx.state.user.id ) {
        const entity = await strapi.services.surveys.delete({ id });
        return sanitizeEntity(entity, { model: strapi.models.surveys });
    } else {
        // console.log("You are not allowed to delete this record: ", record);
        // ctx.unauthorized(`You are not allowed to delete this record:`);
        ctx.throw(401, 'You are not allowed to delete this record!', { user: ctx.state.user.username});
    }
  },

  // CREATE FROM WEBHOOK
  /*
  async createFromWebhook (ctx) {
    console.log('ctx.request.body: ',  ctx.request.body)
    const employer = {}
    employer.name = ctx.request.body.name
    let entity = await strapi.services.employers.create(employer)
    let sanitizedEntity = sanitizeEntity(entity, { model: strapi.models.employers })
    console.log(`
        Employer Created! ID: ${sanitizedEntity.id}
        NAME: ${sanitizedEntity.name}
        CREATED AT: ${sanitizedEntity.created_at}
        `)
    const data = ctx.request.body        
    Object.keys(data).forEach(async key => {
        const surveyResponse = {}
        surveyResponse.survey_response_id = sanitizedEntity.id
        surveyResponse.question = key
        surveyResponse.response = data[key]
        let unpivotedSurveyResponse = await strapi.services.surveys.create(surveyResponse)
        console.log("unpivotedSurveyResponse: ", unpivotedSurveyResponse)
    })
    ctx.send(sanitizedEntity)
    return sanitizedEntity
  },
  */
};

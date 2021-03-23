'use strict';
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    // CREATE FROM WEBHOOK
    async createFromWebhook (ctx) {
        
        console.log('ctx.request.body: ',  ctx.request.body)

        

        let entity = await strapi.services.employers.create(ctx.request.body)

        let sanitizedEntity = sanitizeEntity(entity, { model: strapi.models.employers })

        console.log("Employer Created: ", sanitizedEntity)

        ctx.send(sanitizedEntity)

        return sanitizedEntity
    }
};

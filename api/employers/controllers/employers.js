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
            // console.log(key, ": " ,data[key])

            const surveyResponse = {}
            surveyResponse.survey_response_id = sanitizedEntity.id
            surveyResponse.question = key
            surveyResponse.response = data[key]

            // console.log("surveyResponse: ", surveyResponse)

            let unpivotedSurveyResponse = await strapi.services.surveys.create(surveyResponse)
            console.log("unpivotedSurveyResponse: ", unpivotedSurveyResponse)
            // return unpivotedSurveyResponse

        })

        
        ctx.send(sanitizedEntity)
        return sanitizedEntity
    }
};

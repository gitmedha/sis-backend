'use strict';


module.exports = {
    async createEvent(ctx){
        const {body} = ctx.request;

        try {
        
            await strapi.services['alumni-events'].create({
                name:body.alumni_service,
                start_date: body.start_date,
                end_date:body.end_date,
                assgined_to:body.assgined_to,
                status:body.status,
                last_emailed_date:body.start_date,
                reporting_date:body.reporting_date,
                location:body.location,
                participants:body.participants
            });

            await strapi.services['alumni-events'].sendEventReportingMail(body.name,body.reporting_date)
            return ctx.send({
        message: 'The mail has sent successfully!',
      });

        } catch (error) {
            console.error(error);
            throw error;
        }

    }
    ,
    async getEvents(ctx){
        try {
            const events = await strapi.services['alumni-events'].find();
            ctx.send(events);
        }
        catch(error){
            console.error(error);
            ctx.throw(500, 'An error occurred while fetching the events.');
        }
    },
    async updateEvent(ctx) {
        const { params, request } = ctx;
        const { id } = params;
        const { body } = request;

        try {
            const updatedEvent = await strapi.services['alumni-events'].update({ id }, body);
            ctx.send(updatedEvent);
        } catch (error) {
            console.error(error);
            ctx.throw(500, 'An error occurred while updating the event.');
        }
    }
};

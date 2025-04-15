'use strict';


module.exports = {
    async createEvent(ctx){
        const {body} = ctx.request;

        const newEvent ={}
        newEvent.name = body.alumni_service;
        newEvent.start_date = body.start_date;
        newEvent.end_date = body.end_date;
        newEvent.assgined_to = body.assgined_to;
        newEvent.status = body.status;
        newEvent.last_emailed_date = body.start_date;
        newEvent.reporting_date = body.reporting_date;

        if(body.location){
            newEvent.location = body.location;
        }
        if(body.participants){
            newEvent.participants = body.participants;
        }
        try {
        
            await strapi.services['alumni-events'].create(newEvent);

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
    async getEvents(ctx) {
        try {
            const events = await strapi.query('alumni-events').find({
                _limit: -1,
            });
            console.log("events", events);
            ctx.send(events);
        }
        catch (error) {
            console.error(error);
            ctx.throw(500, 'An error occurred while fetching the events.');
        }
    }
    ,
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

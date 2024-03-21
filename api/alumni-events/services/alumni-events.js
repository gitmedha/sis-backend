'use strict';

module.exports = {
    async sendEventReportingMail(ReportingData){
        let email = ReportingData.email;
        let reportingDate = ReportingData.date;
        let name = ReportingData.name

        const emailTemplate = {
            subject:'Alumni Service Reporting',
            text:`Hi, \n\n
            An event has been Reported by ${name} on ${reportingDate}. Please check SIS for more details
            `
        };

        await strapi.plugins['email'].services.email.sendTemplatedEmail({
            to:email,
        },emailTemplate)

    },

    async sendEventReminderMail(ReportingData){
        let email = ReportingData.email;
        let reportingDate = ReportingData.date;
        let name = ReportingData.name

        const emailTemplate = {
            subject:`Alumni Service Data Check`,
            text:`Hi, \n\n
            An event ${name} was held on ${reportingDate}. Please check SIS for more details
            `
        };

        await strapi.plugins['email'].services.email.sendTemplatedEmail({
            to:email,
        },emailTemplate)
    }
};

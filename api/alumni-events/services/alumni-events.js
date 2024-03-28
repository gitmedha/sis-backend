'use strict';

module.exports = {
    async sendEventReportingMail(name,reportingDate){

        try {
            const date = new Date(reportingDate);

            // Get the year, month, and day
            const newDate = date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
            });

            // Get the hours, minutes, and AM/PM indicator
            let hours = date.getHours();
            const minutes = date.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';

            // Convert hours to 12-hour format
            hours = hours % 12;
            hours = hours ? hours : 12; // Handle midnight (0 hours)

            // Format the time string
            const timeString = `${hours}:${minutes < 10 ? '0' : ''}${minutes} ${ampm}`;

            // Construct the final formatted date string
            const formattedDate = `${newDate} at ${timeString}`;

            const emailTemplate = {
                subject: 'Alumni Service Reporting',
                text: `Hi,\n\nAn event has been Reported by ${name} on ${formattedDate}. Please check SIS for more details.`,
                html:''
            };

        
            const emailOptions = {
                to:'deepak.sharma@medha.org.in',
                headers: {
                    'X-Priority': '1 (Highest)',
                    'Priority': 'urgent',
                    'Importance': 'high'
                }
            };
    
            await strapi.plugins['email'].services.email.sendTemplatedEmail(emailOptions,emailTemplate)
        } catch (error) {
            console.log(error);
        }
    },

    async sendEventReminderMail(name,reportingDate){
        try {
            
        } catch (error) {
            
        }
      
        const emailTemplate = {
            subject:`Alumni Service Data Check`,
            text:`Hi, \n\n
            An event ${name} was held on ${reportingDate}. Please check SIS for more details
            `
        };

        await strapi.plugins['email'].services.email.sendTemplatedEmail({
            to:'deepak.sharma@medha.org.in',
        },emailTemplate)
    }
};

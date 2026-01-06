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
                text: `Hi,<br><br>An event has been Reported by ${name} on ${formattedDate}. Please check SIS for more details.<br><br><br><br>`,
                html:''
            };

        
            const recipents = ['sanskaar.pradhan@medha.org.in','kirti.gour@medha.org.in',"mohil.joshi@medha.org.in",'rohit.sharma@medha.org.in','deepak.sharma@medha.org.in']
    
            await strapi.plugins['email'].services.email.sendTemplatedEmail({
                to:recipents
            },emailTemplate)
        } catch (error) {
            console.log(error);
        }
    }
};

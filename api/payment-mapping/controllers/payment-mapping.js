'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async find(){
        try {
            let data = await strapi.query('payment-mapping').find()
            return data       
        } catch (error) {
            return error.message
        }
       
    }
};

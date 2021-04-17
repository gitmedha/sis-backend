const { sanitizeEntity } = require("strapi-utils")
const axios = require('axios')

module.exports = {
    /**
     * Triggered after user creation.
     */
    lifecycles: {
      async afterCreate(result, params, data) {
        //console.log("DATA: ", data)
        // console.log("PARAMS: ", params)

        const sanitized_result = sanitizeEntity(result, {model: strapi.plugins['users-permissions'].models.user})
        console.log("SANITIZED RESULT: ", sanitized_result)
        axios.post('https://webhook.site/e87d84cb-e202-426d-87e2-2bb2de06a136', sanitized_result)
        .then((response) => console.log('RESPONSE:', response.config.data))       
      },
    },
  };
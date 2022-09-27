'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */

module.exports = {
  async markDiscountCodeAsExpired(couponCode) {
    return await strapi.services['discount-codes'].update({
      coupon_code: couponCode
    }, {
      expired: true
    });
  },
};

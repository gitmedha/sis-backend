'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async getLatestActivities(ctx) {
        try {
          const page = parseInt(ctx.params.page, 10) || 0;  // 0-based page index
          const limit = parseInt(ctx.params.limit, 10) || 10; // Default limit if not provided
    
          // Validate page and limit
          if (isNaN(page) || page < 0) {
            return ctx.badRequest('Page number must be a non-negative integer');
          }
          if (isNaN(limit) || limit <= 0) {
            return ctx.badRequest('Limit must be a positive integer');
          }
    
          // Calculate offset based on page and limit
          const start = page * limit;

          const totalCount = await strapi.query('latest-activity').count();

    
          // Query latest activities with pagination
          const activities = await strapi.query('latest-activity').find({
            _start: start,
            _limit: limit,
            _sort: 'updated_at:DESC', // Sort by `updated_at` in descending order
          });
    
          // Respond with the fetched activities, page, and limit for client-side handling
          ctx.send({
            page: page,
            limit: limit,
            data: activities,
            totalCount:totalCount
          });
        } catch (error) {
          console.error('Error fetching latest activities:', error);
          ctx.internalServerError('Failed to fetch latest activities');
        }
      },
};

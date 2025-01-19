'use strict';

module.exports = {
  // Action to get industries grouped by category with sub-industries
  async findAll(ctx) {
    try{
        const knex = strapi.connections.default;
        const industries = await knex("industries").select("*");

        const industryTree = industries.reduce((acc, industry) => {
          const { category, industry_name, sub_industry } = industry;
    
          // Check if the category exists in the accumulator
          let categoryGroup = acc.find(group => group.label === category);
    
          if (!categoryGroup) {
            categoryGroup = {
              label: category,
              children: [],
              industrySet: new Set(), // Track unique industries
            };
            acc.push(categoryGroup);
          }
    
          // Check if the industry exists within the category group
          let industryGroup = categoryGroup.children.find(group => group.label === industry_name);
    
          if (!industryGroup && !categoryGroup.industrySet.has(industry_name)) {
            industryGroup = {
              label: industry_name,
              value: industry_name,
              children: [],
              subIndustrySet: new Set(), // Track unique sub-industries
            };
            categoryGroup.children.push(industryGroup);
            categoryGroup.industrySet.add(industry_name); // Mark industry as added
          }
    
          // Add sub-industry if it exists and is unique
          if (sub_industry && industryGroup && !industryGroup.subIndustrySet.has(sub_industry)) {
            industryGroup.children.push({
              label: sub_industry,
              value: sub_industry,
              children: [],
            });
            industryGroup.subIndustrySet.add(sub_industry); // Mark sub-industry as added
          }
    
          return acc;
        }, []);
    
        // Clean up temporary sets before sending the response
        const cleanedTree = industryTree.map(category => {
          category.children = category.children.map(industry => {
            delete industry.subIndustrySet; // Remove sub-industry set
            return industry;
          });
          delete category.industrySet; // Remove industry set
          return category;
        });
    
        
        return ctx.send(cleanedTree);
      } catch (error) {
        return ctx.badRequest(
          "An error occurred while fetching distinct values."
        );
    }
},


};

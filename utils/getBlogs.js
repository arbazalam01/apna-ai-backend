const Company = require("../models/Company");

const getBlogs = async (blogsData) => {
  const blogData = blogsData;
  const blogTypes = [];
  if (!blogsData) return blogTypes;
  let total = blogsData.titles.length;
  blogData.titles.forEach((item) => {
    if (!blogTypes.includes(item.blogtype)) {
      blogTypes.push(item.blogtype);
    }
  });

  const finalBlogData = blogTypes.map((item) => {
    let count = 0;
    blogData.titles.forEach((item1) => {
      if (item1.blogtype === item) {
        count += 1;
      }
    });
    const percentage = (count / total) * 100;
    return { title:item, percentage };
  });

  return finalBlogData;
};

module.exports = getBlogs;

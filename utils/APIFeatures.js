const Tour = require('../models/tourModel');

class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    const queryObj = { ...this.queryString };
    const exculdedFields = ['sort', 'page', 'limit', 'fields'];
    exculdedFields.forEach((el) => delete queryObj[el]);

    // 2) ADVANCED FILTERING
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      //  if we have more than a field we want to sort by them
      const sortByMulitple = this.queryString.sort.split(',').join(' ');
      console.log(this.queryString.sort);
      // eslint-disable-next-line no-unneeded-ternary
      const sortBy = sortByMulitple ? sortByMulitple : this.queryString.sort;
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-price');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // minus (field) means excluding that field
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    // lets imagine this senario : we have 100 documents , and we want to divide them into 10 sections
    // each section is gonna have 10 documents , let's say we want section 5 . page = 5 , limit = 10 so we are
    // gonna skip 40 documents to get 41-50 documents that we want .
    const page = Number(this.queryString.page) || 1;
    const limitVar = Number(this.queryString.limit) || 100;
    const skipVar = (page - 1) * limitVar;

    this.query = this.query.skip(skipVar).limit(limitVar);

    return this;
  }
}

module.exports = APIFeatures;

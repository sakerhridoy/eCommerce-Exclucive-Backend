export class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    return await this.model.create(data);
  }

  async findById(id, options = {}) {
    let query = this.model.findById(id);
    if (options.populate) {
      query = query.populate(options.populate);
    }
    if (options.select) {
      query = query.select(options.select);
    }
    return await query;
  }

  async findOne(query, options = {}) {
    let q = this.model.findOne(query);
    if (options.populate) {
      q = q.populate(options.populate);
    }
    if (options.select) {
      q = q.select(options.select);
    }
    return await q;
  }

  async find(query = {}, options = {}) {
    let q = this.model.find(query);
    if (options.populate) {
      q = q.populate(options.populate);
    }
    if (options.select) {
      q = q.select(options.select);
    }
    if (options.sort) {
      q = q.sort(options.sort);
    }
    if (options.skip) {
      q = q.skip(options.skip);
    }
    if (options.limit) {
      q = q.limit(options.limit);
    }
    return await q;
  }

  async findByIdAndUpdate(id, data, options = { new: true }) {
    return await this.model.findByIdAndUpdate(id, data, options);
  }

  async findOneAndUpdate(query, data, options = { new: true }) {
    return await this.model.findOneAndUpdate(query, data, options);
  }

  async findByIdAndDelete(id) {
    return await this.model.findByIdAndDelete(id);
  }

  async countDocuments(query = {}) {
    return await this.model.countDocuments(query);
  }

  async aggregate(pipeline) {
    return await this.model.aggregate(pipeline);
  }
}

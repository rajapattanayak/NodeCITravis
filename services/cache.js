const mongoose = require("mongoose");
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys')

const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget);

// ref to original exec function
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = {}) {
  // here this represents the Query instance
  this.useCache = true;

  //define top level key
  this.hashKey = JSON.stringify(options.key) || '';

  return this; //to make it chainable
}

// Override exec function
mongoose.Query.prototype.exec = async function() {
  
  if (!this.useCache) {  
    return exec.apply(this, arguments); 
  }
  
  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name
    })
  );

  // Any cached value present
  const cachedValue = await client.hget(this.hashKey, key);
  
  // exists
  if (cachedValue) {
    // anything from redis is JSON
    // we need to handel single and array of records
    const doc = JSON.parse(cachedValue);
    
    return Array.isArray(doc)
      ? doc.map(d => new this.model(d))
      : new this.model(doc);
  }
  
  //otherwise, issue the query
  const result = await exec.apply(this, arguments); 
  
  // store in cache
  // here result is mongoose document so convert to JSON as redis needs it
  client.hset(this.hashKey, key, JSON.stringify(result), 'EX', 10); // set expiration of cache

  return result;
};

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey))
  }
};
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const onDeath = require('death');
const config = require('config');
const dbConfig = config.get('database');
const ttl = config.get('ttl');

// onDeath((signal,  err) => {
//   // clien.close
// });

class CacheDb {
  constructor() {
      MongoClient.connect(dbConfig.url)
        .then(client => {
          this.db = client.db(dbConfig.name);
          this.collection = this.db.collection('cache');
        })
        .catch(err => {console.log('Cannot connect to database.')});
      // this.db = client.db(dbConfig.name);
  }

  writeCache (data) {
    let date = new Date(Date.now());
    date = date.toUTCString();
    // Insert/Update some documents
    this.collection.updateOne({url: data.url}, {$set: {...data, ttl, date}},  {upsert: true})
      .catch(err => {throw err});
  }

  async readCache(url) {
    try {
      const cache = await this.collection.findOne({url});

      // Check TTL
      const cacheDate = new Date(cache.date);
      const isExpired = Date.now() - cacheDate.getTime() > cache.ttl;
      return isExpired ? null : cache;
    } catch (err) {
      throw err;
    }
  }
}

const db = new CacheDb();

module.exports = db;

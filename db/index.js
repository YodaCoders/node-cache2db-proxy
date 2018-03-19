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
        .catch(err => {console.log('Cannot connect to database: ' + err.message)});
      // this.db = client.db(dbConfig.name);
  }

  writeCache (data) {
    let date = new Date(Date.now());
    date = date.toUTCString();
    // Insert/Update some documents
    this.collection.updateOne({method:data.method, url: data.url}, {$set: {...data, ttl, date}},  {upsert: true})
      .catch(err => {throw err});
  }

  async readCache(method, url) {
    try {
      const cache = await this.collection.findOne({method, url});
      return cache;
    } catch (err) {
      throw err;
    }
  }
}

const db = new CacheDb();

module.exports = db;

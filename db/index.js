const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const onDeath = require('death');
const dbConfig = require('config').get('database');

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

  async cache (data) {
    // Insert/Update some documents
    this.collection.updateOne({url: data.url}, {$set: {...data}},  {upsert: true})
      .then(res => console.log(res))
      .catch(err => {throw err});
  }
}

const db = new CacheDb();

module.exports = db;

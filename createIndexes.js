db.gps_log.ensureIndex({ entry_date: 1, entry_source: 1, accuracy: 1 }, { unique: true, dropDups: true });
db.gps_log.ensureIndex( { loc : "2dsphere" } )
db.gps_log.ensureIndex({ entry_source: 1 })

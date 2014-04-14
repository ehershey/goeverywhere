db.gps_log.ensureIndex({ entry_date: 1, entry_source: 1, accuracy: 1 }, { unique: true });
db.gps_log.ensureIndex( { loc : "2dsphere" } )

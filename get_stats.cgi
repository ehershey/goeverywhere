#!/usr/bin/python
import os
os.environ['PYTHON_EGG_CACHE'] = "/tmp/goe_egg_cache"
from bson import json_util
import cgitb ; cgitb.enable()
import cgi
import datetime
import hashlib
import json
import time
from goelog import debug



import pymongo

debug("starting")

client = pymongo.MongoClient()
db = client.ernie_org
gps_log = db.gps_log


query = {'entry_date': { '$exists': True }}
limit = 1
# debug("query: %s" % json.dumps(query, default = json_util.default))
debug("query")
debug("limit")

oldest_point_timestamp = 0;
oldest_point = gps_log.find(query).sort('entry_date', pymongo.ASCENDING).limit(limit).next()
oldest_point_timestamp = time.mktime(oldest_point['entry_date'].timetuple())

debug("oldest_point_timestamp")

newest_point = gps_log.find(query).sort('entry_date', pymongo.DESCENDING).limit(limit).next()
newest_point_timestamp = time.mktime(newest_point['entry_date'].timetuple())
debug("newest_point_timestamp")

point_count = gps_log.count()

debug("point_count")

entry_source_cursor = gps_log.aggregate([{ "$group": { "_id": "$entry_source" } }])

entry_sources = []

for entry_source in entry_source_cursor:
    entry_sources.append(entry_source['_id'])

debug("entry_sources")

response =  {
    'oldest_point_timestamp': oldest_point_timestamp,
    'newest_point_timestamp': newest_point_timestamp,
    'point_count': point_count,
    'entry_sources': entry_sources
}



debug("response")

print "Content-Type: text/plain"
print ""


print json.dumps(response, default = json_util.default)
debug("dumped output")
debug("ending")

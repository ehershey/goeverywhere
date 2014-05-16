#!/usr/bin/python
from bson import json_util
import cgitb ; cgitb.enable()
import cgi
import datetime
import hashlib
import logging
import json
import time

import pymongo

logging.basicConfig(level=logging.DEBUG,
  format='%(relativeCreated)d %(asctime)s %(name)-12s %(levelname)-8s %(message)s', 
  #datefmt='%m-%d %H:%M',
  filename='/tmp/get_stats.log',
  filemode='a+')

logging.debug("starting")

client = pymongo.MongoClient()
db = client.ernie_org
gps_log = db.gps_log


query = {}
limit = 1
logging.debug("query: %s" % json.dumps(query, default = json_util.default))
logging.debug("limit: %s" % limit)

oldest_point_timestamp = 0;
oldest_point = gps_log.find(query).sort('entry_date', pymongo.ASCENDING).limit(limit).next()
oldest_point_timestamp = time.mktime(oldest_point['entry_date'].timetuple())

newest_point = gps_log.find(query).sort('entry_date', pymongo.DESCENDING).limit(limit).next()
newest_point_timestamp = time.mktime(newest_point['entry_date'].timetuple())

point_count = gps_log.count()

response =  {
    'oldest_point_timestamp': oldest_point_timestamp,
    'newest_point_timestamp': newest_point_timestamp,
    'point_count': point_count
}



logging.debug("executed")

print "Content-Type: text/plain"
print ""


print json.dumps(response, default = json_util.default)
logging.debug("dumped output")
# logging.debug("closed connection")
logging.debug("ending")

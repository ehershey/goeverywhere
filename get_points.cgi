#!/usr/bin/python
from bson import json_util
import cgitb ; cgitb.enable()
import cgi
import hashlib
import logging
import json

from pymongo import MongoClient

# how long to cache positive responses (places I've been)
#
CACHE_POSITIVE_AGE = 60 * 60 * 24 * 90

# how long to cache negative responses (places I haven't been)
#
CACHE_NEGATIVE_AGE = 60 * 60 


logging.basicConfig(level=logging.DEBUG,
  format='%(relativeCreated)d %(asctime)s %(name)-12s %(levelname)-8s %(message)s', 
  #datefmt='%m-%d %H:%M',
  filename='/tmp/get_points.log',
  filemode='a+')

logging.debug("starting")


cache_max_age = 0


client = MongoClient()
db = client.ernie_org
gps_log = db.gps_log


form = cgi.FieldStorage()
min_lon = form.getfirst('min_lon','')
min_lat = form.getfirst('min_lat','')
max_lon = form.getfirst('max_lon','')
max_lat = form.getfirst('max_lat','')

# bounds of map displayed when tile info was requested
#
bound_string = form.getfirst('bound_string','')

logging.debug("read form data")

# sql = "SELECT * FROM gps_log WHERE longitude > %s AND longitude < %s AND latitude > %s AND latitude < %s LIMIT 1" \
  # % ( min_lon, max_lon, min_lat, max_lat )
query = {"loc": {"$geoIntersects": { "$geometry": { "type": "Polygon", "coordinates": [ [ [ float(min_lon), float(min_lat) ], [ float(min_lon), float(max_lat) ], [ float(max_lon), float(max_lat) ], [ float(max_lon), float(min_lat) ], [ float(min_lon), float(min_lat) ] ] ]}}}}
logging.debug("query: %s" % json.dumps(query))

count = gps_log.find(query).count()
points = []
for point in gps_log.find(query):
  points.append(point)

response =  {
  'min_lon': min_lon,
  'min_lat': min_lat,
  'max_lon': max_lon,
  'max_lat': max_lat,

  'rid': hashlib.md5("%s%s%s%s%s" % ( bound_string, min_lon, max_lon, min_lat, max_lat )).hexdigest(),
  'bound_string': bound_string,
  'count': count,
  'setsize': gps_log.count(),
  'points': points
}



logging.debug("executed")
response['count'] = count
if(count):
  cache_max_age = CACHE_POSITIVE_AGE
else:
  cache_max_age = CACHE_NEGATIVE_AGE

print "Content-Type: text/plain"
print "Cache-Control: max-age=%d" % cache_max_age
print ""


print json.dumps(response, default = json_util.default)
logging.debug("dumped output")
# logging.debug("closed connection")
logging.debug("ending")

#!/usr/bin/python
from bson import json_util
import cgitb ; cgitb.enable()
import cgi
import datetime
import hashlib
import logging
import json

from pymongo import MongoClient


logging.basicConfig(level=logging.DEBUG,
  format='%(relativeCreated)d %(asctime)s %(name)-12s %(levelname)-8s %(message)s',
  #datefmt='%m-%d %H:%M',
  filename='/tmp/get_bookmarks.log',
  filemode='a+')

logging.debug("starting")

client = MongoClient()
db = client.ernie_org
gps_bookmarks = db.gps_bookmarks


form = cgi.FieldStorage()
min_lon = form.getfirst('min_lon','')
min_lat = form.getfirst('min_lat','')
max_lon = form.getfirst('max_lon','')
max_lat = form.getfirst('max_lat','')

if not min_lon: 
  min_lon = -80
if not min_lat: 
  min_lat = -80
if not max_lon: 
  max_lon = 80
if not max_lat: 
  max_lat = 80

# bounds of map displayed when tile info was requested
#
bound_string = form.getfirst('bound_string','')

logging.debug("read form data")

# sql = "SELECT * FROM gps_log WHERE longitude > %s AND longitude < %s AND latitude > %s AND latitude < %s LIMIT 1" \
  # % ( min_lon, max_lon, min_lat, max_lat )
query = {"loc": {"$geoIntersects": { "$geometry": { "type": "Polygon", "coordinates": [ [ [ float(min_lon), float(min_lat) ], [ float(min_lon), float(max_lat) ], [ float(max_lon), float(max_lat) ], [ float(max_lon), float(min_lat) ], [ float(min_lon), float(min_lat) ] ] ]}}}}
logging.debug("query: %s" % json.dumps(query, default = json_util.default))

count = 0;
points = []
last_included_entry_date = None
for point in gps_bookmarks.find(query):
  count = count + 1
  points.append(point)

response =  {
  'min_lon': min_lon,
  'min_lat': min_lat,
  'max_lon': max_lon,
  'max_lat': max_lat,

  'rid': hashlib.md5("%s%s%s%s%s" % ( bound_string, min_lon, max_lon, min_lat, max_lat )).hexdigest(),
  'bound_string': bound_string,
  'count': count,
  'setsize': gps_bookmarks.count(),
  'points': points
}



logging.debug("executed")
response['count'] = count

print "Content-Type: text/plain"
print ""


print json.dumps(response, default = json_util.default)
logging.debug("output: {response}".format(response = response))
logging.debug("dumped output")
# logging.debug("closed connection")
logging.debug("ending")

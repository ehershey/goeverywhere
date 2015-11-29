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
  filename='/tmp/save_bookmark.log',
  filemode='a+')

logging.debug("starting")

client = MongoClient()
db = client.ernie_org
gps_bookmarks = db.gps_bookmarks


form = cgi.FieldStorage()
lon = form.getfirst('lon','')
lat = form.getfirst('lat','')

lon = float(lon)
lat = float(lat)

logging.debug("read form data")

bookmark = { "creation_date" : datetime.datetime.now(), "loc" : { "type" : "Point", "coordinates" : [ lon, lat ] }, "label": "Automatic Label" }
logging.debug("pre-insert bookmark: %s" % json.dumps(bookmark, default = json_util.default))

objectid = gps_bookmarks.insert(bookmark)
bookmark = db.gps_bookmarks.find_one({ "_id": objectid})

logging.debug("post-insert bookmark: %s" % json.dumps(bookmark, default = json_util.default))

response = bookmark

logging.debug("executed")

print "Content-Type: text/plain"
print ""

print json.dumps(response, default = json_util.default)
logging.debug("output: {response}".format(response = response))
logging.debug("dumped output")
# logging.debug("closed connection")
logging.debug("ending")

import logging

logging.basicConfig(level=logging.DEBUG,
  format='%(relativeCreated)d %(asctime)s %(name)-12s %(levelname)-8s %(message)s',
  #datefmt='%m-%d %H:%M',
  filename='/tmp/goe.log',
  filemode='a+')

def debug(varname_or_msg):
    if varname_or_msg in globals():
        varname = varname_or_msg
        varval = globals()[varname]
        logging.debug("%s: %s", varname, varval)
    else:
        msg = varname_or_msg
        logging.debug(msg)


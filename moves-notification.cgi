#!/bin/bash
export PYTHONPATH=$PYTHONPATH:/home/ernie/Dropbox/Development/Misc:.::
LOG=/tmp/moves-notification.log

# HTTP_USER_AGENT=Moves API
# HTTP_USER_AGENT=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36

if [ "$HTTP_USER_AGENT" = "Moves API" ]
then
  LOG=/tmp/moves-notification.log
else
  LOG=/dev/stdout
fi
exec 2>>$LOG

echo "Content-Type: text/plain"
echo
echo "OK"
exec 1>>$LOG
echo
echo "New Request"
echo date:
date
echo env:
env
echo cat:
cat


#exec 0>&- # close stdin
#exec 1>&- # close stdout
#exec 2>&- # close stderr

. ~ernie/git/utilities/crontab.env
export MOVES_ACCESS_TOKEN
export MARATHON_SPREADSHEET_ID
export MONGODB_URI


scripts="~ernie/git/utilities/update_moves_summaries.sh
  ~ernie/git/utilities/update_moves_csv.sh
  ~ernie/git/utilities/generate_unit_report.sh
"
# interpolate tildes
#
scripts=$(eval echo $scripts)

if [ "$HTTP_USER_AGENT" = "Moves API" ]
then
  (
  for script in $scripts
  do
    echo "RUNNING $script"
    $script
  done
  ) &
else
  for script in $scripts
  do
    date
    echo "RUNNING $script"
    $script
  done
fi

exec 0>&- # close stdin
exec 1>&- # close stdout
exec 2>&- # close stderr


exit

#!/bin/bash

echo "Content-Type: text/plain"
echo
echo "OK"
date >> /tmp/moves-notification.log 2>&1
env >> /tmp/moves-notification.log 2>&1
cat >> /tmp/moves-notification.log 2>&1

(
~ernie/git/utilities/update_moves_csv.sh  >> /tmp/update_moves_csv.log 2>&1
~ernie/git/utilities/unit_report_generator.sh  >> /tmp/unit_report.log 2>&1
) &
exec 0>&- # close stdin
exec 1>&- # close stdout
exec 2>&- # close stderr

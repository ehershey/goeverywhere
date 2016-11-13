#!/bin/bash
export PYTHONPATH=$PYTHONPATH:/home/ernie/Dropbox/Development/Misc:.::

echo "Content-Type: text/plain"
echo
echo "OK"
date >> /tmp/moves-notification.log 2>&1
env >> /tmp/moves-notification.log 2>&1
cat >> /tmp/moves-notification.log 2>&1

exec 0>&- # close stdin
exec 1>&- # close stdout
exec 2>&- # close stderr


(
~ernie/git/utilities/update_moves_csv.sh >> /tmp/update_moves_csv.log 2>&1
~ernie/git/utilities/save_myfitnesspal_data.js >> /tmp/save_myfitnesspal_data.log 2>&1
~ernie/git/utilities/generate_unit_report.sh >> /tmp/unit_report.log 2>&1
# ~ernie/git/utilities/post_year_ago_weight_to_numerous.py >> /tmp/post_year_ago_weight_to_numerous.log 2>&1
) &


exec 0>&- # close stdin
exec 1>&- # close stdout
exec 2>&- # close stderr


exit

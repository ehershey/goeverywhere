// defaults
//
//

var autoupdate_version = 47;

// good general center
//
var default_center_longitude = -73.979876;
var default_center_latitude = 40.679718;
var default_zoom = 16;

// how many tiles to divide map into
//
var tiles_across = 1;
var tiles_down = 1;

// Milliseconds between points required to start new tracks
var NEW_TRACK_GAP_MILLIS = 150000;

// home
//
// var default_center_longitude = -73.96205100000000000000;
// var default_center_latitude = 40.68463700000000000000;

var center_longitude;
var center_latitude;

var bounds_change_timeout_millis = 500;

var tile_count = 0;
var heatmap_count = 0;
var line_count = 0;
var bookmark_count = 0;

var initial_zoom = default_zoom;
var initial_center_longitude = default_center_longitude;
var initial_center_latitude = default_center_latitude;


// How many hits are visible on the map; Tallied in draw_visualization()
// to display in pie chart text
//
var gVisibleHits;
var gBoundsStartCountingVisibleHits;

var gMap;

var gProgressBar;

var gInfoWindow = new google.maps.InfoWindow({});
var gSaveBookmarkControlDiv;

Cookies.set("loaded",1, { expires: 365 });

google.maps.event.addDomListener(window, 'load', initialize);

function initialize() {
  gProgressBar = $( "#progressbar" );
  gProgressBar.progressbar({
    value: 0,
    max: 100
  });

  $.history.init(history_callback,  { unescape: "/=;&" });

  var latlng = new google.maps.LatLng(initial_center_latitude, initial_center_longitude);
  var myOptions = {
    zoom: initial_zoom,
    center: latlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  gMap = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
  google.maps.event.addDomListener(gMap, 'bounds_changed', handle_bounds_changed);
  google.maps.event.addListener(gMap, 'mousemove', update_pointer_info);

  // if we can geolocate and we're on the default zoom and center, try to do it
  //
  if(navigator.geolocation && initial_center_latitude === default_center_latitude && initial_center_longitude === default_center_longitude)
  {
    navigator.geolocation.getCurrentPosition(position_handler, position_handler,  {maximumAge:600000, timeout:10000});
  }

  var url = "get_stats.cgi";
  // $.get( url, null, process_tile_response, "json");
  $.ajax({
    dataType: "json",
    url: url,
    success: process_stats_response,
    error: function(xhr) { alert('Error!  Status = ' + xhr.status + '(' + url + ')'); }
  });

  // Create the DIV to hold the control and call the ToggleControlsControl() constructor
  // passing in this DIV.
  var toggleControlsControlDiv = document.createElement('div');
  var toggleControlsControl = new ToggleControlsControl(toggleControlsControlDiv, gMap);

  toggleControlsControlDiv.index = 1;
  gMap.controls[google.maps.ControlPosition.TOP_CENTER].push(toggleControlsControlDiv);

  // Create the DIV to hold the control and call the LocateMeControl() constructor
  // passing in this DIV.
  var locateMeControlDiv = document.createElement('div');
  var locateMeControl = new LocateMeControl(locateMeControlDiv, gMap);

  locateMeControlDiv.index = 1;
  gMap.controls[google.maps.ControlPosition.TOP_RIGHT].push(locateMeControlDiv);

  // Create the DIV to hold the control and call the SaveBookmarkControl() constructor
  // passing in this DIV.
  var saveBookmarkControlDiv = document.createElement('div');
  var saveBookmarkControl = new SaveBookmarkControl(saveBookmarkControlDiv, gMap);

  gSaveBookmarkControlDiv = saveBookmarkControlDiv;

  saveBookmarkControlDiv.index = 1;
  gMap.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(saveBookmarkControlDiv);
  $(gSaveBookmarkControlDiv).hide();
}

var stats_data;
function process_stats_response(data, textStatus, xhr) {
  stats_data = data;
  stats_data.oldest_date = new Date(data.oldest_point_timestamp * 1000);
  stats_data.newest_date = new Date(data.newest_point_timestamp * 1000);
  stats_data.formated_oldest_date = $.format.date(stats_data.oldest_date,"MM/dd/yyyy") ;
  stats_data.formated_newest_date = $.format.date(stats_data.newest_date,"MM/dd/yyyy") ;
  $("#all_dates_string").html('(' + stats_data.formated_oldest_date + ' - ' + stats_data.formated_newest_date + ')&nbsp;&nbsp;&nbsp;' + $.number(data.point_count) + ' points');
        // <a href="#" onclick="select_all_dates();">All Dates (<span id='all_dates_string'>01/01/2001 - 12/12/2012</span>)</a>
}

function select_all_dates() {
  $("#from").val(stats_data.formated_oldest_date);
  $("#to").val(stats_data.formated_newest_date);
  $("#adjust_bounds").attr('checked', false);
  save_map_state();
  process_map_display();
}
function select_today() {
  $("#from").val($.format.date(new Date(),"MM/dd/yyyy"));
  $("#to").val($.format.date(new Date(),"MM/dd/yyyy"));
  save_map_state();
  process_map_display();
}

function select_7days() {
  $("#from").val($.format.date(new Date() - 7 * 24 * 60 * 60 * 1000,"MM/dd/yyyy"));
  $("#to").val($.format.date(new Date(),"MM/dd/yyyy"));
  save_map_state();
  process_map_display();
}



function clearmap_button_onclick()
{
  clear_map();
}


function locateme_button_onclick()
{
    if(!navigator.geolocation) {
      display_error("Your browser doesn't support geolocation");
    }
    navigator.geolocation.getCurrentPosition(position_handler, position_handler,  {maximumAge:600000, timeout:10000});
}
function display_error(msg)
{
  $( "#dialog_message_text" ).html(msg);
  $( "#dialog_message" ).dialog({ modal: true, buttons: { Ok: function() { $( this ).dialog( "close" ); } } });
}

function position_handler(position)
{
  if(position.message)
  {
     display_error('geolocation error : ' + position.message);
  }
  else
  {
    if(position && position.coords)
    {
        initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
        gMap.setCenter(initialLocation);
        var marker = new google.maps.Marker
        ({
          position: initialLocation,
          icon: new google.maps.MarkerImage('//maps.gstatic.com/mapfiles/mobile/mobileimgs2.png',
                                            new google.maps.Size(22,22),
                                            new google.maps.Point(0,18),
                                            new google.maps.Point(11,11)),
          shadow: null,
          map: gMap,
          title:"Current Location"
        });
    }
  }
}

var gobjDisplayedTiles = new Object();
var gobjDisplayedHeatmaps = new Object();
var gobjDisplayedBookmarks = new Object();
var gobjDisplayedBookmarkSets = new Object();
var gobjDisplayedLines = new Object();

function handle_bounds_changed()
{
  var bounds_changed_bounds = gMap.getBounds();
  var maybe_process_map_display = function() {
    current_bounds = gMap.getBounds();
    if(current_bounds.equals(bounds_changed_bounds))
    {
      save_map_state();
      // process_map_display();
    }
    else
    {
      console.log('opting out of processing map display because bounds have changed since original handler call');
    }

  }
  setTimeout(maybe_process_map_display, bounds_change_timeout_millis);
}

function update_button_onclick() {
  process_map_display()
}

function process_map_display()
{
  gProgressBar.show();
  gProgressBar.progressbar( "value", 0);

  var mapBounds = gMap.getBounds();


  gVisibleHits = 0;
  gBoundsStartCountingVisibleHits = mapBounds;

  var northEastCorner = mapBounds.getNorthEast();
  var southWestCorner = mapBounds.getSouthWest();

  var northEastLat = northEastCorner.lat();
  var northEastLon = northEastCorner.lng();
  var southWestLat = southWestCorner.lat();
  var southWestLon = southWestCorner.lng();


  var southEastLon = northEastLon;
  var northWestLon = southWestLon;

  var southEastLat = southWestLat;
  var northWestLat = northEastLat;

  // console.log("northEastLat: " + northEastLat);
  // console.log("northEastLon: " + northEastLon);
  // console.log("southWestLat: " + southWestLat);
  // console.log("southWestLon: " + southWestLon);

  var total_tiles = tiles_across * tiles_down;
  // console.log("total tiles: " + total_tiles);

  var map_lat_diff = northEastLat - southWestLat;
  var map_lon_diff = northEastLon - southWestLon;

  // console.log("map_lat_diff: " + map_lat_diff);
  // console.log("map_lon_diff: " + map_lon_diff);

  var tile_lat_diff = map_lat_diff / tiles_down;
  var tile_lon_diff = map_lon_diff / tiles_across;

  // console.log("tile_lat_diff: " + tile_lat_diff);
  // console.log("tile_lon_diff: " + tile_lon_diff);

  // sw lat < ne lat
  // sw lon < ne lon
  //

  clear_map();

  var url = 'get_bookmarks.cgi?';
  var min_lon = -80;
  var max_lon = 80;
  var min_lat = -90;
  var max_lat = 90;

  url += 'min_lon=' + min_lon;
  url += '&';
  url += 'max_lon=' + max_lon;
  url += '&';
  url += 'min_lat=' + min_lat;
  url += '&';
  url += 'max_lat=' + max_lat;
  url += '&';
  url += 'bound_string=' + escape(gMap.getBounds().toString());
  url += '&';
  url += 'rind=' + tile_index + "/" + total_tiles;
  url += '&';
  url += 'ts=' + (new Date()).getTime();


  // $.get( url, null, process_tile_response, "json");
  $.ajax({
     dataType: "json",
     url: url,
     success: process_bookmark_response,
     error: function(xhr) { alert('Error!  Status = ' + xhr.status + '(' + url + ')'); }
   });




  var tile_index = 0;
  for(var i = 0 ; i < tiles_across ; i++)
  {

    // calculate bounds for individual tile
    //
    var tile_southWest_lon = southWestLon + (i * tile_lon_diff);
    var tile_northEast_lon = tile_southWest_lon + tile_lon_diff;

    var tile_southEast_lon = tile_northEast_lon;
    var tile_northWest_lon = tile_southWest_lon;

    for(var j = 0 ; j < tiles_down ; j++)
    {
      console.log("processing tile " + ++tile_index + " of " + total_tiles);

      var tile_southWest_lat = southWestLat + (j * tile_lat_diff);
      var tile_northEast_lat = tile_southWest_lat + tile_lat_diff;

      var tile_southEast_lat = tile_southWest_lat;
      var tile_northWest_lat = tile_northEast_lat;
      var url = 'get_points.cgi?';

      var min_lon;
      var max_lon;
      var min_lat;
      var max_lat;

      if($("#adjust_bounds")[0].checked) {
        min_lon = -80;
        max_lon = 80;
        min_lat = -90;
        max_lat = 90;
      }
      else
      {
        min_lon = tile_northWest_lon;
        max_lon = tile_northEast_lon;
        min_lat = tile_southWest_lat;
        max_lat = tile_northEast_lat;
      }

      url += 'from=' + $("#from").val();
      url += '&';
      url += 'to=' + $("#to").val();
      url += '&';
      url += 'min_lon=' + min_lon;
      url += '&';
      url += 'max_lon=' + max_lon;
      url += '&';
      url += 'min_lat=' + min_lat;
      url += '&';
      url += 'max_lat=' + max_lat;
      url += '&';
      url += 'bound_string=' + escape(gMap.getBounds().toString());
      url += '&';
      url += 'rind=' + tile_index + "/" + total_tiles;


      // $.get( url, null, process_tile_response, "json");
      $.ajax({
         dataType: "json",
         url: url,
         success: process_tile_response,
         error: function(xhr) { alert('Error!  Status = ' + xhr.status + '(' + url + ')'); }
       });

    }
  }

}

function clear_map() {
  for(rid in gobjDisplayedTiles)
  {
    if(gobjDisplayedTiles[rid])
    {
      gobjDisplayedTiles[rid].setMap(null);
      delete gobjDisplayedTiles[rid];
      tile_count--;
      console.log('tile_count--: ' + tile_count);
    }
    console.log('tile_count..: ' + tile_count);
  }

  for(rid in gobjDisplayedHeatmaps)
  {
    if(gobjDisplayedHeatmaps[rid])
    {
      gobjDisplayedHeatmaps[rid].setMap(null);
      delete gobjDisplayedHeatmaps[rid];
      heatmap_count--;
      console.log('heatmap_count--: ' + heatmap_count);
    }
    console.log('heatmap_count..: ' + heatmap_count);
  }

  for(rid in gobjDisplayedLines)
  {
    if(gobjDisplayedLines[rid])
    {
      gobjDisplayedLines[rid].setMap(null);
      delete gobjDisplayedLines[rid];
      line_count--;
      console.log('line_count--: ' + line_count);
    }
    console.log('line_count..: ' + line_count);
  }

  for(rid in gobjDisplayedBookmarks)
  {
    if(gobjDisplayedBookmarks[rid])
    {
      gobjDisplayedBookmarks[rid].setMap(null);
      delete gobjDisplayedBookmarks[rid];
      bookmark_count--;
      console.log('bookmark_count--: ' + bookmark_count);
    }
    console.log('bookmark_count..: ' + bookmark_count);
  }


  $("#map_info_text").html(" ");
  $("#pointer_info").html(" ");
}

function process_bookmark_response(data,textStatus,xhr)
{
  if(am_in_new_view(data.bound_string)) return;
  increment_progressbar();
  if(gobjDisplayedBookmarkSets[data.rid]) return;
  if(!data.count) return;
  console.log('continuing after new_view check and cache check and count check in process_bookmark_response');

  var points = data.points;
  for(var i = 0 ; i < points.length ; i++)
  {
    var point = points[i];
    display_bookmark(point);
}
  gobjDisplayedBookmarkSets[data.rid] = true;
}

function display_bookmark(point)
{
    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(point.loc.coordinates[1], point.loc.coordinates[0]),
      map: gMap,
      icon: '//maps.google.com/mapfiles/ms/icons/blue-dot.png',
      title: point.label
    });

    var contentString = '<div>';
    contentString += 'Title: ' + point.label + '<br/>';
    contentString += 'Added: ' + strftime("%D %R",new Date(point.creation_date.$date)) + '<br/>';
    contentString += '</div>';

    marker.addListener('click', function() {
      gInfoWindow.setContent(contentString);
      gInfoWindow.open(gMap, marker);
    });

    gobjDisplayedBookmarks[gobjDisplayedBookmarks.length] = marker;
    bookmark_count++;

}


function process_tile_response(data,textStatus,xhr)
{
  if(am_in_new_view(data.bound_string)) return;
  increment_progressbar();
  var total_tiles = tiles_across * tiles_down;
  var current_tile_count = tile_count;
  draw_visualization(tile_count, total_tiles, data.setsize, data.bound_string, data.count, data.from, data.to);
  if(gobjDisplayedTiles[data.rid]) return;
  if(gobjDisplayedHeatmaps[data.rid]) return;
  if(!data.count) return;
  console.log('continuing after new_view check and cache check and count check in process_tile_response');

  var mapBounds = gMap.getBounds();
  var northEastCorner = mapBounds.getNorthEast();
  var southWestCorner = mapBounds.getSouthWest();

  var tile_northWest_lon = data.min_lon;
  var tile_northEast_lon = data.max_lon;
  var tile_southWest_lat = data.min_lat;
  var tile_northEast_lat = data.max_lat;

  var tile_southWest_lon = tile_northWest_lon;
  var tile_southEast_lon = tile_northEast_lon;

  var tile_southEast_lat = tile_southWest_lat;
  var tile_northWest_lat = tile_northEast_lat;


  var tileCoords = [
    new google.maps.LatLng(tile_southWest_lat, tile_southWest_lon),
    new google.maps.LatLng(tile_northWest_lat, tile_northWest_lon),
    new google.maps.LatLng(tile_northEast_lat, tile_northEast_lon),
    new google.maps.LatLng(tile_southEast_lat, tile_southEast_lon),
    new google.maps.LatLng(tile_southWest_lat, tile_southWest_lon),
  ];

  var bottomCenter = new google.maps.LatLng(tile_southEast_lat, ( data.min_lon + data.max_lon) / 2);

  // Construct the polygon
  // Note that we don't specify an array or arrays, but instead just
  // a simple array of LatLngs in the paths property
  var tile = new google.maps.Polygon({
    paths: tileCoords,
    strokeColor: "#FF0000",
    strokeOpacity: 1,
    strokeWeight: 0,
    fillColor: "#00FF00",
    fillOpacity: 0.25,
    tooltip: "A tooltip"
  });

  //tile.setMap(gMap);

  var points = data.points;
  var heatmapData = [];
  var latlngs = []
  var bounds = new google.maps.LatLngBounds();
  for(var i = 0 ; i < points.length ; i++)
  {

    // Start new track
    //
    if(points[i-1] && (points[i].entry_date['$date'] - points[i-1].entry_date['$date']) >= NEW_TRACK_GAP_MILLIS)
    {
      var line = new google.maps.Polyline({
        path: latlngs,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
      });
      line.setMap(gMap);
      latlngs = [];
      gobjDisplayedLines[points[i].entry_date['$date']] = line;
      line_count++;
    }
    point = new google.maps.LatLng(points[i].loc.coordinates[1], points[i].loc.coordinates[0]);
    bounds.extend(point);
    heatmapData[heatmapData.length] = point;
    latlngs[latlngs.length] = point;
  }
  var heatmap = new google.maps.visualization.HeatmapLayer({
    data: heatmapData
  });
  heatmap.setMap(gMap);
  if($("#adjust_bounds")[0].checked)
  {
    gMap.fitBounds(bounds);
  }


  google.maps.event.addListener(tile, 'mousemove', function(event) { update_pointer_info(event, current_tile_count+1, data.count); } );

  gobjDisplayedTiles[data.rid] = tile;
  gobjDisplayedHeatmaps[data.rid] = heatmap;
  tile_count++;
  heatmap_count++;
  var total_tiles = tiles_across * tiles_down;
  draw_visualization(tile_count, total_tiles, data.setsize, data.bound_string,0,data.from,data.to);
}

function increment_progressbar()
{
  var total_tiles = tiles_across * tiles_down;
  // consider each response equal progress, so
  // for each, increment progress by 100 / total tiles
  //
  var old_value = gProgressBar.progressbar("value");
  var increment = 100 / total_tiles;
  var new_value = old_value + increment;
  // console.log("old_value: " + old_value);
  console.log("increment: " + increment);
  gProgressBar.progressbar( "value", new_value);

  if(new_value >= 98) {
    gProgressBar.fadeOut('slow');
  }
}

// Detect whether the view has changed since we started processing a view change
//
function am_in_new_view(bound_string)
{
  var current_bounds = gMap.getBounds();
  if(current_bounds.toString() === bound_string) return false;
  return true;
}
// called when url changes with "query string" after the hash
//
function history_callback(query_string)
{
  if(!query_string)
    return;
  var center_lat;
  var center_lng;

  var key_value_pairs = query_string.split(";");
  for (var i = 0 ; i < key_value_pairs.length ; i++)
  {
    var key_value_pair = key_value_pairs[i];
    var key_value = key_value_pair.split("=");
    var key = key_value[0];
    var value = key_value[1];
    if(key == "z")
    {
      var zoom = parseInt(value);
      if(gMap)
      {
        if(gMap.getZoom() != zoom)
        {
          gMap.setZoom(zoom);
        }
      }
      else
      {
        initial_zoom = zoom;
      }
    }
    else if(key == 'cla')
    {
      center_lat = value;
    }
    else if(key == 'clo')
    {
      center_lng = value;
    }
    else if(key == 'from')
    {
      $("#from").val(value);
    }
    else if(key == 'to')
    {
      $("#to").val(value);
    }
    if(center_lng && center_lat)
    {
      if(gMap)
      {
        var new_center = new google.maps.LatLng(center_lat,center_lng);
        if(!gMap.getCenter().equals(new_center))
        {
          gMap.setCenter(new_center);
        }
      }
      else
      {
        initial_center_latitude = center_lat;
        initial_center_longitude = center_lng;
      }
    }
  }
}

// save state of map, including zoom level and center
//
function save_map_state()
{
  var current_zoom = gMap.getZoom();
  var current_center = gMap.getCenter();

  var query_string = "z=" + current_zoom + ';cla=' + current_center.lat() + ';clo=' + current_center.lng() + ';from=' + $("#from").val() + ';to=' + $("#to").val();

  $.history.load(query_string);
}

function update_pointer_info(event, tile_number, hit_count)
{
  var s = ''
  s += "Cursor latitude: " + event.latLng.lat();
  s += '<br/>';
  s += "Cursor longitude: " + event.latLng.lng();
  if(tile_number)
  {
    s += '<br/>';
    s += "Tile: " + tile_number;
  }
  if(hit_count)
  {
    s += '<br/>';
    s += "Hits: " + hit_count;
  }
  $("#pointer_info").html(s);
}

function draw_visualization(hit_tiles, total_tiles, setsize, bound_string, count, from_string, to_string) {
    if(am_in_new_view(bound_string)) return;
    if(count) gVisibleHits += count;
    var map_info_text = $.number(gVisibleHits) + " points in view of " + $.number(setsize) + " total<br/>\nFrom " + from_string + " to " + to_string;
    $("#map_info_text").html(map_info_text);
  }

 $(function() {
    $( "#from" ).datepicker({
      showButtonPanel: true,
      defaultDate: "-1",
      changeMonth: true,
      changeYear: true,
      numberOfMonths: 1,
      maxDate: 0,
      onClose: function( selectedDate ) {
        $( "#to" ).datepicker( "option", "minDate", selectedDate );
        save_map_state();
      }
    });
    $( "#to" ).datepicker({
      showButtonPanel: true,
      defaultDate: "today",
      changeMonth: true,
      changeYear: true,
      numberOfMonths: 1,
      maxDate: 0,
      onClose: function( selectedDate ) {
        $( "#from" ).datepicker( "option", "maxDate", selectedDate );
        save_map_state();
      }
    });

    $("#from").datepicker("setDate",$("#from").datepicker("option","defaultDate"));
    $("#to").datepicker("setDate",$("#to").datepicker("option","defaultDate"));
  });

/**
 * The ToggleControlsControl adds a control to the map that toggles the control panel
 * This constructor takes the control DIV as an argument.
 * @constructor
 */
function ToggleControlsControl(controlDiv, map) {

  // Set CSS for the control border.
  var controlUI = document.createElement('div');
  controlUI.style.backgroundColor = '#fff';
  controlUI.style.border = '2px solid #fff';
  controlUI.style.borderRadius = '3px';
  controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
  controlUI.style.cursor = 'pointer';
  controlUI.style.marginBottom = '22px';
  controlUI.style.textAlign = 'center';
  controlUI.title = 'Click to show controls';
  controlDiv.appendChild(controlUI);

  // Set CSS for the control interior.
  var controlText = document.createElement('div');
  controlText.style.color = 'rgb(25,25,25)';
  controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
  controlText.style.fontSize = '16px';
  controlText.style.lineHeight = '38px';
  controlText.style.paddingLeft = '5px';
  controlText.style.paddingRight = '5px';
  controlText.innerHTML = '<span class="shortcut_letter">T</span>oggle Controls';
  controlUI.appendChild(controlText);

  // Setup the click event listeners: simply set the map to Chicago.
  controlUI.addEventListener('click', function() {
    $("#controls").toggle();
  });

}

/**
 * The LocateMeControl adds a control to the map that locates the user
 * This constructor takes the control DIV as an argument.
 * @constructor
 */
function LocateMeControl(controlDiv, map) {

  // Set CSS for the control border.
  var controlUI = document.createElement('div');
  controlUI.style.backgroundColor = '#fff';
  controlUI.style.border = '2px solid #fff';
  controlUI.style.borderRadius = '3px';
  controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
  controlUI.style.cursor = 'pointer';
  controlUI.style.marginBottom = '22px';
  controlUI.style.textAlign = 'center';
  controlUI.title = 'Click to show controls';
  controlDiv.appendChild(controlUI);

  // Set CSS for the control interior.
  var controlText = document.createElement('div');
  controlText.style.color = 'rgb(25,25,25)';
  controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
  controlText.style.fontSize = '16px';
  controlText.style.lineHeight = '38px';
  controlText.style.paddingLeft = '5px';
  controlText.style.paddingRight = '5px';
  controlText.innerHTML = '<span class="shortcut_letter">L</span>ocate Me';
  controlUI.appendChild(controlText);

  // Setup the click event listeners: simply set the map to Chicago.
  controlUI.addEventListener('click', function() {
      locateme_button_onclick();
  });

}

/**
 * The SaveBookmarkControl adds a control to the map that locates the user
 * This constructor takes the control DIV as an argument.
 * @constructor
 */
function SaveBookmarkControl(controlDiv, map) {

  // Set CSS for the control border.
  var controlUI = document.createElement('div');
  controlUI.style.backgroundColor = '#fff';
  controlUI.style.border = '2px solid #fff';
  controlUI.style.borderRadius = '3px';
  controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
  controlUI.style.cursor = 'pointer';
  controlUI.style.marginBottom = '22px';
  controlUI.style.textAlign = 'center';
  controlUI.title = 'Click to save bookmark';
  controlDiv.appendChild(controlUI);

  // Set CSS for the control interior.
  var controlText = document.createElement('div');
  controlText.style.color = 'rgb(25,25,25)';
  controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
  controlText.style.fontSize = '16px';
  controlText.style.lineHeight = '38px';
  controlText.style.paddingLeft = '5px';
  controlText.style.paddingRight = '5px';
  controlText.innerHTML = '<span class="shortcut_letter">S</span>ave Bookmark';
  controlUI.appendChild(controlText);

  // Setup the click event listeners: simply set the map to Chicago.
  controlUI.addEventListener('click', function() {
      savebookmark_button_onclick();
  });

}

function addbookmark_button_onclick() {
    $("#controls").hide();
    $(gSaveBookmarkControlDiv).show();
    $("#crosshair").show();
    $("#crosshair")[0].style.left = ( (document.body.clientWidth / 2) - ($("#crosshair")[0].clientWidth/2) ) + 'px';
    $("#crosshair")[0].style.top = ( (document.body.clientHeight / 2) - ($("#crosshair")[0].clientHeight/2) ) + 'px';
}
function savebookmark_button_onclick() {

  var url = 'save_bookmark.cgi?';

  url += 'lon=' + gMap.getCenter().lng();
  url += '&';
  url += 'lat=' + gMap.getCenter().lat();


  $.ajax({
    dataType: "json",
    url: url,
    success: process_savebookmark_response,
    error: function(xhr) { alert('Error!  Status = ' + xhr.status + '(' + url + ')'); }
  });
}

function process_savebookmark_response(data,textStatus,xhr) {
    $("#controls").show();
    $(gSaveBookmarkControlDiv).hide();
    $("#crosshair").hide();
    clear_map();
    process_map_display();
}

function blink_shortcut_letter(letter) {
  var className = "shortcut_letter";
  $("." + className + ":contains(" + letter.toUpperCase() + ")")
      .add("." + className + ":contains(" + letter.toLowerCase() + ")")
      .fadeTo(1,0.1, function() { $(this).fadeTo(200,1); });
}
shortcut.add("x",function() {
  blink_shortcut_letter("X")
  $('#controls').toggle();
});

shortcut.add("t",function() {
  blink_shortcut_letter("t")
  $('#controls').toggle();
});

shortcut.add("l",function() {
  blink_shortcut_letter("l")
  locateme_button_onclick();
});

shortcut.add("a",function() {
  blink_shortcut_letter("a")
  addbookmark_button_onclick();
});

shortcut.add("enter",function() {
  if($(gSaveBookmarkControlDiv).is(":visible")) {
    savebookmark_button_onclick();
  }
});

shortcut.add("s",function() {
  blink_shortcut_letter("s")
  if($(gSaveBookmarkControlDiv).is(":visible")) {
    savebookmark_button_onclick();
  }
});

shortcut.add("s",function() {
  clearmap_button_onclick();
});


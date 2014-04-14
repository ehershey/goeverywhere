// defaults
//

// good general center
//
var default_center_longitude = -73.979876
var default_center_latitude = 40.679718
var default_zoom = 13

// how many tiles to divide map into
//
var tiles_across = 4;
var tiles_down = 4;

// home
//
// var default_center_longitude = -73.96205100000000000000;
// var default_center_latitude = 40.68463700000000000000;

var center_longitude;
var center_latitude;

var bounds_change_timeout_millis = 500;

var tile_count = 0;

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


}

function position_handler(position)
{
  if(position.message)
  {
     alert('geolocation error : ' + position.message);
  }
  else
  {
    // alert('position_handler called: ' + position.coords);
    if(position && position.coords)
    {
        initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
        gMap.setCenter(initialLocation);
    }
  }
}

var gobjDisplayedTiles = new Object();
var gobjDisplayedHeatmaps = new Object();

function handle_bounds_changed()
{
  var bounds_changed_bounds = gMap.getBounds();
  var maybe_process_map_display = function() { 
    current_bounds = gMap.getBounds();
    if(current_bounds.equals(bounds_changed_bounds))
    {
      save_map_state();
      process_map_display();
    }
    else
    {
      console.log('opting out of processing map display because bounds have changed since original handler call');
    }

  }
  setTimeout(maybe_process_map_display, bounds_change_timeout_millis);

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
      
      url += 'min_lon=' + tile_northWest_lon;
      url += '&';
      url += 'max_lon=' + tile_northEast_lon;
      url += '&';
      url += 'min_lat=' + tile_southWest_lat;
      url += '&';
      url += 'max_lat=' + tile_northEast_lat;
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



function process_tile_response(data,textStatus,xhr)
{
  if(am_in_new_view(data.bound_string)) return;
  increment_progressbar();
  var total_tiles = tiles_across * tiles_down;
  var current_tile_count = tile_count;
  draw_visualization(tile_count, total_tiles, data.setsize, data.bound_string, data.count);
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
  for(var i = 0 ; i < points.length ; i++) 
  {
    heatmapData[heatmapData.length] = new google.maps.LatLng(points[i].loc.coordinates[1], points[i].loc.coordinates[0]);
  }
  var heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapData
        });
  heatmap.setMap(gMap);

  google.maps.event.addListener(tile, 'mousemove', function(event) { update_pointer_info(event, current_tile_count+1, data.count); } );

  gobjDisplayedTiles[data.rid] = tile;
  gobjDisplayedHeatmaps[data.rid] = heatmap;
  tile_count++;
  heatmap_count++;
  console.log('tile_count++: ' + tile_count);
  console.log('heatmap_count++: ' + heatmap_count);
  var total_tiles = tiles_across * tiles_down;
  draw_visualization(tile_count, total_tiles, data.setsize, data.bound_string);
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
  // console.log("increment: " + increment);
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
function draw_visualization(hit_tiles, total_tiles, setsize, bound_string, count) {
  if(am_in_new_view(bound_string)) return;
  if(count) gVisibleHits += count;
  // Create and populate the data table.
  var data = google.visualization.arrayToDataTable([
    ['Status', 'Hit tiles'],
    ['Missing', total_tiles - hit_tiles],
    ['Been there', hit_tiles]
  ]);

  // Create and draw the visualization.
  new google.visualization.PieChart(document.getElementById('visualization')).
    draw(data, {title:"Coverage of current view (" + gVisibleHits + " points in view of " + setsize + " total)", colors: ['red','green'], 
                "backgroundColor": 'transparent', pieSliceBorderColor: "blue"   });
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

  var query_string = "z=" + current_zoom + ';cla=' + current_center.lat() + ';clo=' + current_center.lng();

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

// generate unique identifier for current zoom and position, for comparing 
// map views at different points in time, like when requests
// 
function get_view_uid() 
{
}

google.maps.event.addDomListener(window, 'load', initialize);


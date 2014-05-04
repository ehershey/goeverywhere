//
//  org_ernieViewController.m
//  goeverywhere
//
//  Created by Ernie Hershey on 5/3/14.
//  Copyright (c) 2014 Ernie Hershey. All rights reserved.
//

#import "org_ernieViewController.h"
#import <GoogleMaps/GoogleMaps.h>


@interface org_ernieViewController ()

@end

@implementation org_ernieViewController {
    GMSMapView *mapView_;
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    // Create a GMSCameraPosition that tells the map to display the
    // coordinate -33.86,151.20 at zoom level 6.
//    GMSCameraPosition *camera = [GMSCameraPosition cameraWithLatitude:-33.86
//                                                            longitude:151.20
//                                                                 zoom:6];
//    mapView_ = [GMSMapView mapWithFrame:CGRectZero camera:camera];
    mapView_ = [[GMSMapView alloc] initWithFrame:self.view.bounds];

    mapView_.myLocationEnabled = YES;
    mapView_.settings.compassButton = YES;
    mapView_.settings.myLocationButton = YES;

    NSLog(@"User's location: %@", mapView_.myLocation);

    self.view = mapView_;
    
    // Creates a marker in the center of the map.
    GMSMarker *marker = [[GMSMarker alloc] init];
    marker.position = CLLocationCoordinate2DMake(-33.86, 151.20);
    marker.title = @"Sydney";
    marker.snippet = @"Australia";
    marker.map = mapView_;
	// Do any additional setup after loading the view, typically from a nib.
    
    GMSCoordinateBounds *bounds = [[GMSCoordinateBounds alloc] initWithRegion:mapView_.projection.visibleRegion];
    

    NSLog(@"\n%@,%@\n",[NSNumber numberWithDouble:bounds.northEast.latitude],[NSNumber numberWithDouble:bounds.northEast.longitude ]);
    // Create the request.
    NSURLRequest *request = [NSURLRequest requestWithURL:[NSURL URLWithString:[NSString stringWithFormat:@"http://goeverywhere.ernie.org/get_points.cgi?from=1/1/2001&to=1/1/2020&min_lon=%@&max_lon=%@&min_lat=%@&max_lat=%@", [NSNumber numberWithDouble:bounds.southWest.longitude], [NSNumber numberWithDouble:bounds.northEast.longitude],  [NSNumber numberWithDouble:bounds.southWest.latitude], [NSNumber numberWithDouble:bounds.northEast.latitude] ]]];
    
    // Fire request
    [NSURLConnection connectionWithRequest:request delegate:self];
    


}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

#pragma mark NSURLConnection Delegate Methods

- (void)connection:(NSURLConnection *)connection didReceiveResponse:(NSURLResponse *)response {
    // A response has been received, this is where we initialize the instance var you created
    // so that we can append data to it in the didReceiveData method
    // Furthermore, this method is called each time there is a redirect so reinitializing it
    // also serves to clear it
    _responseData = [[NSMutableData alloc] init];
}

- (void)connection:(NSURLConnection *)connection didReceiveData:(NSData *)data {
    // Append the new data to the instance variable you declared
    [_responseData appendData:data];
}

- (NSCachedURLResponse *)connection:(NSURLConnection *)connection
                  willCacheResponse:(NSCachedURLResponse*)cachedResponse {
    // Return nil to indicate not necessary to store a cached response for this connection
    return nil;
}

- (void)connectionDidFinishLoading:(NSURLConnection *)connection {
    // The request is complete and data has been received
    // You can parse the stuff in your instance variable now
    ;

    NSLog(@"NSURLConnection connectionDidFinishLoading() called: %@", [[NSString alloc] initWithData:_responseData encoding:NSASCIIStringEncoding]);

    
}

- (void)connection:(NSURLConnection *)connection didFailWithError:(NSError *)error {
    // The request has failed for some reason!
    // Check the error var
    NSLog(@"NSURLConnection didFailWithError() called: %@", error);

}

@end

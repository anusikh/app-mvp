#import <AppKit/AppKit.h>
#import <AVFoundation/AVFoundation.h>
#import <WebKit/WebKit.h>

#include <string>

@interface AppMicPermissionDelegate : NSObject <WKUIDelegate>
@end

@implementation AppMicPermissionDelegate

- (void)webView:(WKWebView*)webView
    requestMediaCapturePermissionForOrigin:(WKSecurityOrigin*)origin
                           initiatedByFrame:(WKFrameInfo*)frame
                                       type:(WKMediaCaptureType)type
                            decisionHandler:(void (^)(WKPermissionDecision decision))decisionHandler
{
  (void)webView;
  (void)origin;
  (void)frame;
  (void)type;

  [AVCaptureDevice requestAccessForMediaType:AVMediaTypeAudio
                           completionHandler:^(BOOL granted) {
                             dispatch_async(dispatch_get_main_queue(), ^{
                               decisionHandler(granted ? WKPermissionDecisionGrant
                                                       : WKPermissionDecisionDeny);
                             });
                           }];
}

@end

namespace
{
WKWebView* findWebView(NSView* view)
{
  if ([view isKindOfClass:[WKWebView class]])
  {
    return (WKWebView*)view;
  }

  for (NSView* subview in view.subviews)
  {
    WKWebView* webView = findWebView(subview);
    if (webView != nil)
    {
      return webView;
    }
  }

  return nil;
}
}  // namespace

void setWindowProtected(void* windowPtr) {
	@autoreleasepool {
		NSWindow* nsWindow = (__bridge NSWindow*)windowPtr;
		[nsWindow setSharingType:NSWindowSharingNone];
	}
}

void configureWindowForMicrophone(void* windowPtr)
{
  @autoreleasepool
  {
    NSWindow* nsWindow = (__bridge NSWindow*)windowPtr;
    WKWebView* webView = findWebView(nsWindow.contentView);

    if (webView == nil)
    {
      return;
    }

    static AppMicPermissionDelegate* delegate = nil;
    if (delegate == nil)
    {
      delegate = [[AppMicPermissionDelegate alloc] init];
    }

    webView.UIDelegate = delegate;
  }
}

std::string getBundleResourcePath()
{
  @autoreleasepool
  {
    NSString* resourcePath = [[NSBundle mainBundle] resourcePath];
    if (resourcePath == nil)
    {
      return {};
    }

    return std::string(resourcePath.UTF8String);
  }
}

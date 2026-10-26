#import <AppKit/AppKit.h>
#import <AVFoundation/AVFoundation.h>
#import <WebKit/WebKit.h>

#include <functional>
#include <utility>

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

void setAlwaysOnTop(void* windowPtr, bool onTop) {
    @autoreleasepool {
      NSWindow* nsWindow = (__bridge NSWindow*)windowPtr;
      [nsWindow setLevel:(onTop ? NSFloatingWindowLevel : NSNormalWindowLevel)];
      [nsWindow setCollectionBehavior:NSWindowCollectionBehaviorCanJoinAllSpaces |
                                    NSWindowCollectionBehaviorFullScreenAuxiliary];
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

@interface OverlayPanel : NSPanel
@end

@implementation OverlayPanel
- (BOOL)canBecomeKeyWindow { return YES; }
- (BOOL)canBecomeMainWindow { return NO; }
@end

namespace {
bool gTerminating = false;
std::function<void()> gCloseHandler;
}

@interface OverlayPanelDelegate : NSObject <NSWindowDelegate>
@end

@implementation OverlayPanelDelegate

- (void)windowWillClose:(NSNotification*)notification
{
  (void)notification;
  if (gTerminating) { return; }
  gTerminating = true;

  if (gCloseHandler) {
    gCloseHandler();            // graceful: stops the run loop, lets ~App run
  } else {
    [NSApp terminate:nil];      // fallback: exit() straight away
  }
}

@end

void setOverlayPanelCloseHandler(void* windowPtr, std::function<void()> handler)
{
  (void)windowPtr;
  gCloseHandler = std::move(handler);
}

void configureOverlayPanel(void* windowPtr)
{
  @autoreleasepool
  {
    NSPanel* panel = (NSPanel*)windowPtr;

    // re-assert the mask: webview's set_size() overwrites it
    [panel setStyleMask:(NSWindowStyleMaskTitled |
                          NSWindowStyleMaskClosable |
                          NSWindowStyleMaskResizable |
                          NSWindowStyleMaskNonactivatingPanel)];

    [panel setFloatingPanel:YES];
    [panel setBecomesKeyOnlyIfNeeded:NO];   // take keys even when not active
    [panel setHidesOnDeactivate:NO];
    [panel setReleasedWhenClosed:NO];
    [panel setLevel:NSFloatingWindowLevel];
    [panel setCollectionBehavior:NSWindowCollectionBehaviorCanJoinAllSpaces |
                                 NSWindowCollectionBehaviorFullScreenAuxiliary];
    [panel setSharingType:NSWindowSharingNone];
  }
}

void* createOverlayPanel(int width, int height)
{
  @autoreleasepool
  {
    [NSApplication sharedApplication];
    // No Dock icon, no Cmd-Tab entry: the app behaves as a background HUD
    [NSApp setActivationPolicy:NSApplicationActivationPolicyAccessory];

    OverlayPanel* panel = [[OverlayPanel alloc]
        initWithContentRect:NSMakeRect(0, 0, width, height)
                  styleMask:(NSWindowStyleMaskTitled |
                             NSWindowStyleMaskClosable |
                             NSWindowStyleMaskResizable |
                             NSWindowStyleMaskNonactivatingPanel)
                    backing:NSBackingStoreBuffered
                      defer:NO];

    [panel setTitle:@"app-mvp"];
    [panel center];
    [panel makeKeyAndOrderFront:nil];
    configureOverlayPanel((__bridge void*)panel);
    static OverlayPanelDelegate* delegate = nil;
    if (delegate == nil) {
      delegate = [[OverlayPanelDelegate alloc] init];
    }
    [panel setDelegate:delegate];
    return (__bridge void*)panel;
  }
}

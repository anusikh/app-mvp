#import <AppKit/AppKit.h>

void setWindowProtected(void* windowPtr) {
	@autoreleasepool {
		NSWindow* nsWindow = (__bridge NSWindow*)windowPtr;
		[nsWindow setSharingType:NSWindowSharingNone];
	}
}

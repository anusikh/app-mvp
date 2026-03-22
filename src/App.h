#pragma once
#include "webview/webview.h"

class App
{
 private:
  webview::webview w;

 public:
  App();
  void setupWindow();
  void setupJsToCpp();
  void testCppToJs();
  void run();
};

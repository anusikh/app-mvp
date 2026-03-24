#pragma once
#include "Stt.h"
#include "webview/webview.h"

class App
{
 private:
  webview::webview w;
  Stt stt;

 public:
  App();
  void setupWindow();
  void setupJsToCpp();
  void testCppToJs();
  void run();
};

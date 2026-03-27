#pragma once
#include <memory>
#include <string>
#include <thread>

#include "Stt.h"
#include "webview/webview.h"

namespace httplib
{
class Server;
}

class App
{
 private:
  webview::webview w;
  Stt stt;
  std::unique_ptr<httplib::Server> assetServer;
  std::thread assetServerThread;
  int assetServerPort = 0;

  std::string resolveFrontendRoot() const;
  std::string resolveModelPath() const;
  void startAssetServer();
  void stopAssetServer();

 public:
  App();
  ~App();
  void setupWindow();
  void setupJsToCpp();
  void testCppToJs();
  void run();
};

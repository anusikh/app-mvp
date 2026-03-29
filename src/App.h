#pragma once
#include <memory>
#include <mutex>
#include <string>
#include <thread>
#include <vector>

#include "Api.h"
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
  std::unique_ptr<Api> api;
  std::vector<std::thread> requestThreads;
  std::mutex requestThreadsMutex;
  std::mutex apiMutex;
  std::thread assetServerThread;
  int assetServerPort = 0;

  std::string resolveFrontendRoot() const;
  std::string resolveModelPath() const;
  void joinRequestThreads();
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

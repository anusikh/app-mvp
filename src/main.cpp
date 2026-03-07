#include <webview/webview.h>

#include <atomic>
#include <chrono>
#include <thread>

#include "App.h"

int main()
{
  App app;
  std::atomic<bool> uiOpen{true};

  // call jsFn after 10 seconds, only if UI running
  // but only if the UI is still running.
  std::thread delayedCaller(
      [&app, &uiOpen]()
      {
        std::this_thread::sleep_for(std::chrono::seconds(10));
        if (uiOpen.load())
        {
          app.testCppToJs();
        }
      });

  app.run();
  uiOpen = false;

  if (delayedCaller.joinable())
  {
    delayedCaller.join();
  }

  return 0;
}

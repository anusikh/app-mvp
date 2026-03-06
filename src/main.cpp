#include "App.h"
#include <webview/webview.h>
#include <thread>
#include <chrono>

int main() {
   App app;
   
  // calls function in 10 seconds
   std::thread delayedCaller([&app]() {
       std::this_thread::sleep_for(std::chrono::seconds(10));
       app.testCppToJs();
   });

   app.run();

   if (delayedCaller.joinable()) {
       delayedCaller.join();
   }
   return 0;
}

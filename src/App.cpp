#include "webview/webview.h"
#include <filesystem>
#include <iostream>
#include "App.h"

// class App {
  // private:
  //   webview::webview w;

  // public:
  //   App() : w(false, nullptr) {
  //     setupWindow();
  //   }

  //   int setupWindow() {
  //     try {
  //       w.set_title("app-mvp");
  //       w.set_size(1200, 800, WEBVIEW_HINT_NONE);
  //       std::string res = (std::filesystem::current_path() / "src-ts/dist/index.html").string();
  //       
  //       w.navigate("file://" + res);
  //       w.run();
  //     } catch(const webview::exception &e) {
  //       std::cerr << e.what();
  //       return 1;
  //     }
  //   }
  

  // App::App() : w(true, nullptr) {
  //   setupWindow();
  // }

  // void App::

// };

App::App() : w(true, nullptr) {
  setupWindow();
}


void App::setupWindow() {
  try {
         w.set_title("app-mvp");
         w.set_size(1200, 800, WEBVIEW_HINT_NONE);
         std::string res = (std::filesystem::current_path() / "src-ts/dist/index.html").string();
         
         w.navigate("file://" + res);
       } catch(const webview::exception &e) {
         std::cerr << e.what();
       }
}

void App::run() {
  w.run();
}

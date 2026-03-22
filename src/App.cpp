#include "App.h"

#include <filesystem>
#include <iostream>
#include <nlohmann/json.hpp>

#ifdef __APPLE__
#include "WindowProtection.h"
#endif
#include "webview/webview.h"

App::App() : w(true, nullptr)
{
  setupWindow();
  setupJsToCpp();

#ifdef __APPLE__
  auto windowResult = w.window();
  if (windowResult.ok())
  {
    setWindowProtected(windowResult.value());
  }
#endif
}

void utilFn(webview::webview* w)
{
  w->dispatch(
      [&]() -> void
      {
        nlohmann::json obj = {{"hey", "123"}};
        std::string code = "window.testCppToJs(" + obj.dump() + ")";
        w->eval(code);
      });
}

void App::setupJsToCpp()
{
  w.bind("testJsToCpp",
         [](std::string json_from_js) -> std::string
         {
           auto data = nlohmann::json::parse(json_from_js);
           std::cout << data.dump() << std::endl;
           nlohmann::json response = {{"result", "123"}};
           return response.dump();
         });
}

void App::testCppToJs()
{
  utilFn(&w);
}

void App::setupWindow()
{
  try
  {
    w.set_title("app-mvp");
    w.set_size(1200, 800, WEBVIEW_HINT_NONE);
    std::string res = (std::filesystem::current_path() / "src-ts/dist/index.html").string();
    w.navigate("file://" + res);
  }
  catch (const webview::exception& e)
  {
    std::cerr << e.what();
  }
}

void App::run()
{
  w.run();
}

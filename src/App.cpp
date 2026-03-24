#include "App.h"

#include <cstring>
#include <filesystem>
#include <iostream>
#include <nlohmann/json.hpp>
#include <stdexcept>
#include <string>
#include <vector>

#ifdef __APPLE__
#include "WindowProtection.h"
#endif
#include "webview/webview.h"

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

std::vector<float> base64ToFloat32(const std::string& encoded)
{
  std::string base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  std::vector<uint8_t> bytes;
  std::vector<int> T(256, -1);

  for (int i = 0; i < 64; i++) T[base64Chars[i]] = i;

  int val = 0, valb = -8;
  for (uint8_t c : encoded)
  {
    if (T[c] == -1) break;
    val = (val << 6) + T[c];
    valb += 6;
    if (valb >= 0)
    {
      bytes.push_back((uint8_t)((val >> valb) & 0xFF));
      valb -= 8;
    }
  }

  if (bytes.size() % sizeof(float) != 0)
  {
    throw std::runtime_error("invalid float32 buffer");
  }

  std::vector<float> audio(bytes.size() / sizeof(float));
  std::memcpy(audio.data(), bytes.data(), bytes.size());

  return audio;
}

App::App() : w(true, nullptr), stt()
{
  setupWindow();
  setupJsToCpp();

  stt.initWhisper("models/ggml-base.en.bin");

#ifdef __APPLE__
  auto windowResult = w.window();
  if (windowResult.ok())
  {
    setWindowProtected(windowResult.value());
  }
#endif
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

  w.bind("stt",
         [this](std::string json_from_js) -> std::string
         {
           auto data = nlohmann::json::parse(json_from_js);
           std::string base64 = data[0];

           auto audio = base64ToFloat32(base64);
           std::string result = stt.runWhisper(audio);

           std::cout << result << std::endl;
           nlohmann::json obj = {{"output", result}};

           w.eval("window.testCppToJs(" + obj.dump() + ")");

           return result;
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

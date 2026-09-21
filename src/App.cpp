#include "App.h"

#include <httplib.h>

#include <cstring>
#include <filesystem>
#include <iostream>
#include <memory>
#include <nlohmann/json.hpp>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

#include "Api.h"

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
  api = std::make_unique<Api>();

  setupJsToCpp();
  setupWindow();

  stt.initWhisper(resolveModelPath());
  piMgr.start(
      [this](const nlohmann::json& event)
      {
        std::cerr << "[pi event] " << event.dump() << std::endl;
        std::string code = "window.onPiEvent?.(" + event.dump() + ")";
        w.dispatch([this, code = std::move(code)]() { w.eval(code); });
      });

#ifdef __APPLE__
  auto windowResult = w.window();
  if (windowResult.ok())
  {
    setWindowProtected(windowResult.value());
    configureWindowForMicrophone(windowResult.value());
  }
#endif
}

App::~App()
{
  piMgr.stop();
  joinRequestThreads();
  stopAssetServer();
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

  w.bind("piPrompt",
         [this](std::string json_from_js) -> std::string
         {
           try
           {
             auto data = nlohmann::json::parse(json_from_js);
             std::string message = data[0];
             std::cerr << "[bridge piPrompt] " << message << std::endl;
             bool ok = piMgr.prompt(message);
             std::cerr << "[bridge piPrompt result] ok=" << ok << std::endl;
             return nlohmann::json({{"ok", ok}}).dump();
           }
           catch (const std::exception& e)
           {
             std::cerr << "pi prompt bridge error: " << e.what() << std::endl;
             return nlohmann::json({{"ok", false}, {"error", e.what()}}).dump();
           }
         });

  w.bind("piAbort",
         [this](std::string) -> std::string
         {
           std::cerr << "[bridge piAbort]" << std::endl;
           bool ok = piMgr.abort();
           return nlohmann::json({{"ok", ok}}).dump();
         });

  w.bind("stt",
         [this](std::string json_from_js) -> std::string
         {
           try
           {
             auto data = nlohmann::json::parse(json_from_js);
             std::string base64 = data[0];

             auto audio = base64ToFloat32(base64);
             std::string result = stt.runWhisper(audio);

             std::cerr << "[bridge stt transcript] " << result << std::endl;
             nlohmann::json obj = {{"output", result}};

             w.dispatch([this, payload = std::string("window.testCppToJs?.(" + obj.dump() + ")")]()
                        { w.eval(payload); });

             if (api == nullptr)
             {
               std::cout << "api is nullptr" << std::endl;
               return obj.dump();
             }

             std::cerr << "[bridge stt -> piPrompt]" << std::endl;
             piMgr.prompt(result);

             return obj.dump();
           }
           catch (const std::exception& e)
           {
             std::cerr << "stt bridge error: " << e.what() << std::endl;
             return nlohmann::json({{"error", e.what()}}).dump();
           }
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
    startAssetServer();

    w.set_title("app-mvp");
    w.set_size(500, 600, WEBVIEW_HINT_NONE);

    if (assetServerPort > 0)
    {
      w.navigate("http://127.0.0.1:" + std::to_string(assetServerPort) + "/index.html");
      return;
    }

    std::string res = (std::filesystem::path(resolveFrontendRoot()) / "index.html").string();
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

void App::joinRequestThreads()
{
  std::vector<std::thread> threads;
  {
    std::lock_guard<std::mutex> lock(requestThreadsMutex);
    threads.swap(requestThreads);
  }

  for (auto& thread : threads)
  {
    if (thread.joinable())
    {
      thread.join();
    }
  }
}

std::string App::resolveFrontendRoot() const
{
  namespace fs = std::filesystem;

#ifdef __APPLE__
  auto bundleResources = getBundleResourcePath();
  if (!bundleResources.empty())
  {
    fs::path bundleDist = fs::path(bundleResources) / "dist";
    if (fs::exists(bundleDist / "index.html"))
    {
      return bundleDist.string();
    }
  }
#endif

  fs::path cwdDist = fs::current_path() / "src-ts/dist";
  if (fs::exists(cwdDist / "index.html"))
  {
    return cwdDist.string();
  }

  fs::path buildDist = fs::current_path() / "dist";
  if (fs::exists(buildDist / "index.html"))
  {
    return buildDist.string();
  }

  throw std::runtime_error("Unable to locate frontend dist directory.");
}

std::string App::resolveModelPath() const
{
  namespace fs = std::filesystem;

#ifdef __APPLE__
  auto bundleResources = getBundleResourcePath();
  if (!bundleResources.empty())
  {
    fs::path bundledModel = fs::path(bundleResources) / "models/ggml-base.en.bin";
    if (fs::exists(bundledModel))
    {
      return bundledModel.string();
    }
  }
#endif

  fs::path cwdModel = fs::current_path() / "models/ggml-base.en.bin";
  if (fs::exists(cwdModel))
  {
    return cwdModel.string();
  }

  throw std::runtime_error("Unable to locate whisper model file.");
}

void App::startAssetServer()
{
  if (assetServerPort > 0)
  {
    return;
  }

  const auto frontendRoot = resolveFrontendRoot();

  assetServer = std::make_unique<httplib::Server>();
  if (!assetServer->set_mount_point("/", frontendRoot))
  {
    throw std::runtime_error("Failed to mount frontend dist directory.");
  }

  assetServerPort = assetServer->bind_to_any_port("127.0.0.1", 0);
  if (assetServerPort <= 0)
  {
    assetServer.reset();
    throw std::runtime_error("Failed to bind local asset server.");
  }

  assetServerThread = std::thread(
      [this]()
      {
        if (assetServer)
        {
          assetServer->listen_after_bind();
        }
      });
}

void App::stopAssetServer()
{
  if (assetServer)
  {
    assetServer->stop();
  }

  if (assetServerThread.joinable())
  {
    assetServerThread.join();
  }

  assetServer.reset();
  assetServerPort = 0;
}

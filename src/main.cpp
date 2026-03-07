#include <webview/webview.h>

#include <chrono>
#include <condition_variable>
#include <memory>
#include <mutex>
#include <thread>

#include "App.h"

int main()
{
  auto app = std::make_shared<App>();

  bool task_ready = false;
  std::condition_variable cv;
  std::mutex cv_mutex;

  // 2 threads only to simulate cpp to js ops
  std::thread timer_thread(
      [&]()
      {
        std::this_thread::sleep_for(std::chrono::seconds(10));
        {
          std::lock_guard<std::mutex> lock(cv_mutex);
          task_ready = true;
        }
        cv.notify_one();
      });

  std::thread worker_thread(
      [&]()
      {
        std::unique_lock<std::mutex> lock(cv_mutex);
        cv.wait(lock, [&]() { return task_ready; });
        app->testCppToJs();
      });

  app->run();

  if (timer_thread.joinable()) timer_thread.join();
  if (worker_thread.joinable()) worker_thread.join();

  return 0;
}

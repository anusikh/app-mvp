#pragma once
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

#include <atomic>
#include <cerrno>
#include <cstring>
#include <ctime>
#include <functional>
#include <mutex>
#include <nlohmann/json.hpp>
#include <string>
#include <thread>
#include <vector>

struct ProcessHandles
{
  int inFd = -1;   // parent writes here
  int outFd = -1;  // parent reads from here
  int errFd = -1;  // child stderr, kept OFF the JSON stream
  pid_t pid = -1;
};

class PiMgr
{
 private:
  // inline init of static value
  static inline std::atomic<bool> running{false};
  static std::mutex printMutex;

  using EventCallback = std::function<void(const nlohmann::json&)>;

  ProcessHandles handles;
  std::thread eventThread;
  std::thread stderrThread;
  std::mutex writeMutex;
  EventCallback eventCallback;
  unsigned int reqId = 1;

  static void print(const std::string& str);
  static void onSigInt(int);
  bool waitWithTimeout(pid_t pid, int attempts100ms);
  bool writeAll(int fd, const std::string& data);

  // buffered line reader, one read() syscall per 4kb
  void readLines(int fd, const std::function<void(const std::string&)>& onLine);
  void handleEvent(const std::string& event);
  void emitEvent(const nlohmann::json& event);

 public:
  PiMgr();
  ~PiMgr();
  bool launchProcess(const std::string& exe, const std::vector<std::string>& args,
                     ProcessHandles& h);
  void shutdownProcess(ProcessHandles& handles);
  bool sendCommand(const ProcessHandles& h, const nlohmann::json& cmd);

  bool start(EventCallback callback = nullptr);
  void stop();
  bool prompt(const std::string& message);
  bool abort();
  bool isRunning() const;

  int initPi();
};

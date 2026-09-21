#include "PiMgr.h"

#include <sys/_types/_pid_t.h>
#include <sys/_types/_ssize_t.h>
#include <sys/signal.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

#include <cerrno>
#include <csignal>
#include <cstddef>
#include <cstring>
#include <ctime>
#include <iostream>
#include <mutex>
#include <nlohmann/json.hpp>
#include <string>
#include <thread>

std::mutex PiMgr::printMutex;

PiMgr::PiMgr() = default;
PiMgr::~PiMgr()
{
  stop();
}

void PiMgr::print(const std::string& str)
{
  std::lock_guard<std::mutex> lock(PiMgr::printMutex);
  std::cout << str << std::flush;
}

void PiMgr::onSigInt(int)
{
  running = false;
}

bool PiMgr::waitWithTimeout(pid_t pid, int attempts100ms)
{
  for (int i = 0; i < attempts100ms; i++)
  {
    pid_t r = waitpid(pid, NULL, WNOHANG);
    if (r == -1)
    {
      if (errno == EINTR) continue;
      return true;  // ECHILD etc.: already gone
    }
    struct timespec ts{0, 100 * 1000 * 1000};  // 100 ms
    nanosleep(&ts, nullptr);
  }
  return false;
}

bool PiMgr::writeAll(int fd, const std::string& data)
{
  size_t off = 0;
  while (off < data.size())
  {
    ssize_t n = write(fd, data.data() + off, data.size() - off);
    if (n == -1)
    {
      if (errno == EINTR) continue;  // errno stores error code of last failed system call
      return false;
    }
    off += static_cast<size_t>(n);
  }
  return true;
}

void PiMgr::readLines(int fd, const std::function<void(const std::string&)>& onLine)
{
  char buff[4096];
  std::string line;

  for (;;)
  {
    ssize_t n = read(fd, buff, sizeof buff);
    if (n == -1)
    {
      if (errno == EINTR) continue;
      break;
    }

    if (n == 0) break;  // EOF

    for (size_t i = 0; i < n; i++)
    {
      if (buff[i] == '\n')
      {
        if (!line.empty() && line.back() == '\r')
        {
          line.pop_back();
        }
        onLine(line);
        line.clear();
      }
      else
      {
        line += buff[i];
      }
    }
  }

  if (!line.empty())
  {
    onLine(line);  // final line
  }
}

bool PiMgr::launchProcess(const std::string& exe, const std::vector<std::string>& args,
                          ProcessHandles& h)
{
  int pIn[2], pOut[2], pErr[2];
  if (pipe(pIn) == -1 || pipe(pOut) == -1 || pipe(pErr) == -1)
  {
    return false;
  }

  pid_t pid = fork();
  if (pid == -1)
  {
    return false;
  }

  if (pid == 0)
  {
    // child
    setpgid(0, 0);  // new process group (parent also tries, see below)

    dup2(pIn[0], STDIN_FILENO);  // 0 is read end and 1 is write end
    dup2(pOut[1], STDOUT_FILENO);
    dup2(pErr[1], STDERR_FILENO);

    close(pIn[0]);
    close(pIn[1]);
    close(pOut[0]);
    close(pOut[1]);
    close(pErr[0]);
    close(pErr[1]);

    std::vector<char*> argv;
    argv.reserve(args.size() + 2);
    argv.push_back(const_cast<char*>(exe.c_str()));
    for (const auto& a : args)
    {
      argv.push_back(const_cast<char*>(a.c_str()));
    }
    argv.push_back(nullptr);

    execvp(argv[0], argv.data());
    _exit(127);  // only reached if exec failed
  }

  // parent 
  // Also set the pgid from our side to close the classic setpgid race.
  setpgid(pid, pid);

  close(pIn[0]);
  close(pOut[1]);
  close(pErr[1]);

  h.inFd = pIn[1];
  h.outFd = pOut[0];
  h.errFd = pErr[0];
  h.pid = pid;
  return true;
}

void PiMgr::emitEvent(const nlohmann::json& event)
{
  if (eventCallback)
  {
    eventCallback(event);
  }
}

void PiMgr::handleEvent(const std::string& line)
{
  nlohmann::json ev;
  try
  {
    ev = nlohmann::json::parse(line);
  }
  catch (const nlohmann::json::parse_error&)
  {
    emitEvent({{"type", "raw"}, {"line", line}});
    print("[raw] " + line + "\n");
    return;
  }

  emitEvent(ev);

  const std::string type = ev.value("type", "");

  if (type == "message_update")
  {
    nlohmann::json ame = nlohmann::json::object();
    if (ev.contains("assistantMessageEvent") && ev["assistantMessageEvent"].is_object())
    {
      ame = ev["assistantMessageEvent"];
    }
    const std::string ameType = ame.value("type", "");
    if (ameType == "text_delta")
    {
      print(ame.value("delta", ""));
    }
    else if (ameType == "toolcall_start")
    {
      print("\n\033[2m[tool: " + ame.value("toolName", "?") + "]\033[0m ");
    }
    // thinking_delta / text_end / toolcall_end / done: ignored for now
  }
  else if (type == "message_start")
  {
    print("\n[pi] ");
  }
  else if (type == "message_end")
  {
    print("\n");
  }
  else if (type == "response")
  {
    if (!ev.value("success", true))
    {
      print("\n[pi error] " + ev.value("error", "unknown error") + "\n");
    }
    // success responses stay silent; the reply streams as events
  }
  else if (type == "extension_ui_request")
  {
    // extensions can ask the user questions. A full client answers with
    // {"type":"extension_ui_response","id":...}; we just surface it here.
    print("\n[extension wants input: " + ev.value("method", "?") + "] " + ev.value("title", "") +
          "\n");
  }
  // other events (agent_start, turn_end, tool_execution_*, queue_update,
  // compaction_*, auto_retry_*, ...) can be handled as the UI grows.
}

void PiMgr::shutdownProcess(ProcessHandles& h)
{
  // 1. Signal EOF on stdin: pi shuts down cleanly on its own.
  if (h.inFd != -1)
  {
    close(h.inFd);
    h.inFd = -1;
  }

  // 2. Give it up to 5 seconds to exit voluntarily.
  if (h.pid != -1 && waitWithTimeout(h.pid, 50))
  {
    h.pid = -1;
    return;
  }

  // 3. Escalate to the whole process group.
  if (h.pid != -1)
  {
    kill(-h.pid, SIGTERM);
    if (waitWithTimeout(h.pid, 20))
    {  // 2 more seconds
      h.pid = -1;
      return;
    }
    kill(-h.pid, SIGKILL);
    waitpid(h.pid, nullptr, 0);
    h.pid = -1;
  }
}

bool PiMgr::sendCommand(const ProcessHandles& h, const nlohmann::json& cmd)
{
  std::lock_guard<std::mutex> lock(writeMutex);
  return writeAll(h.inFd, cmd.dump() + "\n");
}

bool PiMgr::start(EventCallback callback)
{
  std::cerr << "[PiMgr] start()" << std::endl;
  if (running)
  {
    eventCallback = std::move(callback);
    return true;
  }

  signal(SIGPIPE, SIG_IGN);

  eventCallback = std::move(callback);
  running = true;

  std::cerr << "[PiMgr] launching pi --mode rpc" << std::endl;

  if (!launchProcess("pi",
                     {"--mode", "rpc", "--no-session", "--provider", "openrouter", "--model",
                      "qwen/qwen3.8-27b:free"},
                     handles))
  {
    running = false;
    std::cerr << "[PiMgr] launch failed" << std::endl;
    emitEvent({{"type", "system_error"}, {"error", "could not launch pi"}});
    return false;
  }

  std::cerr << "[PiMgr] launched pid=" << handles.pid << std::endl;
  emitEvent({{"type", "system"}, {"status", "started"}, {"pid", handles.pid}});

  eventThread = std::thread(
      [this]
      {
        readLines(handles.outFd,
                  [this](const std::string& line)
                  {
                    std::cerr << "[PiMgr stdout] " << line << std::endl;
                    handleEvent(line);
                  });
        running = false;
        emitEvent({{"type", "system"}, {"status", "exited"}});
      });

  stderrThread = std::thread(
      [this]
      {
        readLines(handles.errFd,
                  [this](const std::string& line)
                  {
                    if (!line.empty())
                    {
                      std::cerr << "[PiMgr stderr] " << line << std::endl;
                      emitEvent({{"type", "stderr"}, {"line", line}});
                    }
                  });
      });

  return true;
}

void PiMgr::stop()
{
  std::cerr << "[PiMgr] stop()" << std::endl;
  running = false;
  shutdownProcess(handles);

  if (eventThread.joinable()) eventThread.join();
  if (stderrThread.joinable()) stderrThread.join();

  if (handles.outFd != -1)
  {
    close(handles.outFd);
    handles.outFd = -1;
  }
  if (handles.errFd != -1)
  {
    close(handles.errFd);
    handles.errFd = -1;
  }
}

bool PiMgr::prompt(const std::string& message)
{
  std::cerr << "[PiMgr] prompt: " << message << std::endl;
  if (!running || handles.inFd == -1)
  {
    std::cerr << "[PiMgr] prompt failed: not running or stdin closed" << std::endl;
    return false;
  }

  nlohmann::json cmd = {
      {"id", "req-" + std::to_string(reqId++)}, {"type", "prompt"}, {"message", message}};
  std::cerr << "[PiMgr stdin] " << cmd.dump() << std::endl;
  return sendCommand(handles, cmd);
}

bool PiMgr::abort()
{
  if (!running || handles.inFd == -1) return false;
  return sendCommand(handles, nlohmann::json{{"type", "abort"}});
}

bool PiMgr::isRunning() const
{
  return running;
}

int PiMgr::initPi()
{
  running = true;

  // a dead pi shouldn't kill us with SIGPIPE, instead writeAll reports it
  signal(SIGPIPE, SIG_IGN);

  struct sigaction sa{};
  sa.sa_handler = PiMgr::onSigInt;
  sigemptyset(&sa.sa_mask);
  sa.sa_flags = 0;
  sigaction(SIGINT, &sa, nullptr);

  ProcessHandles h;
  std::cout << "[system] starting pi --mode rpc ...\n";

  if (!launchProcess("pi",
                     {"--mode", "rpc", "--no-session", "--provider", "openrouter", "--model",
                      "qwen/qwen3.8-27b:free"},
                     h))
  {
    std::cerr << "[system error] could not launch pi "
                 "(is it installed and on your PATH?)\n";
    return 1;
  }

  std::thread eventThread(
      [&h, this]
      {
        PiMgr::readLines(h.outFd, [this](const std::string& line) { handleEvent(line); });
        running = false;  // pi closed its stdout and exited
      });

  std::thread stderrThread(
      [&h, this]
      {
        PiMgr::readLines(h.errFd,
                         [](const std::string& line)
                         {
                           if (!line.empty())
                           {
                             std::cerr << "[pi stderr] " << line << "\n";
                           }
                         });
      });

  print(
      "[system] ready. type a message, /stop to abort a running turn, "
      "or 'exit' to quit.\n\n");

  unsigned int reqId = 1;
  while (running)
  {
    std::string input;
    std::getline(std::cin, input);

    if (!std::cin)
    {
      if (!running) break;        // interrupted by Ctrl+C
      if (std::cin.eof()) break;  // Ctrl+D
      std::cin.clear();           // transient failure; retry
      continue;
    }

    if (input == "exit") break;
    if (input.empty()) continue;

    if (input == "/stop")
    {
      // Ask pi to abort the current turn; the chat stays open.
      sendCommand(h, nlohmann::json{{"type", "abort"}});
      continue;
    }

    nlohmann::json cmd = {
        {"id", "req-" + std::to_string(reqId++)}, {"type", "prompt"}, {"message", input}};

    if (!sendCommand(h, cmd))
    {
      print("\n[system error] lost the pi process (write failed).\n");
      break;
    }
  }

  print("\n[system] shutting down...\n");
  shutdownProcess(h);

  // Only now, with the child dead (pipe write ends closed => EOF), is it
  // safe to join and then close the read descriptors.
  if (eventThread.joinable()) eventThread.join();
  if (stderrThread.joinable()) stderrThread.join();

  if (h.outFd != -1)
  {
    close(h.outFd);
    h.outFd = -1;
  }
  if (h.errFd != -1)
  {
    close(h.errFd);
    h.errFd = -1;
  }

  print("[system] disconnected cleanly.\n");
  return 0;
}

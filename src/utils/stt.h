#pragma once
#include <string>
#include <vector>

#include "whisper.h"

namespace utils
{
class Stt
{
 private:
  whisper_context* ctx = nullptr;

 public:
  Stt();
  ~Stt();
  void initWhisper(const std::string& modelPath);
  std::string runWhisper(const std::vector<float>& audio);
};
}  // namespace utils

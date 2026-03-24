#pragma once
#include <vector>

#include "whisper.h"

class Stt
{
 private:
  whisper_context* ctx;

 public:
  Stt();
  ~Stt();
  void initWhisper(const std::string& modelPath);
  std::string runWhisper(const std::vector<float>& audio);
};
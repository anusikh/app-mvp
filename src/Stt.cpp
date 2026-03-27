#include "Stt.h"

#include <iostream>
#include <ostream>
#include <string>

#include "whisper.h"

Stt::Stt() {}

Stt::~Stt()
{
  if (ctx)
  {
    whisper_free(ctx);
    ctx = nullptr;
  }
}

void Stt::initWhisper(const std::string& modelPath)
{
  if (ctx)
  {
    whisper_free(ctx);
    ctx = nullptr;
  }

  whisper_context_params cParams = whisper_context_default_params();
  cParams.use_gpu = true;
  cParams.flash_attn = true;

  ctx = whisper_init_from_file_with_params(modelPath.c_str(), cParams);
  std::cout << "whisper.cpp initialized..." << std::endl;
}

std::string Stt::runWhisper(const std::vector<float>& audio)
{
  if (!ctx)
  {
    throw std::runtime_error("whisper context is not initialized");
  }

  if (audio.empty())
  {
    return "";
  }

  whisper_full_params params = whisper_full_default_params(WHISPER_SAMPLING_GREEDY);

  // params.print_progress = false;
  // params.print_realtime = false;
  // params.print_timestamps = false;

  const int resultCode = whisper_full(ctx, params, audio.data(), audio.size());
  if (resultCode != 0)
  {
    throw std::runtime_error("whisper transcription failed");
  }

  std::string result;

  int n = whisper_full_n_segments(ctx);
  for (int i = 0; i < n; i++)
  {
    result += whisper_full_get_segment_text(ctx, i);
  }

  return result;
}

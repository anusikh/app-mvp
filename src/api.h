#pragma once

#include <httplib.h>

#include <memory>

#include "nlohmann/json_fwd.hpp"

class Api
{
 private:
  std::unique_ptr<httplib::SSLClient> client;
  std::string apiKey = "";

 public:
  Api();
  ~Api();
  nlohmann::json fetchAnswer(std::string query);
};

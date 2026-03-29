#pragma once

#include <httplib.h>
#include <memory>
#include "nlohmann/json_fwd.hpp"

class Api
{
    private:
        std::unique_ptr<httplib::SSLClient> client;
        std::string apiKey = "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";

    public:
        Api();
        ~Api();
        nlohmann::json fetchAnswer(std::string query);
};

#include "httplib.h"
#include "Api.h"
#include <nlohmann/json.hpp>

Api::Api()
{
    client = std::make_unique<httplib::SSLClient>("openrouter.ai", 443);
    client->set_follow_location(true);
    client->set_read_timeout(5, 0);
}

Api::~Api()
{
    client.reset();
}



nlohmann::json Api::fetchAnswer(std::string query)
{
    httplib::Headers headers = {
        {"Authorization", "Bearer " + apiKey},
        {"Content-Type", "application/json"}
    };

    nlohmann::json body = {
        {"model", "x-ai/grok-4.1-fast"},
        {"messages", {
            {
                {"role", "user"},
                {"content", query}
            }
        }}
    };

    auto res = client->Post("/api/v1/chat/completions", headers, body.dump(), "application/json");
    if (res && res->status == 200) {
        std::cout << "done boi" << std::endl;
        return nlohmann::json::parse(res->body);
    }
    return nlohmann::json();
}

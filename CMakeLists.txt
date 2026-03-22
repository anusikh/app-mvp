cmake_minimum_required(VERSION 3.16)
if(APPLE)
project(app-mvp LANGUAGES CXX OBJCXX)
else()
project(app-mvp LANGUAGES CXX)
endif()

if(NOT CMAKE_BUILD_TYPE)
set(CMAKE_BUILD_TYPE Release)
endif()

set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)

include(FetchContent)
FetchContent_Declare(
 webview
 GIT_REPOSITORY https://github.com/webview/webview
 GIT_TAG 0.12.0
)

FetchContent_Declare(
 nlohmann_json
 GIT_REPOSITORY https://github.com/nlohmann/json
 GIT_TAG v3.11.3
)

FetchContent_MakeAvailable(webview)
FetchContent_MakeAvailable(nlohmann_json)

if(APPLE)
add_executable(app-mvp src/main.cpp src/App.cpp src/WindowProtection.mm)
else()
add_executable(app-mvp src/main.cpp src/App.cpp)
endif()

if(APPLE)
target_link_libraries(app-mvp PRIVATE webview::core nlohmann_json::nlohmann_json "-framework AppKit")
else()
target_link_libraries(app-mvp PRIVATE webview::core nlohmann_json::nlohmann_json)
endif()

set_property(TARGET app-mvp PROPERTY CXX_STANDARD 17)
set_property(TARGET app-mvp PROPERTY CXX_STANDARD_REQUIRED ON)

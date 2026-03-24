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

FetchContent_Declare(
 whisper
 GIT_REPOSITORY https://github.com/ggerganov/whisper.cpp.git
 GIT_TAG master
)

set(WHISPER_BUILD_TESTS OFF CACHE BOOL "" FORCE)
set(WHISPER_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
set(WHISPER_BUILD_SERVER OFF CACHE BOOL "" FORCE)

# optimziations for whisper.cpp
set(WHISPER_NO_AVX OFF CACHE BOOL "" FORCE)
set(WHISPER_NO_AVX2 OFF CACHE BOOL "" FORCE)
set(WHISPER_NO_FMA OFF CACHE BOOL "" FORCE)

if(APPLE)
set(WHISPER_METAL ON CACHE BOOL "" FORCE)
else()
# CUDA
set(WHISPER_CUBLAS ON CACHE BOOL "" FORCE)
endif()

FetchContent_MakeAvailable(webview)
FetchContent_MakeAvailable(nlohmann_json)
FetchContent_MakeAvailable(whisper)

if(APPLE)
add_executable(app-mvp src/main.cpp src/App.cpp src/WindowProtection.mm src/Stt.cpp)
else()
add_executable(app-mvp src/main.cpp src/App.cpp src/Stt.cpp)
endif()

if(APPLE)
target_link_libraries(app-mvp PRIVATE webview::core nlohmann_json::nlohmann_json "-framework AppKit" whisper)
else()
target_link_libraries(app-mvp PRIVATE webview::core nlohmann_json::nlohmann_json whisper)
endif()

set_property(TARGET app-mvp PROPERTY CXX_STANDARD 17)
set_property(TARGET app-mvp PROPERTY CXX_STANDARD_REQUIRED ON)

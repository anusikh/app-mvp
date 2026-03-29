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

find_package(OpenSSL REQUIRED)

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

FetchContent_Declare(
 httplib
 GIT_REPOSITORY https://github.com/yhirose/cpp-httplib.git
 GIT_TAG v0.20.1
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
FetchContent_MakeAvailable(httplib)

if(APPLE)
configure_file(src/Info.plist.in ${CMAKE_CURRENT_BINARY_DIR}/Info.plist @ONLY)
add_executable(app-mvp MACOSX_BUNDLE src/main.cpp src/App.cpp src/WindowProtection.mm src/Stt.cpp src/Api.cpp)
set_target_properties(app-mvp PROPERTIES
  MACOSX_BUNDLE_INFO_PLIST ${CMAKE_CURRENT_BINARY_DIR}/Info.plist
  MACOSX_BUNDLE_GUI_IDENTIFIER com.appmvp.desktop
  MACOSX_BUNDLE_BUNDLE_NAME app-mvp
)
else()
add_executable(app-mvp src/main.cpp src/App.cpp src/Stt.cpp src/Api.cpp)
endif()

if(APPLE)
target_link_libraries(app-mvp PRIVATE webview::core nlohmann_json::nlohmann_json httplib::httplib OpenSSL::SSL OpenSSL::Crypto "-framework AppKit" "-framework AVFoundation" "-framework WebKit" "-framework Security" whisper)
else()
target_link_libraries(app-mvp PRIVATE webview::core nlohmann_json::nlohmann_json httplib::httplib OpenSSL::SSL OpenSSL::Crypto whisper)
endif()

target_compile_definitions(app-mvp PRIVATE CPPHTTPLIB_OPENSSL_SUPPORT)

set_property(TARGET app-mvp PROPERTY CXX_STANDARD 17)
set_property(TARGET app-mvp PROPERTY CXX_STANDARD_REQUIRED ON)

if(APPLE)
add_custom_command(TARGET app-mvp POST_BUILD
  COMMAND ${CMAKE_COMMAND} -E copy_directory
  ${CMAKE_SOURCE_DIR}/src-ts/dist
  $<TARGET_BUNDLE_CONTENT_DIR:app-mvp>/Resources/dist
  COMMAND ${CMAKE_COMMAND} -E make_directory
  $<TARGET_BUNDLE_CONTENT_DIR:app-mvp>/Resources/models
  COMMAND ${CMAKE_COMMAND} -E copy_if_different
  ${CMAKE_SOURCE_DIR}/models/ggml-base.en.bin
  $<TARGET_BUNDLE_CONTENT_DIR:app-mvp>/Resources/models/ggml-base.en.bin
)
endif()

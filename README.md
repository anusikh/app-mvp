### steps

- mkdir models && curl -L -o models/ggml-base.en.bin \
https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin

- cd /Users/pandaa1/Desktop/app-mvp/build && cmake -DCMAKE_EXPORT_COMPILE_COMMANDS=ON ..

- cmake -G Ninja -B build -S . -D CMAKE_BUILD_TYPE=Release

- cmake --build build --config Release

- ./build/bin/app-mvp

- clang-format -i src/*.cpp src/*.h

### steps

- mkdir models && curl -L -o models/ggml-base.en.bin \
https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin

- cmake -G Ninja -B build -S . -D CMAKE_BUILD_TYPE=Release
- cmake --build build --config Release
- cd /Users/pandaa1/Desktop/app-mvp/build && cmake -DCMAKE_EXPORT_COMPILE_COMMANDS=ON ..

- open ./build/bin/app-mvp.app

- clang-format -i src/*.cpp src/*.h

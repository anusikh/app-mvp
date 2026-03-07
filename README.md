- cmake -G Ninja -B build -S . -D CMAKE_BUILD_TYPE=Release

- cmake --build build --config Release

- ./build/bin/app-mvp

- clang-format -i src/*.cpp src/*.h

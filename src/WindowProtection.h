#pragma once

#include <functional>
#include <string>

void* createOverlayPanel(int width, int height);
void configureOverlayPanel(void* windowPtr);
void setAlwaysOnTop(void* windowPtr, bool onTop);
void setOverlayPanelCloseHandler(void* windowPtr, std::function<void()> handler);
void setWindowProtected(void* windowPtr);
void configureWindowForMicrophone(void* windowPtr);
std::string getBundleResourcePath();

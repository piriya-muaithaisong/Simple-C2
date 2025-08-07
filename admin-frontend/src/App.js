import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(`ws://${window.location.host}`);
    
    ws.current.onopen = () => {
      console.log('Connected to WebSocket');
      // Identify as admin
      ws.current.send(JSON.stringify({
        type: 'identify',
        role: 'admin'
      }));
    };
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'client_list') {
        setClients(data.clients);
      } else if (data.type === 'message') {
        setMessages(prev => [...prev, {
          sender: data.sender,
          message: data.message,
          timestamp: data.timestamp,
          clientId: data.clientId
        }]);
      }
    };
    
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    fetchClients();
    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };
  
  const fetchMessages = async (clientId) => {
    try {
      const response = await fetch(`/api/messages/${clientId}`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };
  
  const selectClient = (client) => {
    setSelectedClient(client);
    fetchMessages(client.client_id);
  };
  
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedClient) return;
    
    try {
      await fetch('/api/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: selectedClient.client_id,
          message: inputMessage
        })
      });
      
      setMessages(prev => [...prev, {
        sender: 'admin',
        message: inputMessage,
        timestamp: new Date().toISOString(),
        clientId: selectedClient.client_id
      }]);
      
      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const deleteClient = async (clientId) => {
    if (!confirm('Are you sure you want to delete this chat room? This will delete all messages and disconnect the client.')) {
      return;
    }

    try {
      await fetch(`/api/client/${clientId}`, {
        method: 'DELETE'
      });
      
      // If we deleted the currently selected client, clear selection
      if (selectedClient?.client_id === clientId) {
        setSelectedClient(null);
        setMessages([]);
      }
      
      // Refresh client list
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Error deleting chat room');
    }
  };

  const clearMessages = async (clientId) => {
    if (!confirm('Are you sure you want to clear all messages for this client?')) {
      return;
    }

    try {
      await fetch(`/api/messages/${clientId}`, {
        method: 'DELETE'
      });
      
      // If this is the selected client, refresh messages
      if (selectedClient?.client_id === clientId) {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error clearing messages:', error);
      alert('Error clearing messages');
    }
  };

  const clearAllRooms = async () => {
    if (!confirm('⚠️ WARNING: This will delete ALL chat rooms and disconnect ALL clients!\n\nAre you sure you want to continue?')) {
      return;
    }
    
    if (!confirm('This action cannot be undone. All chat history will be permanently deleted.\n\nAre you absolutely sure?')) {
      return;
    }

    try {
      await fetch('/api/clear-all-rooms', {
        method: 'DELETE'
      });
      
      // Clear local state
      setClients([]);
      setSelectedClient(null);
      setMessages([]);
      
      // Refresh client list
      fetchClients();
    } catch (error) {
      console.error('Error clearing all rooms:', error);
      alert('Error clearing all rooms');
    }
  };
  
  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Connected Clients</h2>
          <button 
            className="clear-all-btn"
            onClick={clearAllRooms}
            title="Delete all chat rooms"
          >
            <span style={{fontSize: '1.1em'}}>⚠️</span> Clear All Rooms
          </button>
        </div>
        <div className="clients-list">
          {clients.map(client => (
            <div
              key={client.client_id}
              className={`client-item ${selectedClient?.client_id === client.client_id ? 'active' : ''} ${client.status}`}
            >
              <div className="client-info" onClick={() => selectClient(client)}>
                <div className="client-name">{client.name}</div>
                <div className="client-status">{client.status}</div>
              </div>
              <div className="client-actions">
                <button 
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteClient(client.client_id);
                  }}
                  title="Delete chat room"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="chat-area">
        {selectedClient ? (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <h3>{selectedClient.name}</h3>
                <span className={`status-indicator ${selectedClient.status}`}>
                  {selectedClient.status}
                </span>
              </div>
              <div className="chat-header-actions">
                <button 
                  className="clear-btn"
                  onClick={() => clearMessages(selectedClient.client_id)}
                  title="Clear all messages"
                >
                  Clear Chat
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => deleteClient(selectedClient.client_id)}
                  title="Delete chat room"
                >
                  Delete Room
                </button>
              </div>
            </div>
            
            <div className="messages-container">
              {messages.map((msg, index) => {
                const isCommandOutput = msg.sender === 'client' && msg.message.includes('[') && msg.message.includes(']');
                return (
                  <div
                    key={index}
                    className={`message ${msg.sender === 'admin' ? 'admin' : 'client'} ${isCommandOutput ? 'command-output' : ''}`}
                  >
                    <div className="message-content">{msg.message}</div>
                    <div className="message-time">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={sendMessage} className="message-input-form">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type a message..."
                className="message-input"
              />
              <button type="submit" className="send-button">Send</button>
            </form>
          </>
        ) : (
          <div className="no-selection">
            <p>Select a client to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
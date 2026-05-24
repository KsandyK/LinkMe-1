import React, { useState } from 'react';

const LiveStream = () => {
  const [chatMessages, setChatMessages] = useState([
    { user: 'LunaRose', message: 'Hey everyone! 🌙' },
    { user: 'AlexStorm', message: 'This vibe is insane 🔥' },
    { user: 'JadeVelvet', message: 'Tip for private show? 😉' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      setChatMessages([...chatMessages, { user: 'You', message: newMessage }]);
      setNewMessage('');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: 'white', display: 'flex', fontFamily: 'system-ui, sans-serif' }}>
      {/* Video Player */}
      <div style={{ flex: 3, position: 'relative', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', top: 20, left: 20, backgroundColor: '#ef4444', color: 'white', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.9rem', fontWeight: 700 }}>
          LIVE
        </div>
        <div style={{ textAlign: 'center' }}>
          <video 
            style={{ width: '100%', maxHeight: '85vh', backgroundColor: '#111' }} 
            controls 
            autoPlay 
            muted
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny_320x180_10s_1MB.mp4"
          />
          <div style={{ position: 'absolute', bottom: 30, left: 30, backgroundColor: 'rgba(0,0,0,0.7)', padding: '8px 16px', borderRadius: '9999px', fontSize: '1.1rem' }}>
            Luna's Evening Vibes • 1,247 watching
          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div style={{ flex: 1, backgroundColor: '#111111', borderLeft: '1px solid #a855f7', display: 'flex', flexDirection: 'column', maxWidth: '380px' }}>
        <div style={{ padding: '1rem', backgroundColor: '#1a1a1a', borderBottom: '1px solid #a855f7', fontWeight: 700 }}>
          Live Chat
        </div>
        
        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
          {chatMessages.map((msg, i) => (
            <div key={i} style={{ marginBottom: '1rem' }}>
              <span style={{ color: '#c026d3', fontWeight: 600 }}>{msg.user}:</span>
              <span style={{ marginLeft: '8px' }}>{msg.message}</span>
            </div>
          ))}
        </div>

        <form onSubmit={sendMessage} style={{ padding: '1rem', borderTop: '1px solid #a855f7' }}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Send a message..."
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #a855f7',
              borderRadius: '9999px',
              color: 'white',
              outline: 'none'
            }}
          />
        </form>
      </div>
    </div>
  );
};

export default LiveStream;

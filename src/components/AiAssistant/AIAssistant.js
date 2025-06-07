import React, { useState, useEffect, useRef } from 'react';
import './AIAssistant.css';

//const GEMINI_API_KEY = 'AIzaSyDLEUU3FeImRmu3WN0aoBf111CqIJNJdSM'; // Replace with your actual API key
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

if(!GEMINI_API_KEY){
  console.warn('GEMINI_API_KEY is not found');
}


const formatMessage = (content) => {
  // Convert markdown-style code blocks to HTML
  let formatted = content
    // Handle code blocks with language specification
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre class="code-block"><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`;
    })
    // Handle inline code
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    // Handle bold text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Handle italic text
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Convert newlines to <br> tags
    .replace(/\n/g, '<br>');
  
  return formatted;
};

function AIAssistant({ 
  title = "🤖 AI Assistant", 
  welcomeMessage = "👋 Hi! I'm your AI assistant. How can I help you today?",
  placeholder = "Ask me anything...",
  contextData = {},
  subject = "general topics"
}) {
  const [chatMessages, setChatMessages] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendToGemini = async (message) => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      return "Please add your Gemini API key to enable AI features.";
    }

    try {
      // Enhanced context with better structure and instructions
      const context = `You are an expert assistant specializing in ${subject}. 

CURRENT CONTEXT:
${Object.entries(contextData).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

USER QUESTION: ${message}

RESPONSE GUIDELINES:
1. If asked for code, provide clean, well-commented code with proper formatting
2. Use markdown formatting for code blocks with \`\`\`language tags
3. Explain concepts step-by-step with clear examples
4. Include time and space complexity when relevant to algorithms
5. Be educational but conversational
6. For code requests, provide complete, runnable implementations
7. Use proper indentation and code structure
8. Add explanatory comments in code

Please provide a comprehensive, well-formatted response that helps the user understand the topic better.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: context
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1000,
            candidateCount: 1
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error:', response.status, errorData);
        return `API Error: ${response.status}. Please check your API key and try again.`;
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
        let aiResponse = data.candidates[0].content.parts[0].text;
        
        // Format the response for better readability
        aiResponse = aiResponse
          .replace(/```(\w+)?\n/g, '\n```$1\n') // Ensure proper code block formatting
          .replace(/```\n\n/g, '```\n') // Remove extra newlines after code blocks
          .trim();
        
        return aiResponse;
      } else {
        console.error('Unexpected API response structure:', data);
        return "I received an unexpected response format. Please try again.";
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      if (error.message.includes('fetch')) {
        return "Network error. Please check your internet connection and try again.";
      }
      return "Sorry, there was an error connecting to the AI service. Please try again.";
    }
  };

  const handleUserMessage = async () => {
    if (!userMessage.trim() || isLoading) return;

    const message = userMessage.trim();
    setUserMessage('');
    
    setChatMessages(prev => [...prev, {
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }]);

    setIsLoading(true);
    const aiResponse = await sendToGemini(message);
    setChatMessages(prev => [...prev, {
      type: 'ai',
      content: aiResponse,
      timestamp: new Date().toISOString()
    }]);
    setIsLoading(false);
  };

  return (
    <div className="ai-chat-container">
      <h3>{title}</h3>
      <div className="chat-messages">
        {chatMessages.length === 0 && (
          <div className="welcome-message">
            <p>{welcomeMessage}</p>
          </div>
        )}
        
        {chatMessages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.type}-message`}>
            <div className="message-content">
              <strong>{msg.type === 'user' ? '👤 You:' : '🤖 AI:'}</strong>
              {msg.type === 'user' ? (
                <p>{msg.content}</p>
              ) : (
                <div 
                  className="ai-response"
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message ai-message">
            <div className="message-content">
              <strong>🤖 AI:</strong>
              <p className="typing">Thinking...</p>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleUserMessage()}
          placeholder={placeholder}
          disabled={isLoading}
        />
        <button
          onClick={handleUserMessage}
          disabled={isLoading || !userMessage.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default AIAssistant;
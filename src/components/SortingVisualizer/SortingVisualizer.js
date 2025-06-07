// SortingVisualizer.js
import React, { useState, useEffect, useRef } from 'react';
import './SortingVisualizer.css';

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

function SortingVisualizer() {
  const [array, setArray] = useState([]);
  const [arraySize, setArraySize] = useState(20);
  const [customInput, setCustomInput] = useState('');
  
  const [isSorting, setIsSorting] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('bubbleSort');
  const [currentStep, setCurrentStep] = useState('');
  
  const [chatMessages, setChatMessages] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [speed, setSpeed] = useState(200);
  const stopRequested = useRef(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    generateRandomArray();
  }, [arraySize]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const generateRandomArray = () => {
    stopRequested.current = true;
    const newArray = Array.from({ length: arraySize }, () => Math.floor(Math.random() * 100) + 1);
    setArray(newArray);
    setIsSorting(false);
    setCurrentStep('Array generated. Ready to sort!');
  };

  const handleCustomInput = () => {
    if (isSorting) return;
    const parsedArray = customInput
      .split(',')
      .map(num => parseInt(num.trim()))
      .filter(num => !isNaN(num));
    if (parsedArray.length) {
      setArray(parsedArray);
      setCurrentStep('Custom array loaded. Ready to sort!');
    }
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const sendToGemini = async (message) => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      return "Please add your Gemini API key to enable AI features.";
    }

    try {
      // Enhanced context with better structure and instructions
      const context = `You are an expert computer science tutor specializing in sorting algorithms and data structures. 

CURRENT CONTEXT:
- Array size: ${array.length}
- Current algorithm: ${selectedAlgorithm}
- Current array state: [${array.join(', ')}]
- Sorting status: ${isSorting ? 'Currently sorting' : 'Ready to sort'}

USER QUESTION: ${message}

RESPONSE GUIDELINES:
1. If asked for code, provide clean, well-commented code with proper formatting
2. Use markdown formatting for code blocks with \`\`\`language tags
3. Explain algorithms step-by-step with clear examples
4. Include time and space complexity when relevant
5. Be educational but conversational
6. For code requests, provide complete, runnable implementations
7. Use proper indentation and code structure
8. Add explanatory comments in code

Please provide a comprehensive, well-formatted response that helps the user understand sorting algorithms better.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: context }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1000,
              candidateCount: 1
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('API Error:', response.status, errorData);
        return `API Error: ${response.status}. Please check your API key and try again.`;
      }

      const data = await response.json();
      if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
        let aiResponse = data.candidates[0].content.parts[0].text;
        aiResponse = aiResponse
          .replace(/```(\w+)?\n/g, '\n```$1\n')
          .replace(/```\n\n/g, '```\n')
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

  // ─────────────── Bubble Sort ─────────────────
  const bubbleSort = async () => {
    setIsSorting(true);
    stopRequested.current = false;
    let arr = [...array];
    const bars = document.getElementsByClassName('bar');

    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr.length - i - 1; j++) {
        if (stopRequested.current) {
          setIsSorting(false);
          return;
        }

        setCurrentStep(`Comparing elements at positions ${j} and ${j + 1}: ${arr[j]} and ${arr[j + 1]}`);
        bars[j].style.backgroundColor = 'red';
        bars[j + 1].style.backgroundColor = 'red';
        await sleep(speed);

        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          setArray([...arr]);
          setCurrentStep(`Swapped ${arr[j + 1]} and ${arr[j]} as they were out of order`);
          await sleep(speed);
        }

        bars[j].style.backgroundColor = '#4ade80';
        bars[j + 1].style.backgroundColor = '#4ade80';
      }
      bars[arr.length - i - 1].style.backgroundColor = '#60a5fa';
      setCurrentStep(`Element at position ${arr.length - i - 1} is now in its final sorted position`);
      await sleep(speed);
    }

    setCurrentStep('Bubble Sort completed! Array is now sorted.');
    setIsSorting(false);
  };

  // ──────────── Selection Sort ────────────────
  const selectionSort = async () => {
    setIsSorting(true);
    stopRequested.current = false;
    let arr = [...array];
    const bars = document.getElementsByClassName('bar');

    for (let i = 0; i < arr.length; i++) {
      let minIdx = i;
      setCurrentStep(`Finding minimum element in unsorted portion starting from position ${i}`);
      await sleep(speed);

      for (let j = i + 1; j < arr.length; j++) {
        if (stopRequested.current) {
          setIsSorting(false);
          return;
        }

        bars[j].style.backgroundColor = 'red';
        bars[minIdx].style.backgroundColor = 'yellow';
        await sleep(speed);

        if (arr[j] < arr[minIdx]) {
          minIdx = j;
          setCurrentStep(`Found new minimum: ${arr[j]} at position ${j}`);
          await sleep(speed);
        }

        bars[j].style.backgroundColor = '#4ade80';
        bars[minIdx].style.backgroundColor = '#4ade80';
      }

      if (minIdx !== i) {
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        setArray([...arr]);
        setCurrentStep(`Placing minimum element ${arr[i]} at position ${i}`);
        await sleep(speed);
      }
      bars[i].style.backgroundColor = '#60a5fa';
    }

    setCurrentStep('Selection Sort completed! Array is now sorted.');
    setIsSorting(false);
  };

  // ──────────── Insertion Sort ───────────────
  const insertionSort = async () => {
    setIsSorting(true);
    stopRequested.current = false;
    let arr = [...array];
    const bars = document.getElementsByClassName('bar');

    for (let i = 1; i < arr.length; i++) {
      let key = arr[i];
      let j = i - 1;

      setCurrentStep(`Inserting element ${key} into its correct position in the sorted portion`);
      await sleep(speed);

      while (j >= 0 && arr[j] > key) {
        if (stopRequested.current) {
          setIsSorting(false);
          return;
        }

        bars[j].style.backgroundColor = 'red';
        bars[j + 1].style.backgroundColor = 'yellow';
        await sleep(speed);

        arr[j + 1] = arr[j];
        setArray([...arr]);
        setCurrentStep(`Shifting ${arr[j]} one position to the right`);
        await sleep(speed);

        bars[j].style.backgroundColor = '#4ade80';
        bars[j + 1].style.backgroundColor = '#4ade80';
        j--;
      }

      arr[j + 1] = key;
      setArray([...arr]);
      setCurrentStep(`Placed ${key} in its correct position`);
      await sleep(speed);

      bars[i].style.backgroundColor = '#60a5fa';
    }

    setCurrentStep('Insertion Sort completed! Array is now sorted.');
    setIsSorting(false);
  };

  // ───────────── Merge Sort ──────────────────
  const mergeSort = async () => {
    setIsSorting(true);
    stopRequested.current = false;
    const arrCopy = [...array];
    const bars = document.getElementsByClassName('bar');

    const merge = async (left, mid, right) => {
      let i = left;
      let j = mid + 1;
      const temp = [];

      while (i <= mid && j <= right) {
        if (stopRequested.current) {
          setIsSorting(false);
          return;
        }
        // Highlight comparisons
        bars[i].style.backgroundColor = 'red';
        bars[j].style.backgroundColor = 'red';
        setCurrentStep(`Comparing ${arrCopy[i]} and ${arrCopy[j]} for merge`);
        await sleep(speed);

        if (arrCopy[i] <= arrCopy[j]) {
          temp.push(arrCopy[i++]);
        } else {
          temp.push(arrCopy[j++]);
        }

        // Restore colors
        bars[i - 1 >= left ? i - 1 : left].style.backgroundColor = '#4ade80';
        bars[j - 1 >= mid + 1 ? j - 1 : mid + 1].style.backgroundColor = '#4ade80';
        await sleep(speed);
      }

      while (i <= mid) {
        if (stopRequested.current) {
          setIsSorting(false);
          return;
        }
        bars[i].style.backgroundColor = 'red';
        setCurrentStep(`Moving ${arrCopy[i]} into merged array`);
        await sleep(speed);

        temp.push(arrCopy[i++]);
        bars[i - 1].style.backgroundColor = '#4ade80';
        await sleep(speed);
      }

      while (j <= right) {
        if (stopRequested.current) {
          setIsSorting(false);
          return;
        }
        bars[j].style.backgroundColor = 'red';
        setCurrentStep(`Moving ${arrCopy[j]} into merged array`);
        await sleep(speed);

        temp.push(arrCopy[j++]);
        bars[j - 1].style.backgroundColor = '#4ade80';
        await sleep(speed);
      }

      for (let k = left; k <= right; k++) {
        arrCopy[k] = temp[k - left];
        setArray([...arrCopy]);
        bars[k].style.backgroundColor = '#60a5fa';
        setCurrentStep(`Placed ${arrCopy[k]} at position ${k}`);
        await sleep(speed);
      }
    };

    const mergeSortHelper = async (left, right) => {
      if (left >= right) return;
      const mid = Math.floor((left + right) / 2);

      setCurrentStep(`Dividing array indices [${left}..${right}] at mid ${mid}`);
      await sleep(speed);

      await mergeSortHelper(left, mid);
      await mergeSortHelper(mid + 1, right);
      await merge(left, mid, right);
    };

    await mergeSortHelper(0, arrCopy.length - 1);
    setCurrentStep('Merge Sort completed! Array is now sorted.');
    setIsSorting(false);
  };

  // ────────────── Heap Sort ──────────────────
  const heapSort = async () => {
    setIsSorting(true);
    stopRequested.current = false;
    let arr = [...array];
    const bars = document.getElementsByClassName('bar');
    const n = arr.length;

    // Helper: “heapify” subtree rooted at i, size = heapSize
    const heapify = async (i, heapSize) => {
      let largest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;

      // If left child is larger
      if (left < heapSize) {
        bars[left].style.backgroundColor = 'red';
        bars[largest].style.backgroundColor = 'yellow';
        setCurrentStep(`Comparing ${arr[left]} (left child) and ${arr[largest]} (current largest)`);
        await sleep(speed);

        if (arr[left] > arr[largest]) {
          largest = left;
          setCurrentStep(`New largest is ${arr[largest]} at index ${largest}`);
          await sleep(speed);
        }

        bars[left].style.backgroundColor = '#4ade80';
        bars[i].style.backgroundColor = '#4ade80';
      }

      // If right child is larger
      if (right < heapSize) {
        bars[right].style.backgroundColor = 'red';
        bars[largest].style.backgroundColor = 'yellow';
        setCurrentStep(`Comparing ${arr[right]} (right child) and ${arr[largest]} (current largest)`);
        await sleep(speed);

        if (arr[right] > arr[largest]) {
          largest = right;
          setCurrentStep(`New largest is ${arr[largest]} at index ${largest}`);
          await sleep(speed);
        }

        bars[right].style.backgroundColor = '#4ade80';
        bars[largest === right ? right : i].style.backgroundColor = '#4ade80';
      }

      // If root is not largest, swap and continue heapifying
      if (largest !== i) {
        if (stopRequested.current) {
          setIsSorting(false);
          return;
        }

        setCurrentStep(`Swapping ${arr[i]} (index ${i}) with ${arr[largest]} (index ${largest})`);
        bars[i].style.backgroundColor = 'red';
        bars[largest].style.backgroundColor = 'red';
        await sleep(speed);

        [arr[i], arr[largest]] = [arr[largest], arr[i]];
        setArray([...arr]);
        await sleep(speed);

        bars[i].style.backgroundColor = '#4ade80';
        bars[largest].style.backgroundColor = '#4ade80';
        await heapify(largest, heapSize);
      }
    };

    // 1) Build Max-Heap
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      if (stopRequested.current) {
        setIsSorting(false);
        return;
      }
      setCurrentStep(`Building max-heap: heapifying at index ${i}`);
      await heapify(i, n);
    }

    // 2) One by one extract an element from heap
    for (let end = n - 1; end > 0; end--) {
      if (stopRequested.current) {
        setIsSorting(false);
        return;
      }

      setCurrentStep(`Swapping root ${arr[0]} with element at position ${end} (${arr[end]})`);
      bars[0].style.backgroundColor = 'red';
      bars[end].style.backgroundColor = 'red';
      await sleep(speed);

      // Move current root to end
      [arr[0], arr[end]] = [arr[end], arr[0]];
      setArray([...arr]);
      await sleep(speed);

      bars[end].style.backgroundColor = '#60a5fa'; // Mark as “sorted”
      bars[0].style.backgroundColor = '#4ade80';
      await heapify(0, end);
    }

    // Finally, the single remaining element is in place
    bars[0].style.backgroundColor = '#60a5fa';
    setCurrentStep('Heap Sort completed! Array is now sorted.');
    setIsSorting(false);
  };

  // ─────────── Invoker ───────────────
  const handleSortStart = async () => {
    if (isSorting) return;

    switch (selectedAlgorithm) {
      case 'bubbleSort':
        await bubbleSort();
        break;
      case 'selectionSort':
        await selectionSort();
        break;
      case 'insertionSort':
        await insertionSort();
        break;
      case 'mergeSort':
        await mergeSort();
        break;
      case 'heapSort':
        await heapSort();
        break;
      default:
        break;
    }
  };

  // ─────────── Messaging / AI Chat ─────────────
  const handleUserMessage = async () => {
    if (!userMessage.trim() || isLoading) return;

    const message = userMessage.trim();
    setUserMessage('');
    
    setChatMessages(prev => [
      ...prev,
      {
        type: 'user',
        content: message,
        timestamp: new Date().toISOString()
      }
    ]);

    setIsLoading(true);
    const aiResponse = await sendToGemini(message);
    setChatMessages(prev => [
      ...prev,
      {
        type: 'ai',
        content: aiResponse,
        timestamp: new Date().toISOString()
      }
    ]);
    setIsLoading(false);
  };

  return (
    <div className="visualizer-container">
      <h2>Sorting Visualizer</h2>
      
      {/* Current Step Display */}
      <div className="current-step">
        <strong>Current Step:</strong> {currentStep}
      </div>

      <div className="controls">
        <input
          type="text"
          placeholder="Enter numbers separated by commas"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          disabled={isSorting}
        />
        <button onClick={handleCustomInput} disabled={isSorting}>
          Use Custom Array
        </button>
        <button onClick={generateRandomArray} disabled={isSorting}>
          Generate Random Array
        </button>

        <div className="slider-group">
          <label>Array Size: {arraySize}</label>
          <input
            type="range"
            min="5"
            max="100"
            value={arraySize}
            onChange={(e) => setArraySize(Number(e.target.value))}
            disabled={isSorting}
          />
        </div>

        <div className="slider-group">
          <label>Speed: {speed} ms</label>
          <input
            type="range"
            min="10"
            max="2000"
            step="10"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
        </div>

        <div className="slider-group">
          <label>Sort Algorithm:</label>
          <select
            value={selectedAlgorithm}
            onChange={(e) => setSelectedAlgorithm(e.target.value)}
            disabled={isSorting}
          >
            <option value="bubbleSort">Bubble Sort</option>
            <option value="selectionSort">Selection Sort</option>
            <option value="insertionSort">Insertion Sort</option>
            <option value="mergeSort">Merge Sort</option>
            <option value="heapSort">Heap Sort</option> {/* NEW */}
          </select>
        </div>

        <button onClick={handleSortStart} disabled={isSorting}>
          Start Sorting
        </button>
      </div>

      <div className="bars-container">
        {array.map((value, idx) => (
          <div
            key={idx}
            className="bar"
            style={{
              height: `${value * 3}px`,
              width: `${Math.max(5, 1000 / array.length)}px`,
              transition: `height ${speed / 1000}s ease, background-color 0.2s`,
            }}
          >
            <span className="bar-label">{value}</span>
          </div>
        ))}
      </div>

      {/* AI Chat Section */}
      <div className="ai-chat-container">
        <h3>🤖 AI Assistant</h3>
        <div className="chat-messages">
          {chatMessages.length === 0 && (
            <div className="welcome-message">
              <p>👋 Hi! I'm your AI assistant. Ask me anything about sorting algorithms!</p>
              <p>I'll also explain each step as we sort the array.</p>
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
            placeholder="Ask about sorting algorithms..."
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
    </div>
  );
}

export default SortingVisualizer;

import React, { useState, useEffect, useRef } from 'react';
import './GraphVisualizer.css';


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

// Node component
const Node = ({ id, x, y, visited, distance, isStart }) => (
  <div
    className={`node ${visited ? 'visited' : ''} ${isStart ? 'start' : ''}`}
    style={{ left: `${x}px`, top: `${y}px` }}
  >
    <div className="node-id">{id}</div>
    {distance !== undefined && distance !== Infinity && 
      <div className="node-distance">{distance}</div>
    
    }
  </div>
);

// Edge component
const Edge = ({ from, to, weight, active }) => {
  const fromX = from.x + 25; // Adjust for new node size
  const fromY = from.y + 25;
  const toX = to.x + 25;
  const toY = to.y + 25;
  
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  // Position weight label with better offset
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  
  return (
    <>
      <div 
        className={`edge ${active ? 'active' : ''}`} 
        style={{
          width: `${length}px`,
          transform: `rotate(${angle}deg)`,
          top: `${fromY}px`,
          left: `${fromX}px`,
          transformOrigin: '0 0',
          position: 'absolute'
        }}
      ></div>
      <div 
        className="edge-weight"
        style={{
          top: `${midY - 14}px`, // Adjust for new size
          left: `${midX - 14}px`,
        }}
      >
        {weight}
      </div>
    </>
  );
};
// Info panel component to show algorithm details
const InfoPanel = ({ algorithm, currentStep, visitedNodes, distances }) => {
  const getAlgorithmDescription = () => {
    switch(algorithm) {
      case 'bfs':
        return "Breadth-First Search traverses the graph level by level, visiting all neighbors of a node before moving to the next level. It finds the shortest path in terms of the number of edges.";
      case 'dfs':
        return "Depth-First Search explores as far as possible along each branch before backtracking. It's useful for traversing all nodes and finding paths.";
      case 'dijkstra':
        return "Dijkstra's Algorithm finds the shortest path between nodes in a graph with non-negative edge weights by maintaining a priority queue of nodes sorted by their distance from the start node.";
      default:
        return "Select an algorithm to see its description.";
    }
  };

  return (
    <div className="info-panel">
      <h3>{algorithm ? `${algorithm.toUpperCase()} Algorithm` : 'Algorithm Details'}</h3>
      <p>{getAlgorithmDescription()}</p>
      {currentStep && (
        <div className="current-step">
          <h4>Current Step:</h4>
          <p>{currentStep}</p>
        </div>
      )}
      {visitedNodes.length > 0 && (
        <div className="visited-order">
          <h4>Visited Order:</h4>
          <p>{visitedNodes.join(' → ')}</p>
        </div>
      )}
      {distances && Object.keys(distances).length > 0 && (
        <div className="distances">
          <h4>Shortest Distances:</h4>
          <ul>
            {Object.entries(distances).map(([node, dist]) => (
              <li key={node}>{node}: {dist === Infinity ? '∞' : dist}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// GraphVisualizer component
const GraphVisualizer = () => {
  const defaultNodeCount = 7;
  
  // Generate initial nodes in a circle layout
  // Generate initial nodes in a circle layout
const generateNodes = (count) => {
  const nodes = [];
  
  if (count <= 8) {
    // Circular layout for smaller graphs
    const centerX = 350;
    const centerY = 220;
    const radius = 180;
    
    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI) / count - Math.PI / 2; // Start from top
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      nodes.push({
        id: String.fromCharCode(65 + i),
        x,
        y,
        visited: false,
        distance: undefined,
      });
    }
  } else {
    // Grid layout for larger graphs
    const cols = Math.ceil(Math.sqrt(count));
    const spacing = 100;
    const startX = 100;
    const startY = 80;
    
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      nodes.push({
        id: String.fromCharCode(65 + i),
        x: startX + col * spacing,
        y: startY + row * spacing,
        visited: false,
        distance: undefined,
      });
    }
  }
  return nodes;
};

// Generate edges based on nodes - creates a more logical graph structure
const generateEdges = (nodes) => {
  const edges = [];
  const nodeCount = nodes.length;
  const edgeSet = new Set(); // To avoid duplicate edges
  
  // Helper function to add edge (avoiding duplicates)
  const addEdge = (from, to, weight) => {
    const edgeKey1 = `${from}-${to}`;
    const edgeKey2 = `${to}-${from}`;
    
    if (!edgeSet.has(edgeKey1) && !edgeSet.has(edgeKey2)) {
      edges.push({
        from: from,
        to: to,
        weight: weight,
        active: false
      });
      edgeSet.add(edgeKey1);
      edgeSet.add(edgeKey2);
    }
  };
  
  if (nodeCount <= 4) {
    // For small graphs: connect each node to every other node (complete graph)
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        addEdge(
          nodes[i].id, 
          nodes[j].id, 
          Math.floor(Math.random() * 5) + 1
        );
      }
    }
  } else if (nodeCount <= 8) {
    // For medium graphs: create a connected graph with some structure
    
    // First, create a spanning tree to ensure connectivity
    for (let i = 1; i < nodeCount; i++) {
      addEdge(
        nodes[i].id,
        nodes[Math.floor(i / 2)].id, // Connect to parent in tree structure
        Math.floor(Math.random() * 5) + 1
      );
    }
    
    // Add some additional edges for more interesting paths
    for (let i = 0; i < nodeCount; i++) {
      // Connect to next node in sequence (with wraparound)
      const nextIndex = (i + 1) % nodeCount;
      addEdge(
        nodes[i].id,
        nodes[nextIndex].id,
        Math.floor(Math.random() * 5) + 1
      );
      
      // Connect to node two positions ahead (if exists)
      if (i + 2 < nodeCount) {
        addEdge(
          nodes[i].id,
          nodes[i + 2].id,
          Math.floor(Math.random() * 5) + 1
        );
      }
    }
    
    // Add a few random connections
    const extraEdges = Math.min(3, Math.floor(nodeCount / 2));
    for (let i = 0; i < extraEdges; i++) {
      const from = Math.floor(Math.random() * nodeCount);
      let to = Math.floor(Math.random() * nodeCount);
      while (to === from) {
        to = Math.floor(Math.random() * nodeCount);
      }
      addEdge(
        nodes[from].id,
        nodes[to].id,
        Math.floor(Math.random() * 5) + 1
      );
    }
  } else {
    // For larger graphs: grid-like structure
    const cols = Math.ceil(Math.sqrt(nodeCount));
    
    for (let i = 0; i < nodeCount; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      
      // Connect to right neighbor
      if (col < cols - 1 && i + 1 < nodeCount) {
        addEdge(
          nodes[i].id,
          nodes[i + 1].id,
          Math.floor(Math.random() * 5) + 1
        );
      }
      
      // Connect to bottom neighbor
      if (row < Math.floor((nodeCount - 1) / cols) && i + cols < nodeCount) {
        addEdge(
          nodes[i].id,
          nodes[i + cols].id,
          Math.floor(Math.random() * 5) + 1
        );
      }
      
      // Add some diagonal connections for more interesting paths
      if (col < cols - 1 && i + cols + 1 < nodeCount && Math.random() < 0.3) {
        addEdge(
          nodes[i].id,
          nodes[i + cols + 1].id,
          Math.floor(Math.random() * 5) + 1
        );
      }
    }
    
    // Add some random long-distance connections
    const longEdges = Math.min(nodeCount / 3, 5);
    for (let i = 0; i < longEdges; i++) {
      const from = Math.floor(Math.random() * nodeCount);
      let to = Math.floor(Math.random() * nodeCount);
      while (to === from) {
        to = Math.floor(Math.random() * nodeCount);
      }
      addEdge(
        nodes[from].id,
        nodes[to].id,
        Math.floor(Math.random() * 5) + 1
      );
    }
  }
  
  return edges;
};
  const [nodeCount, setNodeCount] = useState(defaultNodeCount);
  const [nodes, setNodes] = useState(generateNodes(defaultNodeCount));
  const [edges, setEdges] = useState(generateEdges(generateNodes(defaultNodeCount)));
  const [startNode, setStartNode] = useState('A');
  const [algorithm, setAlgorithm] = useState('');
  const [currentStep, setCurrentStep] = useState('');
  const [visitedOrder, setVisitedOrder] = useState([]);
  const [distances, setDistances] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  // AI Chat states
  const [chatMessages, setChatMessages] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  const [bfsQueue, setBfsQueue] = useState([]);
  const [dfsStack, setDfsStack] = useState([]);


  useEffect(() => {
    regenerateGraph(nodeCount);
  }, [nodeCount]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendToGemini = async (message) => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      return "Please add your Gemini API key to enable AI features.";
    }

    try {
      // Enhanced context with better structure and instructions
      const context = `You are an expert computer science tutor specializing in graph algorithms and data structures. 

CURRENT CONTEXT:
- Number of nodes: ${nodes.length}
- Current algorithm: ${algorithm || 'None selected'}
- Start node: ${startNode}
- Current step: ${currentStep}
- Visited order: ${visitedOrder.join(' → ')}
- Graph structure: ${nodes.map(n => n.id).join(', ')} nodes
- Algorithm status: ${isRunning ? 'Currently running' : 'Ready to run'}

USER QUESTION: ${message}

RESPONSE GUIDELINES:
1. If asked for code, provide clean, well-commented code with proper formatting
2. Use markdown formatting for code blocks with \`\`\`language tags
3. Explain graph algorithms step-by-step with clear examples
4. Include time and space complexity when relevant
5. Be educational but conversational
6. For code requests, provide complete, runnable implementations
7. Use proper indentation and code structure
8. Add explanatory comments in code
9. Focus on graph algorithms like BFS, DFS, Dijkstra, A*, etc.

Please provide a comprehensive, well-formatted response that helps the user understand graph algorithms better.`;

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

  const regenerateGraph = (count) => {
    const newNodes = generateNodes(count);
    setNodes(newNodes);
    setEdges(generateEdges(newNodes));
    setStartNode('A');
    resetState();
  };

  const resetState = () => {
    setNodes(prev => prev.map(n => ({ ...n, visited: false, distance: undefined })));
    setEdges(prev => prev.map(e => ({ ...e, active: false })));
    setCurrentStep('');
    setVisitedOrder([]);
    setDistances({});
    //setAlgorithm('');
    setBfsQueue([]);
    setDfsStack([]);
  };

  const markVisited = async (id, distance = undefined) => {
    setNodes(prev =>
      prev.map(node =>
        node.id === id ? { ...node, visited: true, distance } : node
      )
    );
    setVisitedOrder(prev => [...prev, id]);
    // Show step information
    setCurrentStep(`Visiting node ${id}${distance !== undefined ? ` (distance: ${distance})` : ''}`);
    
    return new Promise(resolve => setTimeout(resolve, 1300)); // Slow down for better visualization
  };

  const markEdge = async (fromId, toId) => {
    setEdges(prev =>
      prev.map(edge =>
        (edge.from === fromId && edge.to === toId) || (edge.from === toId && edge.to === fromId)
          ? { ...edge, active: true }
          : edge
      )
    );
    setCurrentStep(`Exploring edge from ${fromId} to ${toId}`);
    
    return new Promise(resolve => setTimeout(resolve, 900));
  };

  const getNodeById = (id) => nodes.find(n => n.id === id);

  const getNeighbors = (id) => {
    return edges
      // Grab every edge where id is either the “from” or the “to” endpoint
      .filter(edge => edge.from === id || edge.to === id)
      // Map it to the *other* endpoint, carrying over the same weight
      .map(edge => ({
        id: edge.from === id ? edge.to : edge.from,
        weight: edge.weight
      }));
  };

  const bfs = async (startId) => {
    setIsRunning(true);
    resetState();
    setAlgorithm('bfs');
   
    
    const visited = new Set();
    const queue = [startId];
    setBfsQueue([...queue]);
    
    setCurrentStep(`Starting BFS from node ${startId}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    while (queue.length > 0) {
      setBfsQueue([...queue]);            // ← show before dequeue
      const current = queue.shift();
      setBfsQueue([...queue]);            // ← show after dequeue

      if (visited.has(current)) continue;
      visited.add(current);
      await markVisited(current);

      const neighbors = getNeighbors(current);
      for (let neighbor of neighbors) {
        if (!visited.has(neighbor.id)) {
          await markEdge(current, neighbor.id);
          queue.push(neighbor.id);
          setBfsQueue([...queue]);        // ← show after enqueue
        }
      }
    }
    
    setCurrentStep(`BFS traversal complete! Visited ${visited.size} nodes.`);
    setBfsQueue([]);   
    setIsRunning(false);
  };

  const dfs = async (startId) => {
    setIsRunning(true);
    resetState();
    setAlgorithm('dfs');

  
    const visited = new Set();
    setDfsStack([startId]);  
    setCurrentStep(`Starting DFS from node ${startId}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const dfsRecursive = async (nodeId) => {
      // push already handled by outer call, skip if visited
      if (visited.has(nodeId)) {
        setDfsStack(prev => prev.slice(0, -1)); // pop
        return;
      }

      visited.add(nodeId);
      await markVisited(nodeId);

      const neighbors = getNeighbors(nodeId);
      for (let neighbor of neighbors) {
        if (!visited.has(neighbor.id)) {
          setDfsStack(prev => [...prev, neighbor.id]); // push
          await markEdge(nodeId, neighbor.id);
          await dfsRecursive(neighbor.id);
        }
      }
      setDfsStack(prev => prev.slice(0, -1)); // pop on unwind
    };
    
    await dfsRecursive(startId);
    setCurrentStep(`DFS traversal complete! Visited ${visited.size} nodes.`);
    setDfsStack([]); 
    setIsRunning(false);
  };

  const dijkstra = async (startId) => {
  setIsRunning(true);
  resetState();
  setAlgorithm('dijkstra');
  
  
  const newDistances = {};
  const visited = new Set();
  const prev = {};
  
  // Initialize distances 
  nodes.forEach(node => {
    newDistances[node.id] = Infinity;
    prev[node.id] = null;
  });
  newDistances[startId] = 0;
  
  setDistances({...newDistances});
  setCurrentStep(`Starting Dijkstra's algorithm from node ${startId}`);
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Priority queue - start with just the start node
  const pq = [{ id: startId, dist: 0 }];
  
  while (pq.length > 0) {
    // Sort by distance to get the minimum
    pq.sort((a, b) => a.dist - b.dist);
    const { id: currentId, dist: currentDist } = pq.shift();
    
    // Skip if already visited
    if (visited.has(currentId)) continue;
    
    // Mark as visited
    visited.add(currentId);
    await markVisited(currentId, currentDist);
    
    const neighbors = getNeighbors(currentId);
    
    for (let neighbor of neighbors) {
      await markEdge(currentId, neighbor.id);
      
      // Skip if neighbor is already visited
      if (visited.has(neighbor.id)) continue;
      
      const newDist = currentDist + neighbor.weight;
      
      // If we found a shorter path, update it
      if (newDist < newDistances[neighbor.id]) {
        newDistances[neighbor.id] = newDist;
        prev[neighbor.id] = currentId;
        setDistances({...newDistances});
        
        // Add to priority queue
        pq.push({ id: neighbor.id, dist: newDist });
        
        setCurrentStep(
          `Found ${newDistances[neighbor.id] === Infinity ? 'path' : 'shorter path'} to ${neighbor.id} through ${currentId}. ` +
          `Distance: ${newDist}`
        );
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  setCurrentStep(`Dijkstra's algorithm complete! Found shortest paths from ${startId} to all reachable nodes.`);
  setIsRunning(false);
};

  return (
    <div className="graph-visualizer">
      <h2>Graph Algorithm Visualizer</h2>
      
      <div className="config-panel">
        <div className="config-group">
          <label>Number of Nodes:</label>
          <input 
            type="range" 
            min="4" 
            max="12" 
            value={nodeCount} 
            disabled={isRunning}
            onChange={(e) => setNodeCount(parseInt(e.target.value))} 
          />
          <span>{nodeCount}</span>
        </div>
        
        <div className="config-group">
          <label>Start Node:</label>
          <select 
            value={startNode} 
            onChange={(e) => setStartNode(e.target.value)}
            disabled={isRunning}
          >
            {nodes.map(node => (
              <option key={node.id} value={node.id}>{node.id}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="algorithm-controls">
  <button onClick={() => bfs(startNode)} disabled={isRunning}>Run BFS</button>
  <button onClick={() => dfs(startNode)} disabled={isRunning}>Run DFS</button>
  <button onClick={() => dijkstra(startNode)} disabled={isRunning}>Run Dijkstra</button>
  {/* <button onClick={() => window.open('/mst', '_blank')} disabled={isRunning} className="mst-button">
    🌳 Minimum Spanning Tree
  </button> */}
  <button onClick={resetState} disabled={isRunning}>Reset</button>
  <button onClick={() => regenerateGraph(nodeCount)} disabled={isRunning}>New Graph</button>
</div>
      
      <div className="visualization-container">
        <div className="graph-container">
          {edges.map((edge, index) => {
            const from = getNodeById(edge.from);
            const to = getNodeById(edge.to);
            if (from && to) {
              return <Edge key={index} from={from} to={to} weight={edge.weight} active={edge.active} />;
            }
            return null;
          })}
          {nodes.map((node) => (
            <Node 
              key={node.id} 
              {...node} 
              isStart={node.id === startNode}
            />
          ))}
        </div>
        
        <InfoPanel 
          algorithm={algorithm}
          currentStep={currentStep}
          visitedNodes={visitedOrder}
          distances={distances}
        />
      </div>

       {algorithm === 'bfs' && (
            <div className="queue-visualization">
              <h4>Queue:</h4>
              <p>[{bfsQueue.join(', ')}]</p>
            </div>
          )}
          {algorithm === 'dfs' && (
            <div className="stack-visualization">
              <h4>Call Stack:</h4>
              <p>[{dfsStack.join(' → ')}]</p>
            </div>
          )}

      {/* AI Chat Section */}
      <div className="ai-chat-container">
        <h3>🤖 AI Assistant</h3>
        <div className="chat-messages">
          {chatMessages.length === 0 && (
            <div className="welcome-message">
              <p>👋 Hi! I'm your AI assistant. Ask me anything about graph algorithms!</p>
              <p>I can help you understand BFS, DFS, Dijkstra's algorithm, and more.</p>
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
            placeholder="Ask about graph algorithms..."
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
};

export default GraphVisualizer;
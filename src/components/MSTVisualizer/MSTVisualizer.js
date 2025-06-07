import React, { useState, useEffect, useRef, useCallback } from 'react';
import './MSTVisualizer.css';

// Node component with enhanced styling
const MSTNode = ({ id, x, y, visited, inMST, isHighlighted }) => (
  <div
    className={`mst-node ${visited ? 'visited' : ''} ${inMST ? 'in-mst' : ''} ${isHighlighted ? 'highlighted' : ''}`}
    style={{ left: `${x}px`, top: `${y}px` }}
  >
    <div className="node-id">{id}</div>
    <div className="node-glow"></div>
  </div>
);

// Edge component with MST styling
const MSTEdge = ({ from, to, weight, active, inMST, isHighlighted }) => {
  const fromX = from.x + 30;
  const fromY = from.y + 30;
  const toX = to.x + 30;
  const toY = to.y + 30;
  
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;
  
  return (
    <>
      <div 
        className={`mst-edge ${active ? 'active' : ''} ${inMST ? 'in-mst' : ''} ${isHighlighted ? 'highlighted' : ''}`}
        style={{
          width: `${length}px`,
          transform: `rotate(${angle}deg)`,
          top: `${fromY}px`,
          left: `${fromX}px`,
          transformOrigin: '0 0',
          position: 'absolute'
        }}
      >
        <div className="edge-glow"></div>
      </div>
      <div 
        className={`mst-edge-weight ${inMST ? 'in-mst' : ''} ${isHighlighted ? 'highlighted' : ''}`}
        style={{
          top: `${midY - 16}px`,
          left: `${midX - 16}px`,
        }}
      >
        {weight}
      </div>
    </>
  );
};

// Stats Panel Component
const StatsPanel = ({ algorithm, totalCost, edgesInMST, totalEdges, currentStep }) => (
  <div className="stats-panel">
    <h3>🌳 MST Statistics</h3>
    <div className="stat-item">
      <span className="stat-label">Algorithm:</span>
      <span className="stat-value">{algorithm || 'None'}</span>
    </div>
    <div className="stat-item">
      <span className="stat-label">Total Cost:</span>
      <span className="stat-value cost">{totalCost}</span>
    </div>
    <div className="stat-item">
      <span className="stat-label">Edges in MST:</span>
      <span className="stat-value">{edgesInMST}/{totalEdges}</span>
    </div>
    <div className="progress-bar">
      <div 
        className="progress-fill"
        style={{ width: `${(edgesInMST / Math.max(totalEdges - 1, 1)) * 100}%` }}
      ></div>
    </div>
    {currentStep && (
      <div className="current-step">
        <h4>Current Step:</h4>
        <p>{currentStep}</p>
      </div>
    )}
  </div>
);

// Algorithm Info Panel
const AlgorithmInfo = ({ algorithm }) => {
  const getInfo = () => {
    switch(algorithm) {
      case 'prim':
        return {
          title: "Prim's Algorithm",
          description: "Starts with a single vertex and grows the MST by adding the minimum weight edge that connects the MST to a vertex not yet in the MST.",
          complexity: "Time: O(V²) or O(E log V) with priority queue",
          characteristics: ["Greedy approach", "Vertex-based", "Always connected"]
        };
      case 'kruskal':
        return {
          title: "Kruskal's Algorithm",
          description: "Sorts all edges by weight and adds them to the MST if they don't create a cycle, using Union-Find data structure.",
          complexity: "Time: O(E log E) for sorting edges",
          characteristics: ["Greedy approach", "Edge-based", "Forest of trees"]
        };
      default:
        return {
          title: "Minimum Spanning Tree",
          description: "A spanning tree of a graph with minimum total edge weight. Both Prim's and Kruskal's algorithms find the MST using greedy approaches.",
          complexity: "Both algorithms have efficient implementations",
          characteristics: ["Connects all vertices", "No cycles", "Minimum total weight"]
        };
    }
  };

  const info = getInfo();

  return (
    <div className="algorithm-info">
      <h3>{info.title}</h3>
      <p className="description">{info.description}</p>
      <div className="complexity">
        <strong>Complexity:</strong> {info.complexity}
      </div>
      <div className="characteristics">
        <strong>Key Features:</strong>
        <ul>
          {info.characteristics.map((char, idx) => (
            <li key={idx}>{char}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const MSTVisualizer = () => {
  // Generate nodes in a more spread out pattern
  const generateNodes = (count) => {
    const nodes = [];
    const centerX = 400;
    const centerY = 250;
    
    if (count <= 8) {
      // Circular layout
      const radius = 150;
      for (let i = 0; i < count; i++) {
        const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        nodes.push({
          id: String.fromCharCode(65 + i),
          x,
          y,
          visited: false,
          inMST: false,
          isHighlighted: false
        });
      }
    } else {
      // Grid layout for larger graphs
      const cols = Math.ceil(Math.sqrt(count));
      const spacing = 120;
      const startX = centerX - (cols * spacing) / 2;
      const startY = centerY - (Math.ceil(count / cols) * spacing) / 2;
      
      for (let i = 0; i < count; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        nodes.push({
          id: String.fromCharCode(65 + i),
          x: startX + col * spacing,
          y: startY + row * spacing,
          visited: false,
          inMST: false,
          isHighlighted: false
        });
      }
    }
    
    return nodes;
  };

  // Generate edges with better connectivity
  const generateEdges = (nodes) => {
    const edges = [];
    const nodeCount = nodes.length;
    
    // Create a connected graph with varied weights
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const distance = Math.sqrt(
          Math.pow(nodes[i].x - nodes[j].x, 2) + 
          Math.pow(nodes[i].y - nodes[j].y, 2)
        );
        
        // Add edges based on distance (create more realistic weights)
        if (distance < 200 || Math.random() < 0.3) {
          edges.push({
            from: nodes[i].id,
            to: nodes[j].id,
            weight: Math.floor(Math.random() * 9) + 1,
            active: false,
            inMST: false,
            isHighlighted: false
          });
        }
      }
    }
    
    // Ensure connectivity
    for (let i = 0; i < nodeCount - 1; i++) {
      const edgeExists = edges.some(e => 
        (e.from === nodes[i].id && e.to === nodes[i + 1].id) ||
        (e.from === nodes[i + 1].id && e.to === nodes[i].id)
      );
      
      if (!edgeExists) {
        edges.push({
          from: nodes[i].id,
          to: nodes[i + 1].id,
          weight: Math.floor(Math.random() * 5) + 1,
          active: false,
          inMST: false,
          isHighlighted: false
        });
      }
    }
    
    return edges;
  };

  const [nodeCount, setNodeCount] = useState(6);
  const [nodes, setNodes] = useState(generateNodes(6));
  const [edges, setEdges] = useState([]);
  const [algorithm, setAlgorithm] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [totalCost, setTotalCost] = useState(0);
  const [mstEdges, setMstEdges] = useState([]);
  const [speed, setSpeed] = useState(1000);

  // Use refs to avoid stale closure issues
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const mstEdgesRef = useRef(mstEdges);
  const totalCostRef = useRef(totalCost);

  // Update refs when state changes
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  useEffect(() => {
    mstEdgesRef.current = mstEdges;
  }, [mstEdges]);

  useEffect(() => {
    totalCostRef.current = totalCost;
  }, [totalCost]);

  useEffect(() => {
    const newNodes = generateNodes(nodeCount);
    const newEdges = generateEdges(newNodes);
    setNodes(newNodes);
    setEdges(newEdges);
    resetVisualization();
  }, [nodeCount]);

  const resetVisualization = useCallback(() => {
    setNodes(prev => prev.map(n => ({ ...n, visited: false, inMST: false, isHighlighted: false })));
    setEdges(prev => prev.map(e => ({ ...e, active: false, inMST: false, isHighlighted: false })));
    setCurrentStep('');
    setTotalCost(0);
    setMstEdges([]);
    setAlgorithm('');
    setIsRunning(false);
  }, []);

  // NEW: scale the step-delay by speed/1000
  const sleep = (ms) =>
    new Promise(resolve =>
      setTimeout(resolve, ms * (speed / 1000))
    );


  const highlightEdge = useCallback(async (fromId, toId, highlight = true) => {
    setEdges(prev => prev.map(edge => 
      ((edge.from === fromId && edge.to === toId) || (edge.from === toId && edge.to === fromId))
        ? { ...edge, isHighlighted: highlight }
        : edge
    ));
    await sleep(300);
  }, [sleep]);

  const addToMST = useCallback(async (fromId, toId, weight) => {
    // Highlight the edge being added
    await highlightEdge(fromId, toId, true);
    await sleep(500);
    
    setEdges(prev => prev.map(edge => 
      ((edge.from === fromId && edge.to === toId) || (edge.from === toId && edge.to === fromId))
        ? { ...edge, inMST: true, isHighlighted: false }
        : edge
    ));
    
    setNodes(prev => prev.map(node => 
      (node.id === fromId || node.id === toId) 
        ? { ...node, inMST: true }
        : node
    ));
    
    setMstEdges(prev => [...prev, { from: fromId, to: toId, weight }]);
    setTotalCost(prev => prev + weight);
    
    await sleep(800);
  }, [highlightEdge, sleep]);

  // Prim's Algorithm Implementation
  const runPrim = useCallback(async () => {
    if (isRunning) return; // Prevent multiple executions
    
    setIsRunning(true);
    setAlgorithm('prim');
    
    // Reset everything first
    setNodes(prev => prev.map(n => ({ ...n, visited: false, inMST: false, isHighlighted: false })));
    setEdges(prev => prev.map(e => ({ ...e, active: false, inMST: false, isHighlighted: false })));
    setCurrentStep('');
    setTotalCost(0);
    setMstEdges([]);
    
    // Small delay to ensure state is updated
    await sleep(100);
    
    const visited = new Set();
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    const startNode = currentNodes[0].id;
    visited.add(startNode);
    
    setNodes(prev => prev.map(n => 
      n.id === startNode ? { ...n, inMST: true, visited: true } : n
    ));
    
    setCurrentStep(`Starting Prim's algorithm from node ${startNode}`);
    await sleep(1000);
    
    while (visited.size < currentNodes.length) {
      let minEdge = null;
      let minWeight = Infinity;
      
      // Clear previous highlights
      setEdges(prev => prev.map(e => ({ ...e, isHighlighted: false })));
      await sleep(200);
      
      // Find minimum weight edge crossing the cut
      for (const edge of currentEdges) {
        const fromInMST = visited.has(edge.from);
        const toInMST = visited.has(edge.to);
        
        if ((fromInMST && !toInMST) || (!fromInMST && toInMST)) {
          await highlightEdge(edge.from, edge.to, true);
          await sleep(200);
          
          if (edge.weight < minWeight) {
            if (minEdge) {
              await highlightEdge(minEdge.from, minEdge.to, false);
            }
            minEdge = edge;
            minWeight = edge.weight;
            setCurrentStep(`Found edge ${edge.from}-${edge.to} with weight ${edge.weight}`);
          } else {
            await highlightEdge(edge.from, edge.to, false);
          }
        }
      }
      
      if (minEdge) {
        const newNode = visited.has(minEdge.from) ? minEdge.to : minEdge.from;
        visited.add(newNode);
        
        setCurrentStep(`Adding edge ${minEdge.from}-${minEdge.to} (weight: ${minWeight}) to MST`);
        await addToMST(minEdge.from, minEdge.to, minWeight);
      }
    }
    
    setCurrentStep(`Prim's algorithm complete! MST cost: ${totalCostRef.current}`);
    setIsRunning(false);
  }, [isRunning, highlightEdge, addToMST, sleep]);

  // Kruskal's Algorithm Implementation
  const runKruskal = useCallback(async () => {
    if (isRunning) return; // Prevent multiple executions
    
    setIsRunning(true);
    setAlgorithm('kruskal');
    
    // Reset everything first
    setNodes(prev => prev.map(n => ({ ...n, visited: false, inMST: false, isHighlighted: false })));
    setEdges(prev => prev.map(e => ({ ...e, active: false, inMST: false, isHighlighted: false })));
    setCurrentStep('');
    setTotalCost(0);
    setMstEdges([]);
    
    // Small delay to ensure state is updated
    await sleep(100);
    
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    
    // Union-Find data structure
    const parent = {};
    const rank = {};
    
    currentNodes.forEach(node => {
      parent[node.id] = node.id;
      rank[node.id] = 0;
    });
    
    const find = (x) => {
      if (parent[x] !== x) {
        parent[x] = find(parent[x]);
      }
      return parent[x];
    };
    
    const union = (x, y) => {
      const rootX = find(x);
      const rootY = find(y);
      
      if (rank[rootX] < rank[rootY]) {
        parent[rootX] = rootY;
      } else if (rank[rootX] > rank[rootY]) {
        parent[rootY] = rootX;
      } else {
        parent[rootY] = rootX;
        rank[rootX]++;
      }
    };
    
    // Sort edges by weight
    const sortedEdges = [...currentEdges].sort((a, b) => a.weight - b.weight);
    
    setCurrentStep("Kruskal's algorithm: Processing edges in order of weight");
    await sleep(1000);
    
    let edgesAdded = 0;
    
    for (const edge of sortedEdges) {
      if (edgesAdded >= currentNodes.length - 1) break;
      
      await highlightEdge(edge.from, edge.to, true);
      setCurrentStep(`Checking edge ${edge.from}-${edge.to} (weight: ${edge.weight})`);
      await sleep(800);
      
      const rootFrom = find(edge.from);
      const rootTo = find(edge.to);
      
      if (rootFrom !== rootTo) {
        setCurrentStep(`Adding edge ${edge.from}-${edge.to} to MST (no cycle formed)`);
        union(edge.from, edge.to);
        await addToMST(edge.from, edge.to, edge.weight);
        edgesAdded++;
      } else {
        setCurrentStep(`Rejecting edge ${edge.from}-${edge.to} (would create cycle)`);
        await sleep(600);
        await highlightEdge(edge.from, edge.to, false);
      }
    }
    
    setCurrentStep(`Kruskal's algorithm complete! MST cost: ${totalCostRef.current}`);
    setIsRunning(false);
  }, [isRunning, highlightEdge, addToMST, sleep]);

  return (
    <div className="mst-visualizer">
      <div className="header">
        <h1> Minimum Spanning Tree Visualizer</h1>
        <p>Explore Prim's and Kruskal's algorithms for finding minimum spanning trees</p>
      </div>
      
      <div className="controls-panel">
        <div className="control-group">
          <label>Nodes: {nodeCount}</label>
          <input 
            type="range" 
            min="4" 
            max="10" 
            value={nodeCount} 
            onChange={(e) => setNodeCount(parseInt(e.target.value))}
            disabled={isRunning}
          />
        </div>
        
        <div className="control-group">
          <label>Speed: {speed === 500 ? 'Fast' : speed === 1000 ? 'Normal' : 'Slow'}</label>
          <select 
            value={speed} 
            onChange={(e) => setSpeed(parseInt(e.target.value))}
            disabled={isRunning}
          >
            <option value="1500">Slow</option>
            <option value="1000">Normal</option>
            <option value="500">Fast</option>
          </select>
        </div>
      </div>
      
      <div className="algorithm-buttons">
        <button 
          onClick={runPrim} 
          disabled={isRunning}
          className="prim-button"
        >
          🌿 Run Prim's Algorithm
        </button>
        <button 
          onClick={runKruskal} 
          disabled={isRunning}
          className="kruskal-button"
        >
          🔗 Run Kruskal's Algorithm
        </button>
        <button 
          onClick={resetVisualization} 
          disabled={isRunning}
          className="reset-button"
        >
          🔄 Reset
        </button>
      </div>
      
      <div className="visualization-container">
        <div className="graph-container">
          <div className="graph-background">
            {edges.map((edge, index) => {
              const from = nodes.find(n => n.id === edge.from);
              const to = nodes.find(n => n.id === edge.to);
              if (from && to) {
                return (
                  <MSTEdge 
                    key={index} 
                    from={from} 
                    to={to} 
                    weight={edge.weight} 
                    active={edge.active}
                    inMST={edge.inMST}
                    isHighlighted={edge.isHighlighted}
                  />
                );
              }
              return null;
            })}
            {nodes.map((node) => (
              <MSTNode 
                key={node.id} 
                {...node}
              />
            ))}
          </div>
        </div>
        
        <div className="info-panel">
          <StatsPanel 
            algorithm={algorithm}
            totalCost={totalCost}
            edgesInMST={mstEdges.length}
            totalEdges={nodes.length - 1}
            currentStep={currentStep}
          />
          <AlgorithmInfo algorithm={algorithm} />
        </div>
      </div>
    </div>
  );
};

export default MSTVisualizer;
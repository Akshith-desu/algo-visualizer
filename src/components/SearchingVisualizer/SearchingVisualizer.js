import React, { useState, useEffect, useCallback } from 'react';
import './SearchingVisualizer.css';


function SearchingVisualizer() {
  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  const [array, setArray] = useState([]);
  const [target, setTarget] = useState('');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('linear');
  const [result, setResult] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [foundIndex, setFoundIndex] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [description, setDescription] = useState('');

  const generateRandomArray = useCallback(() => {
    const arr = Array.from({ length: 20 }, () => Math.floor(Math.random() * 100));
    arr.sort((a, b) => a - b); // For binary search and other sorted searches
    setArray(arr);
    setResult('');
    setHighlightIndex(null);
    setFoundIndex(null);
    setIsSearching(false);
    setDescription('Array generated. Start by entering a target and selecting an algorithm.');
  }, []);

  useEffect(() => {
    generateRandomArray();
  }, [generateRandomArray]);

  const handleSearch = async () => {
    if (isSearching || target === '') return;
    setIsSearching(true);
    setResult('');
    setHighlightIndex(null);
    setFoundIndex(null);
    setDescription('');

    const numTarget = parseInt(target);

    switch (selectedAlgorithm) {
      case 'linear':
        await linearSearch(numTarget);
        break;
      case 'binary':
        await binarySearch(numTarget);
        break;
      case 'jump':
        await jumpSearch(numTarget);
        break;
      case 'exponential':
        await exponentialSearch(numTarget);
        break;
      case 'interpolation':
        await interpolationSearch(numTarget);
        break;
      case 'fibonacci':
        await fibonacciSearch(numTarget);
        break;
      default:
        break;
    }

    setIsSearching(false);
  };

  const linearSearch = async (target) => {
    setDescription('Starting Linear Search...');
    for (let i = 0; i < array.length; i++) {
      setHighlightIndex(i);
      setDescription(`Checking index ${i}, value: ${array[i]}`);
      await delay(300);
      if (array[i] === target) {
        setFoundIndex(i);
        setResult(`Found at index ${i}`);
        setDescription(`Target found at index ${i}.`);
        return;
      }
    }
    setResult('Not Found');
    setDescription('Target not found.');
  };

  const binarySearch = async (target) => {
    setDescription('Starting Binary Search...');
    let left = 0, right = array.length - 1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      setHighlightIndex(mid);
      setDescription(`Checking index ${mid} (low = ${left}, high = ${right}), value: ${array[mid]}`);
      await delay(500);
      if (array[mid] === target) {
        setFoundIndex(mid);
        setResult(`Found at index ${mid}`);
        setDescription(`Target found at index ${mid}.`);
        return;
      } else if (array[mid] < target) {
        left = mid + 1;
        setDescription(`Target is greater than value at index ${mid}. Moving to the right half.`);
      } else {
        right = mid - 1;
        setDescription(`Target is less than value at index ${mid}. Moving to the left half.`);
      }
    }
    setResult('Not Found');
    setDescription('Target not found.');
  };

  const jumpSearch = async (target) => {
    setDescription('Starting Jump Search...');
    const n = array.length;
    const step = Math.floor(Math.sqrt(n));

    let prev = 0;
    let curr = Math.min(step, n) - 1;

    while (array[curr] < target) {
      prev = curr;
      curr = Math.min(curr + step, n) - 1;
      setHighlightIndex(curr);
      setDescription(`Jumped to index ${curr}, value: ${array[curr]}`);
      await delay(300);
      if (prev >= n) break;
    }

    if (array[curr] === target) {
      setFoundIndex(curr);
      setResult(`Found at index ${curr}`);
      setDescription(`Target found at index ${curr}.`);
    } else if (array[prev] === target) {
      setFoundIndex(prev);
      setResult(`Found at index ${prev}`);
      setDescription(`Target found at index ${prev}.`);
    } else {
      setResult('Not Found');
      setDescription('Target not found.');
    }
  };

  const exponentialSearch = async (target) => {
    setDescription('Starting Exponential Search...');
    if (array[0] === target) {
      setFoundIndex(0);
      setResult('Found at index 0');
      setDescription('Target found at index 0.');
      return;
    }

    let i = 1;
    while (i < array.length && array[i] <= target) {
      i *= 2;
      setHighlightIndex(i);
      setDescription(`Jumping to index ${i}, value: ${array[i]}`);
      await delay(500);
    }

    const left = Math.floor(i / 2);
    const right = Math.min(i, array.length - 1);

    const res = await binarySearchInRange(target, left, right);
    if (res !== -1) {
      setFoundIndex(res);
      setResult(`Found at index ${res}`);
      setDescription(`Target found at index ${res}.`);
    } else {
      setResult('Not Found');
      setDescription('Target not found.');
    }
  };

  const binarySearchInRange = async (target, left, right) => {
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      setHighlightIndex(mid);
      setDescription(`Checking index ${mid} (low = ${left}, high = ${right}), value: ${array[mid]}`);
      await delay(500);
      if (array[mid] === target) {
        return mid;
      } else if (array[mid] < target) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    return -1;
  };

  const interpolationSearch = async (target) => {
    setDescription('Starting Interpolation Search...');
    let low = 0, high = array.length - 1;

    while (low <= high && target >= array[low] && target <= array[high]) {
      const pos = Math.floor(low + ((target - array[low]) * (high - low)) / (array[high] - array[low]));
      setHighlightIndex(pos);
      setDescription(`Checking index ${pos} (low = ${low}, high = ${high}), value: ${array[pos]}`);
      await delay(500);

      if (array[pos] === target) {
        setFoundIndex(pos);
        setResult(`Found at index ${pos}`);
        setDescription(`Target found at index ${pos}.`);
        return;
      }

      if (array[pos] < target) {
        low = pos + 1;
      } else {
        high = pos - 1;
      }
    }
    setResult('Not Found');
    setDescription('Target not found.');
  };

  const fibonacciSearch = async (target) => {
    setDescription('Starting Fibonacci Search...');
    let fibMMm2 = 0;
    let fibMMm1 = 1;
    let fibM = fibMMm2 + fibMMm1;

    while (fibM < array.length) {
      fibMMm2 = fibMMm1;
      fibMMm1 = fibM;
      fibM = fibMMm2 + fibMMm1;
    }

    let offset = -1;

    while (fibM > 1) {
      const i = Math.min(offset + fibMMm2, array.length - 1);
      setHighlightIndex(i);
      setDescription(`Checking index ${i} (offset = ${offset}, fibMMm2 = ${fibMMm2}), value: ${array[i]}`);
      await delay(500);

      if (array[i] < target) {
        fibM = fibMMm1;
        fibMMm1 = fibMMm2;
        fibMMm2 = fibM - fibMMm1;
        offset = i;
      } else if (array[i] > target) {
        fibM = fibMMm2;
        fibMMm2 = fibMMm1 - fibMMm2;
        fibMMm1 = fibM - fibMMm2;
      } else {
        setFoundIndex(i);
        setResult(`Found at index ${i}`);
        setDescription(`Target found at index ${i}.`);
        return;
      }
    }

    if (array[offset + 1] === target) {
      setFoundIndex(offset + 1);
      setResult(`Found at index ${offset + 1}`);
      setDescription(`Target found at index ${offset + 1}.`);
    } else {
      setResult('Not Found');
      setDescription('Target not found.');
    }
  };

  return (
    <div className="search-container">
      <h1>🔍 Searching Visualizer</h1>
      <div className="controls">
        <input
          type="number"
          placeholder="Target"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        <select value={selectedAlgorithm} onChange={(e) => setSelectedAlgorithm(e.target.value)}>
          <option value="linear">Linear Search</option>
          <option value="binary">Binary Search</option>
          <option value="jump">Jump Search</option>
          <option value="exponential">Exponential Search</option>
          <option value="interpolation">Interpolation Search</option>
          <option value="fibonacci">Fibonacci Search</option>
        </select>
        <button onClick={handleSearch} disabled={isSearching}>Start Search</button>
        <button onClick={generateRandomArray}>Generate New Array</button>
      </div>

      <div className="array-container">
        {array.map((value, index) => (
          <div
            key={index}
            className={`array-bar 
              ${highlightIndex === index ? 'highlight' : ''} 
              ${foundIndex === index ? 'found' : ''}`}
            style={{ height: `${value * 2}px` }}
          >
            {value}
          </div>
        ))}
      </div>

      <div className="description">{description}</div>
      <div className="result">{result}</div>
    </div>
  );
}

export default SearchingVisualizer;

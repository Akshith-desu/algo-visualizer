import React, { useState, useEffect, useRef } from 'react';
import './SortingVisualizer.css';

function SortingVisualizer() {
  const [array, setArray] = useState([]);
  const [arraySize, setArraySize] = useState(20);
  const [customInput, setCustomInput] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [isSorting, setIsSorting] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('bubbleSort');

  const speedRef = useRef(200);
  const stopRequested = useRef(false);

  useEffect(() => {
    generateRandomArray();
  }, [arraySize]);

  const generateRandomArray = () => {
    stopRequested.current = true;
    const newArray = Array.from({ length: arraySize }, () => Math.floor(Math.random() * 100) + 1);
    setArray(newArray);
    setIsSorting(false);
  };

  const handleCustomInput = () => {
    if (isSorting) return;
    const parsedArray = customInput
      .split(',')
      .map(num => parseInt(num.trim()))
      .filter(num => !isNaN(num));
    if (parsedArray.length) setArray(parsedArray);
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const waitIfPaused = async () => {
    while (isPaused) {
      await sleep(50);
    }
  };

  // Bubble Sort Algorithm
  const bubbleSort = async () => {
    setIsSorting(true);
    stopRequested.current = false;
    let arr = [...array];
    const bars = document.getElementsByClassName('bar');

    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr.length - i - 1; j++) {
        if (stopRequested.current) return;
        await waitIfPaused();

        bars[j].style.backgroundColor = 'red';
        bars[j + 1].style.backgroundColor = 'red';

        await sleep(speedRef.current);

        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          setArray([...arr]);
        }

        bars[j].style.backgroundColor = '#4ade80';
        bars[j + 1].style.backgroundColor = '#4ade80';
      }
      bars[arr.length - i - 1].style.backgroundColor = '#60a5fa';
    }

    setIsSorting(false);
  };

  // Selection Sort Algorithm
  const selectionSort = async () => {
    setIsSorting(true);
    stopRequested.current = false;
    let arr = [...array];
    const bars = document.getElementsByClassName('bar');

    for (let i = 0; i < arr.length; i++) {
      let minIdx = i;
      for (let j = i + 1; j < arr.length; j++) {
        if (stopRequested.current) return;
        await waitIfPaused();

        bars[j].style.backgroundColor = 'red';
        bars[minIdx].style.backgroundColor = 'yellow';
        
        await sleep(speedRef.current);

        if (arr[j] < arr[minIdx]) {
          minIdx = j;
        }

        bars[j].style.backgroundColor = '#4ade80';
        bars[minIdx].style.backgroundColor = '#4ade80';
      }

      if (minIdx !== i) {
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        setArray([...arr]);
      }
      bars[i].style.backgroundColor = '#60a5fa';
    }

    setIsSorting(false);
  };

  // Insertion Sort Algorithm
  const insertionSort = async () => {
    setIsSorting(true);
    stopRequested.current = false;
    let arr = [...array];
    const bars = document.getElementsByClassName('bar');

    for (let i = 1; i < arr.length; i++) {
      let key = arr[i];
      let j = i - 1;

      while (j >= 0 && arr[j] > key) {
        if (stopRequested.current) return;
        await waitIfPaused();

        bars[j].style.backgroundColor = 'red';
        bars[j + 1].style.backgroundColor = 'yellow';

        await sleep(speedRef.current);

        arr[j + 1] = arr[j];
        setArray([...arr]);

        bars[j].style.backgroundColor = '#4ade80';
        bars[j + 1].style.backgroundColor = '#4ade80';

        j--;
      }

      arr[j + 1] = key;
      setArray([...arr]);

      bars[i].style.backgroundColor = '#60a5fa';
    }

    setIsSorting(false);
  };

  // Merge Sort Algorithm (Recursive)
  const mergeSort = async () => {
    setIsSorting(true);
    stopRequested.current = false;

    const merge = async (left, right) => {
      const result = [];
      let i = 0;
      let j = 0;

      while (i < left.length && j < right.length) {
        if (stopRequested.current) return;
        await waitIfPaused();

        if (left[i] < right[j]) {
          result.push(left[i]);
          i++;
        } else {
          result.push(right[j]);
          j++;
        }
      }

      return [...result, ...left.slice(i), ...right.slice(j)];
    };

    const mergeSortHelper = async (arr) => {
      if (arr.length <= 1) return arr;

      const mid = Math.floor(arr.length / 2);
      const left = arr.slice(0, mid);
      const right = arr.slice(mid);

      const sortedLeft = await mergeSortHelper(left);
      const sortedRight = await mergeSortHelper(right);

      const merged = await merge(sortedLeft, sortedRight);
      setArray([...merged]);
      return merged;
    };

    await mergeSortHelper(array);
    setIsSorting(false);
  };

  const handleSortStart = async () => {
    if (isSorting) return; // Prevent sorting if already sorting
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
      default:
        break;
    }
  };

  const handlePauseToggle = () => {
    setIsPaused(prev => !prev);
  };

  return (
    <div className="visualizer-container">
      <h2>Sorting Visualizer</h2>
      <div className="controls">
        <input
          type="text"
          placeholder="Enter numbers separated by commas"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          disabled={isSorting}
        />
        <button onClick={handleCustomInput} disabled={isSorting}>Use Custom Array</button>
        <button onClick={generateRandomArray} disabled={isSorting}>Generate Random Array</button>

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
          <label>Speed: {speedRef.current} ms</label>
          <input
            type="range"
            min="10"
            max="2000"
            step="10"
            value={speedRef.current}
            onChange={(e) => speedRef.current = Number(e.target.value)}
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
          </select>
        </div>

        <button onClick={handlePauseToggle} disabled={!isSorting}>
          {isPaused ? "Resume" : "Pause"}
        </button>
        <button onClick={handleSortStart} disabled={isSorting}>Start Sorting</button>
      </div>

      <div className="bars-container">
        {array.map((value, idx) => (
          <div
            key={idx}
            className="bar"
            style={{
              height: `${value * 3}px`,
              width: `${Math.max(5, 1000 / array.length)}px`,
              transition: `height ${speedRef.current / 1000}s ease, background-color 0.2s`,
            }}
          >
            <span className="bar-label">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SortingVisualizer;

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SortingPage from "./pages/SortingPage";
import SearchingPage from "./pages/SearchingPage";
import GraphPage from "./pages/GraphPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sorting" element={<SortingPage/>} />
        <Route path="/search" element={<SearchingPage/>} />
        <Route path="/graph" element={<GraphPage />} />
      </Routes>
    </Router>
  );
}

export default App;

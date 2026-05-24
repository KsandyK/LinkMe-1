import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './components/Homepage.tsx';
import CreditsStore from './components/CreditsStore.tsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/credits" element={<CreditsStore />} />
      </Routes>
    </Router>
  );
}

export default App;

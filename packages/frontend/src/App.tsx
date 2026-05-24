import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import Homepage from './components/Homepage.tsx';
import CreditsStore from './components/CreditsStore.tsx';
import LiveStream from './components/LiveStream.tsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Homepage />} />
          <Route path="credits" element={<CreditsStore />} />
          <Route path="live" element={<LiveStream />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

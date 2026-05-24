import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import Homepage from './components/Homepage.tsx';
import CreditsStore from './components/CreditsStore.tsx';
import CreatorOnboarding from './components/CreatorOnboarding.tsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Homepage />} />
          <Route path="credits" element={<CreditsStore />} />
          <Route path="creator" element={<CreatorOnboarding />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

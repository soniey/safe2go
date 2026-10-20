import { Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import FloodWeather from './pages/FloodWeather';
import TreeRisk from './pages/TreeRisk';
import RoadVision from './pages/RoadVision';
import Incidents from './pages/Incidents';
export default function App() {
  return <Routes><Route element={<Layout />}><Route index element={<Overview />} /><Route path="flood" element={<FloodWeather />} /><Route path="trees" element={<TreeRisk />} /><Route path="vision" element={<RoadVision />} /><Route path="incidents" element={<Incidents />} /><Route path="*" element={<section className="panel p-8"><h1>Page not found</h1><Link className="detail-link mt-4" to="/">Return to overview</Link></section>} /></Route></Routes>;
}

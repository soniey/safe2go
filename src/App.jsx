import Reports from './pages/Reports';
import Login from './pages/Login';
import RequireDemoSession from './components/RequireDemoSession';
import { DemoSessionProvider } from './utils/demoSession';
import MaintenanceTeams from './pages/MaintenanceTeams';
import { Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import FloodWeather from './pages/FloodWeather';
import TreeRisk from './pages/TreeRisk';
import RoadVision from './pages/RoadVision';
import Incidents from './pages/Incidents';
import StaffJobs from './pages/StaffJobs';
import AdminOnly from './components/staff/AdminOnly';
export default function App() {
  return <DemoSessionProvider><Routes><Route path="login" element={<Login />} /><Route element={<RequireDemoSession />}><Route element={<Layout />}><Route index element={<Overview />} /><Route path="flood" element={<FloodWeather />} /><Route path="trees" element={<TreeRisk />} /><Route path="vision" element={<RoadVision />} /><Route path="incidents" element={<Incidents />} /><Route path="reports" element={<Reports />} /><Route path="teams" element={<MaintenanceTeams />} /><Route path="*" element={<section className="panel p-8"><h1>Page not found</h1><Link className="detail-link mt-4" to="/">Return to overview</Link></section>} /></Route></Route></Routes></DemoSessionProvider>;
}

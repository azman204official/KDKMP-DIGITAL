import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import Overview from './dashboard/Overview';
import Members from './dashboard/Members';
import Savings from './dashboard/Savings';
import Payments from './dashboard/Payments';
import Reports from './dashboard/Reports';
import Messaging from './dashboard/Messaging';
import Settings from './dashboard/Settings';

export default function Dashboard() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/members" element={<Members />} />
        <Route path="/savings" element={<Savings />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/messaging" element={<Messaging />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Tasks from "@/pages/Tasks";
import TaskDetail from "@/pages/TaskDetail";
import Results from "@/pages/Results";
import ResultDetail from "@/pages/ResultDetail";
import Recommend from "@/pages/Recommend";
import Approval from "@/pages/Approval";
import Alerts from "@/pages/Alerts";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/results" element={<Results />} />
          <Route path="/results/:id" element={<ResultDetail />} />
          <Route path="/recommend" element={<Recommend />} />
          <Route path="/approval" element={<Approval />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import GeneratePage from "./pages/GeneratePage";
import LyricsPage from "./pages/LyricsPage";
import HistoryPage from "./pages/HistoryPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<GeneratePage />} />
        <Route path="/lyrics" element={<LyricsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

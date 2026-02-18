import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import QuizzesPage from './pages/QuizzesPage';
import QuizCreatePage from './pages/QuizCreatePage';
import QuizEditPage from './pages/QuizEditPage';
import RoomJoinPage from './pages/RoomJoinPage';
import RoomCreatePage from './pages/RoomCreatePage';
import HostScreen from './pages/HostScreen';
import PlayerScreen from './pages/PlayerScreen';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/quizzes" element={<QuizzesPage />} />
          <Route path="/quiz/create" element={<QuizCreatePage />} />
          <Route path="/quiz/:id/edit" element={<QuizEditPage />} />
          <Route path="/room/join" element={<RoomJoinPage />} />
          <Route path="/room/create" element={<RoomCreatePage />} />
          <Route path="/room/:code/host" element={<HostScreen />} />
          <Route path="/room/:code/play" element={<PlayerScreen />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

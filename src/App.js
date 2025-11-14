import './App.css';
import NavBar from './components/NavBar';
import HomePage from './routes/HomePage';
import AboutPage from './routes/AboutPage';
import MusicPage from './routes/MusicPage';
import BookPage from './routes/BookPage';
import ContactPage from './routes/ContactPage';
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <div className="app">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<NavBar />}>
            <Route index element={<HomePage/>} />
            <Route path="about" element={<AboutPage />} />
            <Route path="music" element={<MusicPage />} />
            <Route path="author" element={<BookPage />} />
            <Route path="contact" element={<ContactPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
import './App.css';
import { Routes, Route } from "react-router-dom";
import Home from './pages/Home';
import About from './pages/About';
import Projects from "./pages/Projects.js";
import Search from "./pages/Search.js";
import User from "./pages/User.js";
import Login from "./pages/Login.js";
import Signup from "./pages/Signup.js";
import Project from './pages/Project.js';
import Create from './pages/Create.js';
import Editor from './pages/Editor.js';
import EditorSelector from './pages/EditorSelector.js';
import { Notfound, Forbidden, Unathorized } from './pages/Errors.js';
import LoadSection from './pages/LoadSection.js';
import UploadSectionTranslations from './pages/UploadSectionTranslations.js';
import UploadProjectTranslations from './pages/UploadProjectTranslations.js';
import { AuthProvider } from "./AuthContext";

const api_link = "127.0.0.1:3000"

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="404" element={<Notfound />} />
          <Route path="403" element={<Forbidden />} />
          <Route path="401" element={<Unathorized />} />
          <Route path="about" element={<About />} />
          <Route path="projects" element={<Projects />} />
          <Route path="search" element={<Search />} />
          <Route path="user" element={<User />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="projects/:project_id" element={<Project />} />
          <Route path="create" element={<Create />} />
          <Route path="projects/:project_id/editor" element={<EditorSelector />} />
          <Route path="projects/:project_id/editor/:sections_list" element={<Editor />} />
          <Route path="notfound" element={<Notfound />} />
          <Route path="users/:user_id" element={<User />} />
          <Route path="projects/:project_id/sections/:section_id/load_strings" element={<LoadSection />} />
          <Route path="projects/:project_id/upload_translations" element={<UploadProjectTranslations />} />
          <Route path="projects/:project_id/sections/:section_id/upload_translations" element={<UploadSectionTranslations />} />
          <Route path="*" element={<Notfound />} />
        </Routes>
      </AuthProvider>
    </div>
  )
}

export default App;

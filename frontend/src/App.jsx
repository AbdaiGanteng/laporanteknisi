import './App.css'
import { Routes, Route,} from 'react-router-dom'
import Teknisi from './pages/teknisi.jsx'
import Login from './pages/login.jsx'
import Dashboard from './pages/dashboard.jsx'

export default function App() {
  return (
     <Routes>
      
      <Route path='/' element={<Login/>} ></Route>
      <Route path='/form-teknisi' element={<Teknisi/>} ></Route>
      <Route path='/dashboard' element={<Dashboard/>} ></Route>

    </Routes>
  );
}


// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './Pages/Home';
import Questionnaire from './Pages/Questionnaire';
import Messenger from './Pages/Messenger';
import Rate from './Pages/Rate';
import Header from './components/Header';
import Login from './Pages/Login';
import Register from './Pages/Register';
import Adm from './Pages/Adm';
import Adm_Login from './Pages/Adm_Login';
import ProtectedRoute from './components/ProtectedRoute'; // Добавляем импорт ProtectedRoute

function App() {
    return (
        <Router>
            <Routes>
                <Route path='/' element={<Home />} />
                <Route path='/login' element={<Login />} />
                <Route path='/register' element={<Register />} />
                <Route path='/adm_login' element={<Adm_Login />} />
                <Route
                    path='/adm'
                    element={
                        <ProtectedRoute>
                            <Adm />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path='/*'
                    element={
                        <>
                            <Header />
                            <Routes>
                                <Route path='/questionnaire' element={<Questionnaire />} />
                                <Route path='/rate' element={<Rate />} />
                                <Route path='/messenger' element={<Messenger />} />
                                <Route path="*" element={<Navigate to="/" />} />
                            </Routes>
                        </>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App;

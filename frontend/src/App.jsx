import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Promotions from './pages/Promotions';
import Products from './pages/Products';
import Login from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import Costeador from './pages/Costeador';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/promotions" element={<Promotions />} />
                <Route path="/products" element={<Products />} />
                <Route path="/login" element={<Login />} />
                {/*<Route path="/admin" element={<AdminPanel />} />*/}
                <Route
                    path="/costeador"
                    element={
                        <ProtectedRoute roles={['user', 'admin']}>
                            <Costeador />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute roles={['worker', 'admin']}>
                            <AdminPanel />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </>
    );
}

export default App;
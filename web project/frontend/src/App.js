import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';
import AddItem from './components/AddItem';
import ItemDetail from './components/ItemDetail';
import MakeOffer from './components/MakeOffer';
import OffersList from './components/OffersList';
import Chat from './components/Chat';
import Report from './components/Report';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/add-item" element={<AddItem />} />
            <Route path="/edit-item/:itemId" element={<AddItem />} />
            <Route path="/item/:itemId" element={<ItemDetail />} />
            <Route path="/make-offer/:itemId" element={<MakeOffer />} />
            <Route path="/offers" element={<OffersList />} />
            <Route path="/offers/:itemId" element={<OffersList />} />
            <Route path="/chat/:offerId" element={<Chat />} />
            <Route path="/report/:targetType/:targetId" element={<Report />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
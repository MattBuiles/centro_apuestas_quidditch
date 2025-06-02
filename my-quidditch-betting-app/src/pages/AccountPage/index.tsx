import React, { useState } from 'react';
import { Link, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import styles from './AccountPage.module.css';
import UserProfile from '../../components/account/UserProfile';

import ItemList from '../../components/common/ItemList';
import BetHistoryItem from '../../components/account/BetHistoryItem';

// Define sub-components for each account section
const ProfileSection = () => {
    const { user } = useAuth();
    return (
        <section id="profile" className="account-section">
            <h2 className="text-2xl font-bold text-primary mb-6 pb-3 border-b border-gray-200">Mi Perfil</h2>
            {user && (
                <form className="space-y-4">
                    <div className="form-group">
                        <label className="form-label">Nombre de Usuario:</label>
                        <input type="text" className="form-input bg-gray-100" value={user.username} readOnly />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Correo Electrónico:</label>
                        <input type="email" className="form-input bg-gray-100" value={user.email} readOnly />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Cambiar Contraseña:</label>
                        <input type="password" placeholder="Nueva contraseña" className="form-input mb-2" />
                        <input type="password" placeholder="Confirmar nueva contraseña" className="form-input" />
                    </div>
                    <Button type="submit">Guardar Cambios</Button>
                </form>
            )}
        </section>
    );
};

const WalletSection = () => {
    const { user } = useAuth();
    return (
        <section id="wallet" className="account-section">
            <h2 className="text-2xl font-bold text-primary mb-6 pb-3 border-b border-gray-200">Mi Monedero Mágico</h2>
            {user && (
                <div className="wallet-balance-card card text-center p-8 mb-6">
                    <p className="balance-label text-lg opacity-80">Saldo Actual</p>
                    <p className="balance-value text-4xl font-bold my-1">{user.balance} Galeones</p>
                </div>
            )}
            <div className="wallet-actions flex gap-4">
                <Button>Depositar Galeones</Button>
                <Button variant="outline">Retirar Galeones</Button>
            </div>
            <h3 className="text-xl font-semibold text-primary mt-8 mb-4 pb-2 border-b border-gray-200">Historial de Transacciones</h3>
            <p className="text-gray-600">El historial de transacciones aparecerá aquí...</p>
        </section>
    );
};

const BetsSection = () => {
     return (
        <section id="bets" className="account-section">
            <h2 className="text-2xl font-bold text-primary mb-6 pb-3 border-b border-gray-200">Mis Apuestas</h2>
            <p className="text-gray-600">El historial de tus apuestas (activas y pasadas) aparecerá aquí...</p>
        </section>
    );
};


const AccountPage = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Determine active tab based on URL, default to profile
  const getActiveTab = () => {
    if (location.pathname.endsWith('/wallet')) return 'wallet';
    if (location.pathname.endsWith('/bets')) return 'bets';
    return 'profile';
  };
  const activeTab = getActiveTab();

  const dummyUser = {
    name: 'Harry Potter',
    email: 'harry.potter@hogwarts.ac.uk',
  };

  const dummyBalance = 500; // Dummy balance

  const dummyBetHistory = [
    {
      id: 1,
      match: 'Gryffindor vs Slytherin',
      option: 'Gryffindor Win',
      amount: 50,
      result: 'win',
      payout: 100,
    },
    {
      id: 2,
      match: 'Hufflepuff vs Ravenclaw',
      option: 'Ravenclaw Win',
      amount: 30,
      result: 'loss',
      payout: 0,
    },
    {
      id: 3,
      match: 'Gryffindor vs Hufflepuff',
      option: 'Draw',
      amount: 20,
      result: 'pending', // Added result for pending bet
    }, // Example of a bet on a match not yet resulted
  ];

  if (!user) {
    return <div className="text-center p-8">Por favor, inicia sesión para ver tu cuenta.</div>;
  }

  return (
    <div className="account-container flex flex-col md:flex-row gap-8 mt-6">
      <aside className="sidebar w-full md:w-1/4">
        <Card className="user-profile-summary text-center p-6 mb-6">
          <div className="user-avatar-large w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-3xl font-bold text-primary mx-auto mb-4">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-xl font-bold text-primary mb-1">{user.username}</h3>
          <p className="text-sm text-gray-600 mb-4">{user.email}</p>
          <Button variant="outline" size="sm" onClick={logout} fullWidth>Cerrar Sesión</Button>
        </Card>

        <nav className="account-nav">
          <ul className="space-y-1">
            <li><Link to="" className={`block p-3 rounded-md font-medium ${activeTab === 'profile' ? 'bg-primary text-white' : 'hover:bg-gray-100 text-gray-700'}`}>Mi Perfil</Link></li>
            <li><Link to="wallet" className={`block p-3 rounded-md font-medium ${activeTab === 'wallet' ? 'bg-primary text-white' : 'hover:bg-gray-100 text-gray-700'}`}>Monedero</Link></li>
            <li><Link to="bets" className={`block p-3 rounded-md font-medium ${activeTab === 'bets' ? 'bg-primary text-white' : 'hover:bg-gray-100 text-gray-700'}`}>Mis Apuestas</Link></li>
            {/* Add more links like Settings, Notifications etc. */}
          </ul>
        </nav>
      </aside>

      <main className="main-content flex-grow md:w-3/4">
        <Routes>
            <Route index element={<ProfileSection />} />
            <Route path="wallet" element={<WalletSection />} />
            <Route path="bets" element={<BetsSection />} />
            {/* Define more nested routes here */}
        </Routes>
        <Outlet /> {/* This Outlet is important if you have child routes defined directly under /account/* in App.tsx and want to render them here */}
      </main>
    </div>
  );
};

export default AccountPage;
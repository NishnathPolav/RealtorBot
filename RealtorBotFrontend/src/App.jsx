import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ChooseMode from './pages/ChooseMode';
import SellerDashboard from './pages/SellerDashboard';
import AddEditListing from './pages/AddEditListing';
import RespondOffers from './pages/RespondOffers';
import BuyerDashboard from './pages/BuyerDashboard';
import ConversationalSearch from './pages/ConversationalSearch';
import SuggestedListings from './pages/SuggestedListings';
import ScheduleTour from './pages/ScheduleTour';
import OfferNegotiation from './pages/OfferNegotiation';
import TourScheduler from './pages/TourScheduler';
import Inspection from './pages/Inspection';
import Chat from './pages/Chat';
import ProtectedRoute from './components/ProtectedRoute';
import ListingDetails from './pages/ListingDetails';

const App = () => (
  <Router>
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/choose-mode" element={<ProtectedRoute><ChooseMode /></ProtectedRoute>} />
        <Route path="/seller-dashboard" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
        <Route path="/add-edit-listing" element={<ProtectedRoute><AddEditListing /></ProtectedRoute>} />
        <Route path="/add-edit-listing/:id" element={<ProtectedRoute><AddEditListing /></ProtectedRoute>} />
        <Route path="/respond-offers" element={<ProtectedRoute><RespondOffers /></ProtectedRoute>} />
        <Route path="/buyer-dashboard" element={<ProtectedRoute><BuyerDashboard /></ProtectedRoute>} />
        <Route path="/conversational-search" element={<ProtectedRoute><ConversationalSearch /></ProtectedRoute>} />
        <Route path="/suggested-listings" element={<ProtectedRoute><SuggestedListings /></ProtectedRoute>} />
        <Route path="/schedule-tour" element={<ProtectedRoute><ScheduleTour /></ProtectedRoute>} />
        <Route path="/offer-negotiation" element={<ProtectedRoute><OfferNegotiation /></ProtectedRoute>} />
        <Route path="/tour-scheduler" element={<ProtectedRoute><TourScheduler /></ProtectedRoute>} />
        <Route path="/inspection" element={<ProtectedRoute><Inspection /></ProtectedRoute>} />
        {/*<Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />*/}
        <Route path="/chat" element={<Chat />} />
        <Route path="/listing/:id" element={<ProtectedRoute><ListingDetails /></ProtectedRoute>} />
      </Routes>
    </Layout>
  </Router>
);

export default App;

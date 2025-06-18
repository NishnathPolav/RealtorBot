import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/SIgnup';
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

const App = () => (
  <Router>
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/choose-mode" element={<ChooseMode />} />
        <Route path="/seller-dashboard" element={<SellerDashboard />} />
        <Route path="/add-edit-listing" element={<AddEditListing />} />
        <Route path="/respond-offers" element={<RespondOffers />} />
        <Route path="/buyer-dashboard" element={<BuyerDashboard />} />
        <Route path="/conversational-search" element={<ConversationalSearch />} />
        <Route path="/suggested-listings" element={<SuggestedListings />} />
        <Route path="/schedule-tour" element={<ScheduleTour />} />
        <Route path="/offer-negotiation" element={<OfferNegotiation />} />
        <Route path="/tour-scheduler" element={<TourScheduler />} />
        <Route path="/inspection" element={<Inspection />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </Layout>
  </Router>
);

export default App;
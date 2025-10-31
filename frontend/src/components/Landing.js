import React from 'react';
import './Landing.css';
import Navbar from './landing-page/Navbar';
import Hero from './landing-page/Hero';
import Features from './landing-page/Features';
import Reviews from './landing-page/Reviews';
import SubscriptionPlans from './landing-page/SubscriptionPlans';
import FAQ from './landing-page/FAQ';
import Team from './landing-page/Team';
import Footer from './landing-page/Footer';
import HowItWorks from './landing-page/HowItWorks';

const Landing = () => {
    return (
      <>
      <Navbar />
        <Hero />
      <div className="section-shadow" id="howitworks">
        <HowItWorks />
      </div>
      <div className="section-shadow">
        <Features />
      </div>
      <div className="section-shadow">
        <Reviews />
      </div>
      <div className="section-shadow">
        <SubscriptionPlans />
      </div>
      <div className="section-shadow">
        <FAQ />
      </div>
      <div className="section-shadow">
        <Team />
      </div>
      <Footer />
      </>
    );
  };
  
  export default Landing;
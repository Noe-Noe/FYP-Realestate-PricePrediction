import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ApiProvider } from './context/ApiContext';

import Landing from './components/Landing';
import HowItWorks from './components/landing-page/HowItWorks';

import SignUp from './login-page/SignUp';
import Login from './login-page/Login';
import RecoverEmail from './login-page/RecoverEmail';

import FirstTimer from './components/first-time/FirstTimer';
import FirstTimerAgent from './components/first-time/FirstTimerAgent';
import Dashboard from './components/Dashboard';

import AgentUser from './components/agent/AgentUser';
import AgentRegions from './components/agent/AgentRegions';
import AgentListings from './components/agent/AgentListings';
import AddListing from './components/agent/AddListing';
import EditListing from './components/agent/EditListing';

import FreeUser from './components/user/user';
import PricePrediction from './components/user/priceprediction';
import Prediction from './components/user/prediction';
import ComparePrediction from './components/user/compareprediction';
import Comparison from './components/user/comparison';
import Bookmarks from './components/user/bookmarks';
import PropertyListings from './components/user/PropertyListings';
import PropertyListing from './components/user/PropertyListing';
import Feedback from './components/sharedpages/feedback';
import Support from './components/sharedpages/support';
import Profile from './components/sharedpages/profile';

import SysAdmin from './components/system/SysAdmin';
import UserAccount from './components/system/UserAccount';
import UserDetails from './components/system/UserDetails';
import FeedbackManagement from './components/system/FeedbackManagement';
import RespondToFeedback from './components/system/RespondToFeedback';
import ViewFeedback from './components/system/ViewFeedback';
import ContentManagement from './components/system/ContentManagement';
import RegionsManagement from './components/system/RegionsManagement';
import EditHeroSection from './components/system/EditHeroSection';
import EditHowItWorks from './components/system/EditHowItWorks';
import EditSeeHowItWorks from './components/system/EditSeeHowItWorks';
import EditOurTeam from './components/system/EditOurTeam';
import AddStep from './components/system/AddStep';
import AddTeamMember from './components/system/AddTeamMember';
import EditStep from './components/system/EditStep';
import EditTeamMember from './components/system/EditTeamMember';
import EditContactSection from './components/system/EditContactSection';
import EditFAQSection from './components/system/EditFAQSection';
import AddFAQ from './components/system/AddFAQ';
import EditFAQ from './components/system/EditFAQ';
import EditDisclaimer from './components/system/EditDisclaimer';
import EditLegalTerms from './components/system/EditLegalTerms';
import EditPrivacyPolicy from './components/system/EditPrivacyPolicy';
import EditSubscriptionPlans from './components/system/EditSubscriptionPlans';
import ContentPreview from './components/system/ContentPreview';
import ApiTest from './components/ApiTest';

function App() {
  return (
    <ApiProvider>
      <Router>
        <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/how-it-works" element={<HowItWorks />} />

        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<RecoverEmail />} />

        <Route path="/first-time" element={<FirstTimer />} />
        <Route path="/first-time-agent" element={<FirstTimerAgent />} />

        {/* Dashboards */}
        <Route path="/dashboard" element={<Dashboard />} /> {/* Main dashboard - routes based on user type */}

        <Route path="/dashboard/registered" element={<FreeUser />} /> {/* Registered user dashboard */}
        <Route path="/dashboard/priceprediction" element={<PricePrediction />} />
        <Route path="/dashboard/prediction" element={<Prediction />} />
        <Route path="/dashboard/compare-predictions" element={<ComparePrediction />} />
        <Route path="/dashboard/comparison" element={<Comparison />} />
        <Route path="/dashboard/property-listings" element={<PropertyListings />} />
        <Route path="/dashboard/property-listing/:id" element={<PropertyListing />} />
        <Route path="/bookmarks" element={<Bookmarks />} />

        <Route path="/dashboard/agent" element={<AgentUser />} />
        <Route path="/dashboard/regions" element={<AgentRegions />} />
        <Route path="/dashboard/listings" element={<AgentListings />} />
        <Route path="/dashboard/add-listing" element={<AddListing />} />
        <Route path="/dashboard/edit-listing/:id" element={<EditListing />} />

        <Route path="/feedback" element={<Feedback />} />
        <Route path="/support" element={<Support />} />
        <Route path="/profile" element={<Profile />} />
        
        <Route path="/dashboard/sysadmin" element={<SysAdmin />} />
        <Route path="/dashboard/user-accounts" element={<UserAccount />} />
        <Route path="/dashboard/user-details/:userId" element={<UserDetails />} />
        <Route path="/dashboard/feedback-management" element={<FeedbackManagement />} />
        <Route path="/dashboard/respond-to-feedback/:feedbackId" element={<RespondToFeedback />} />
        <Route path="/dashboard/view-feedback/:feedbackId" element={<ViewFeedback />} />
        <Route path="/dashboard/content-management" element={<ContentManagement />} />
        <Route path="/dashboard/regions-management" element={<RegionsManagement />} />
        <Route path="/dashboard/edit-hero-section" element={<EditHeroSection />} />
        <Route path="/dashboard/edit-how-it-works" element={<EditHowItWorks />} />
        <Route path="/dashboard/edit-see-how-it-works" element={<EditSeeHowItWorks />} />
        <Route path="/dashboard/edit-our-team" element={<EditOurTeam />} />
        <Route path="/dashboard/add-step" element={<AddStep />} />
        <Route path="/dashboard/add-team-member" element={<AddTeamMember />} />
        <Route path="/dashboard/edit-step/:stepId" element={<EditStep />} />
        <Route path="/dashboard/edit-team-member/:memberId" element={<EditTeamMember />} />
        <Route path="/dashboard/edit-contact-section" element={<EditContactSection />} />
        <Route path="/dashboard/edit-faq-section" element={<EditFAQSection />} />
        <Route path="/dashboard/add-faq" element={<AddFAQ />} />
        <Route path="/dashboard/edit-faq/:faqId" element={<EditFAQ />} />
        <Route path="/dashboard/edit-disclaimer" element={<EditDisclaimer />} />
        <Route path="/dashboard/edit-legal-terms" element={<EditLegalTerms />} />
        <Route path="/dashboard/edit-privacy-policy" element={<EditPrivacyPolicy />} />
        <Route path="/dashboard/edit-subscription-plans" element={<EditSubscriptionPlans />} />
        <Route path="/dashboard/content-preview" element={<ContentPreview />} />
        <Route path="/api-test" element={<ApiTest />} />


      </Routes>
      </Router>
    </ApiProvider>
  );
}

export default App;


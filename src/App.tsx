import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Home } from "./components/Home";
import { UserProfile } from "./components/UserProfile";
import { OrganizationProfile } from "./components/OrganizationProfile";
import { OrganizationTeam } from "./components/OrganizationTeam";
import { OrganizationJobPost } from "./components/OrganizationJobPost";
import { Jobs } from "./components/Jobs";
import { ManageJobs } from "./components/ManageJobs";
import { Auth } from "./components/Auth";
import { ScheduleInterview } from "./components/ScheduleInterview";
import { InterviewFeedback } from "./components/InterviewFeedback";
import { OfferResponse } from "./components/OfferResponse";
import { ReviewForm } from "./components/ReviewForm";
import { InviteAccept } from "./components/InviteAccept";
import { PaymentSuccess } from "./components/PaymentSuccess";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/signup" element={<Navigate to="/auth" replace />} />
        <Route path="/user-profile" element={<UserProfile />} />
        <Route path="/organization-profile" element={<OrganizationProfile />} />
        <Route path="/organization-team" element={<OrganizationTeam />} />
        <Route path="/organization-jobpost" element={<OrganizationJobPost />} />
        <Route path="/manage-jobs" element={<ManageJobs />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/schedule-interview" element={<ScheduleInterview />} />
        <Route path="/interview-feedback" element={<InterviewFeedback />} />
        <Route path="/offer-response" element={<OfferResponse />} />
        <Route path="/review-form" element={<ReviewForm />} />
        <Route path="/invite-accept/:token" element={<InviteAccept />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<Navigate to="/organization-profile" replace />} />
      </Routes>
    </Router>
  );
}

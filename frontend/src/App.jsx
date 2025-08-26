import { useRef, useState } from "react";
import { TransitionGroup, CSSTransition } from "react-transition-group";

import globalStyles from "./styles/globalStyles";
import Header from "./components/Header";
import Router from "./components/Router";
import Footer from "./components/Footer";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [currentPage, setCurrentPage] = useState("landing");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Refs for animation
  const landingRef = useRef(null);
  const signinRef = useRef(null);
  const signupRef = useRef(null);
  const dashboardRef = useRef(null);

  const pageRefs = {
    landing: landingRef,
    signin: signinRef,
    signup: signupRef,
    dashboard: dashboardRef,
  };

  const handleSignIn = (email) => {
    setIsLoggedIn(true);
    setUserEmail(email);
    setCurrentPage("dashboard");
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setUserEmail("");
    setCurrentPage("landing");
  };

  return (
    <>
      <style>{globalStyles}</style>

      {currentPage === "landing" && (
        <Header
          onNavigate={setCurrentPage}
          isLoggedIn={isLoggedIn}
          onSignOut={handleSignOut}
        />
      )}

      <TransitionGroup>
        <CSSTransition
          key={currentPage}
          timeout={500}
          classNames="page-transition"
          nodeRef={pageRefs[currentPage]}
        >
          <main className="relative" ref={pageRefs[currentPage]}>
            <Router page={currentPage}>
              <Landing path="landing" onNavigate={setCurrentPage} />
              <SignIn path="signin" onNavigate={setCurrentPage} onSignIn={handleSignIn} />
              <SignUp path="signup" onNavigate={setCurrentPage} />
              {isLoggedIn && <Dashboard path="dashboard" userEmail={userEmail} onNavigate={setCurrentPage} />}
            </Router>
            <Footer />
          </main>
        </CSSTransition>
      </TransitionGroup>
    </>
  );
}

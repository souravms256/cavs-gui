import { useRef, useState } from "react";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import { jwtDecode } from 'jwt-decode';

import Header from "./components/Header";
import Router from "./components/Router";
import Footer from "./components/Footer";
import Landing from "./pages/Landing";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import globalStyles from "./styles/globalStyles";

export default function App() {
  const [currentPage, setCurrentPage] = useState("landing");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState(""); // Add state for user name

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

  const handleSignIn = (token) => {
    try {
      // Decode the JWT token to get the user data
      const decodedToken = jwtDecode(token);
      setIsLoggedIn(true);
      setUserEmail(decodedToken.email);
      setUserName(decodedToken.name); // Set the user's name from the decoded token
      setCurrentPage("dashboard");
    } catch (error) {
      console.error("Failed to decode token:", error);
      // Handle the error, maybe show an alert or set an error state
      alert("An error occurred. Please try signing in again.");
      handleSignOut();
    }
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setUserEmail("");
    setUserName(""); // Clear the user's name
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
              {isLoggedIn && <Dashboard path="dashboard" userEmail={userEmail} userName={userName} onNavigate={setCurrentPage} />}
            </Router>
            <Footer />
          </main>
        </CSSTransition>
      </TransitionGroup>
    </>
  );
}

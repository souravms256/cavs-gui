import { useState } from "react";
import axios from 'axios';

export default function SignIn({ onNavigate, onSignIn }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState(null); // 'idle', 'loading', 'success', 'error'
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setMessage(""); // Clear previous messages

    try {
      const response = await axios.post("http://localhost:5000/api/auth/signin", {
        email: form.email,
        password: form.password,
      });

      if (response.status === 200) {
        setStatus("success");
        setMessage("Sign in successful! Redirecting to dashboard...");
        // Call the onSignIn prop with the returned user data or token
        onSignIn(response.data.token);
        setTimeout(() => {
          onNavigate('dashboard');
        }, 2000);
      }
    } catch (error) {
      setStatus("error");
      if (error.response) {
        setMessage(error.response.data.message || "Invalid email or password.");
      } else if (error.request) {
        setMessage("No response from the server. Please check your network connection.");
      } else {
        setMessage("An unexpected error occurred. Please try again.");
      }
      console.error("Sign in error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-lg shadow-xl border border-gray-200">
        <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-2">
          Sign In
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Welcome back.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all duration-300 sm:text-sm"
                value={form.email}
                onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all duration-300 sm:text-sm"
                value={form.password}
                onChange={handleChange}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full flex justify-center py-3 px-4 rounded-md shadow-sm text-sm font-bold text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "loading" ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : "Sign In"}
          </button>
        </form>
        {status && (
          <div className={`mt-4 p-3 rounded-md text-sm text-center ${status === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}
        <div className="mt-6 text-center text-sm">
          <p className="text-gray-600">
            Don't have an account?{" "}
            <button onClick={() => onNavigate('signup')} className="font-medium text-gray-600 hover:text-gray-900 transition-colors duration-300">
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

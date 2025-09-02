import { useState } from "react";
export default function Landing({ onNavigate }) {
 // keep the features, pricing, testimonials arrays & JSX
 const features = [
  { title: "AI-Powered", description: "Utilize advanced AI models to scan for authenticity." },
  { title: "Real-Time Scan", description: "Get instant verification results in a matter of seconds." },
  { title: "Secure & Private", description: "Your data is encrypted and never shared with third parties." },
  { title: "User-Friendly", description: "A simple and intuitive interface for a seamless experience." }
 ];

 const testimonials = [
  { text: "AuthVerify saved me countless hours. It's incredibly accurate and fast!", author: "Jane Doe, Freelance Writer" },
  { text: "The peace of mind knowing my content is authentic is priceless. Highly recommended!", author: "John Smith, Digital Marketer" },
  { text: "A fantastic tool for anyone in the content creation industry. The best on the market.", author: "Alice Johnson, Journalist" }
 ];

 const pricingTiers = [
  {
   title: "Free",
   price: "$0",
   description: "Get started and verify a few documents.",
   features: ["5 Verifications/month", "Basic Analytics", "Community Support"],
   buttonText: "Sign Up Free"
  },
  {
   title: "Pro",
   price: "$29",
   description: "For professionals who need more.",
   features: ["100 Verifications/month", "Advanced Analytics", "Email Support"],
   buttonText: "Get Pro"
  },
  {
   title: "Enterprise",
   price: "Contact Us",
   description: "Custom solutions for large organizations.",
   features: ["Unlimited Verifications", "Dedicated Account Manager", "API Access"],
   buttonText: "Contact Sales"
  }
 ];

 return (
  <>
   <div className="relative min-h-screen flex flex-col justify-center items-center bg-gray-900 bg-cover bg-center text-white"
    style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1549419161-b51909893d93?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)' }}>
    <div className="absolute inset-0 bg-black bg-opacity-20"></div>
    <div className="relative text-center md:text-left md:ml-40 px-4 py-20 md:py-0 max-w-4xl mx-auto">
     <div className="hero-text-fade" style={{animationDelay: '0.2s'}}>
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-normal tracking-wide">
       Minimal Content <br /> Verification System
      </h1>
      <p className="mt-4 text-lg md:text-xl lg:text-2xl font-light opacity-80 max-w-2xl">
       Save time, save money, look more professional and win more clients.
      </p>
      <div className="mt-8 flex flex-col md:flex-row justify-center md:justify-start items-center space-y-4 md:space-y-0 md:space-x-4">
       <button
        onClick={() => onNavigate('signup')}
        className="w-full md:w-auto px-8 py-3 border border-white text-white rounded-full font-bold text-lg hover:bg-white hover:text-gray-900 transition duration-300"
       >
        GET STARTED
       </button>
      </div>
     </div>
    </div>
    <div className="absolute bottom-10 animate-pulse">
     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
     </svg>
    </div>
   </div>

   {/* Features Section */}
   <section id="features" className="bg-white py-20 px-4">
    <div className="container mx-auto max-w-6xl text-center">
     <h2 className="text-4xl font-extrabold text-gray-800 mb-4">Features</h2>
     <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
      Our system is built on a foundation of cutting-edge technology to ensure the highest level of accuracy and security.
     </p>
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {features.map((feature, index) => (
       <div key={index} className="bg-gray-100 p-6 rounded-lg shadow-sm border border-gray-200 transform hover:shadow-lg transition-all duration-300">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">{feature.title}</h3>
        <p className="text-gray-600">{feature.description}</p>
       </div>
      ))}
     </div>
    </div>
   </section>

   {/* Pricing Section */}
   <section id="pricing" className="bg-gray-50 py-20 px-4">
    <div className="container mx-auto max-w-6xl text-center">
     <h2 className="text-4xl font-extrabold text-gray-800 mb-4">Pricing</h2>
     <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
      Choose a plan that's right for you. Start with our free tier or unlock more power with our Pro plans.
     </p>
     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {pricingTiers.map((tier, index) => (
       <div key={index} className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 transform hover:scale-105 transition-transform duration-300">
        <h3 className="text-2xl font-bold text-gray-800">{tier.title}</h3>
        <p className="text-4xl font-extrabold my-4">{tier.price}</p>
        <p className="text-sm text-gray-600 mb-4">{tier.description}</p>
        <ul className="text-left text-gray-700 space-y-2 mb-6">
         {tier.features.map((feature, i) => (
          <li key={i} className="flex items-center space-x-2">
           <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
           <span>{feature}</span>
          </li>
         ))}
        </ul>
        <button
         onClick={() => tier.title !== "Enterprise" ? onNavigate('signup') : null}
         className={`w-full py-3 rounded-full text-white font-bold transition duration-300 ${tier.title === 'Pro' ? 'bg-gray-800 hover:bg-gray-900' : 'bg-gray-600 hover:bg-gray-700'}`}
        >
         {tier.buttonText}
        </button>
       </div>
      ))}
     </div>
    </div>
   </section>

   {/* Testimonials Section */}
   <section id="testimonials" className="bg-white py-20 px-4">
    <div className="container mx-auto max-w-6xl text-center">
     <h2 className="text-4xl font-extrabold text-gray-800 mb-4">What Our Users Say</h2>
     <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
      Hear from satisfied customers who trust our platform for their content verification needs.
     </p>
     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {testimonials.map((testimonial, index) => (
       <div key={index} className="bg-gray-100 p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="italic text-gray-700">"{testimonial.text}"</p>
        <p className="mt-4 font-semibold text-gray-800">- {testimonial.author}</p>
       </div>
      ))}
     </div>
    </div>
   </section>
  </>
 );
}
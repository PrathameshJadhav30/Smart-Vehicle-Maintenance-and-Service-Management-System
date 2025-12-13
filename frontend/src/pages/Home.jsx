import React, { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";

const Home = () => {
  const [stats, setStats] = useState({
    vehicles: 2500,
    bookings: 12000,
    mechanics: 340,
  });

  // Features data
  const features = [
    {
      title: "Service Booking",
      desc: "Book vehicle services with flexible scheduling and automated reminders.",
      icon: (
        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: "Job Card Management",
      desc: "Track repair progress with task assignments and real-time updates.",
      icon: (
        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      title: "Inventory Management",
      desc: "Track spare parts with low stock alerts and automated reordering.",
      icon: (
        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
  ];

  // Testimonials data
  const testimonials = [
    {
      quote: "This platform has transformed how we manage our fleet maintenance. The automation saves us countless hours each week.",
      author: "John Smith",
      role: "Fleet Manager, AutoCorp",
    },
    {
      quote: "The job card system makes it easy to track all repairs and ensure quality standards are met consistently.",
      author: "Sarah Johnson",
      role: "Service Director, Motors Inc",
    },
    {
      quote: "Inventory management has never been easier. We've reduced our spare parts costs by 20% since implementation.",
      author: "Michael Chen",
      role: "Operations Manager, DriveTech",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-[Inter]">
      {/* ================= Hero Section ================= */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20 md:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-20 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-64 h-64 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 md:mb-6">
            Smart Vehicle Maintenance & <span className="text-secondary">Service Management</span>
          </h1>
          <p className="mt-4 md:mt-6 max-w-2xl mx-auto text-base sm:text-lg md:text-xl opacity-90 text-blue-100">
            A complete platform to manage vehicle servicing, booking, inventory and job cards with ease and efficiency.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 mt-8 md:mt-10">
            <Link to="/login">
              <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" size="lg" className="w-full sm:w-auto bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ================= Features Section ================= */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-blue-600 font-semibold uppercase tracking-wide text-sm md:text-base">
              Features
            </h2>
            <p className="mt-3 text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
              Everything you need for Service Management
            </p>
            <p className="mt-4 max-w-2xl mx-auto text-gray-600 text-sm md:text-base">
              Our comprehensive platform streamlines vehicle maintenance operations from booking to billing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {features.map((item, i) => (
              <div
                key={i}
                className="bg-white shadow-lg hover:shadow-xl transition-all duration-300 p-6 md:p-8 rounded-xl text-center group hover:border-blue-500 border border-gray-100"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-blue-50 mb-5 md:mb-6 group-hover:bg-blue-100 transition-colors">
                  {item.icon}
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-3">{item.title}</h3>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= Stats Section ================= */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 py-16 md:py-20">
        <div className="max-w-6xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">Trusted by Thousands</h2>
          <p className="mt-3 text-gray-600 max-w-xl mx-auto text-sm md:text-base">
            Businesses streamline vehicle maintenance with our powerful tools.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 mt-12 md:mt-16 gap-6 md:gap-8">
            {[
              { label: "Vehicles Managed", value: stats.vehicles, suffix: "+" },
              { label: "Service Bookings", value: stats.bookings, suffix: "+" },
              { label: "Expert Mechanics", value: stats.mechanics, suffix: "+" },
            ].map((stat, index) => (
              <div key={index} className="p-5 md:p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-3xl md:text-4xl font-extrabold text-primary mb-2">
                  {stat.value.toLocaleString()}<span className="text-blue-400">{stat.suffix}</span>
                </h3>
                <p className="text-gray-600 text-sm md:text-base">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= Testimonials Section ================= */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-blue-600 font-semibold uppercase tracking-wide text-sm md:text-base">
              Testimonials
            </h2>
            <p className="mt-3 text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
              What Our Customers Say
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-6 md:p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-yellow-400 mb-4">
                  <svg className="w-6 h-6 inline" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-6 h-6 inline" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-6 h-6 inline" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-6 h-6 inline" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <svg className="w-6 h-6 inline" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <p className="text-gray-700 italic mb-6 text-sm md:text-base">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold text-gray-900 text-sm md:text-base">{testimonial.author}</p>
                  <p className="text-gray-600 text-xs md:text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA Section ================= */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">Ready to Transform Your Vehicle Management?</h2>
          <p className="max-w-2xl mx-auto text-blue-100 mb-8 md:mb-10 text-base md:text-lg">
            Join thousands of businesses already using our platform to streamline their vehicle maintenance operations.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
            <Link to="/register">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                Get Started Free
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" size="lg" className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white hover:text-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                Request Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
import React from 'react';
import { UserX, Video, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FeatureIcon = ({ IconComponent, text, delayClass }) => {
  return (
    <div className="flex flex-col items-center">
      
      <div className="relative flex items-center justify-center p-6 sm:p-7 rounded-full bg-amber-500/10">
        
        {/* Ping Animation Circle */}
        <span
          className={`
            absolute h-full w-full rounded-full bg-amber-500 opacity-50
            animate-ping ${delayClass}
          `}
        ></span>

        {/* Lucide Icon */}
        <IconComponent
          size={64}
          className={`
            text-amber-500 relative z-10
            animate-pulse ${delayClass}
          `}
        />
      </div>

      <p className="mt-4 text-white text-base font-semibold uppercase tracking-wider">
        {text}
      </p>
    </div>
  );
};

const Home = () => {
  console.log("Rendering Home Page");

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5 font-inter text-center bg-gray-900"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 100%, #111827 0%, #030712 70%)',
      }}
    >
      <div className="max-w-4xl w-full p-8 sm:p-12 md:p-16 bg-gray-800 rounded-xl shadow-2xl border-2 border-amber-500">

        {/* Header */}
        <header className="mb-10">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-widest mb-1 text-amber-500 [text-shadow:0_0_15px_rgba(245,158,11,0.7)]">
            DEEPCALL
          </h1>
          <h2 className="text-xl sm:text-2xl text-white font-semibold">
            Video Calls with Absolute Privacy.
          </h2>
        </header>

        {/* Features Icons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 md:gap-16 mb-16">
          <FeatureIcon IconComponent={UserX} text="Anonymous Users" delayClass="delay-0" />
          <FeatureIcon IconComponent={Video} text="Private Video" delayClass="delay-300" />
          <FeatureIcon IconComponent={Lock} text="End-to-End Encrypted" delayClass="delay-500" />
        </div>

        {/* CTA Button */}
        <div>
          <Link
            to="/login"
            className="inline-block bg-amber-500 hover:bg-amber-400 text-gray-900 
                       font-semibold py-3 px-8 rounded-full text-lg transition 
                       duration-300 shadow-lg hover:shadow-xl"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;

"use client";

import Link from "next/link";

export default function ErreurPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="text-6xl mb-6">😞</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Oups ! Une erreur s'est produite
        </h1>
        <p className="text-gray-600 mb-8">
          Désolé, quelque chose a mal tourné. Veuillez réessayer.
        </p>
        <Link
          href="/connexion"
          className="inline-block bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-all"
        >
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}

import React from "react";

export default function Notfound() {
  return (
    <>
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold mb-4">404</h1>

          <p className="text-lg mb-4">Page Not Found</p>

          <a href="/" className="text-blue-500 hover:underline">
            Go back to Home
          </a>
        </div>
      </div>
    </>
  );
}

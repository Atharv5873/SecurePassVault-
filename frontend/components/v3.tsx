'use client';
import { useEffect, useState } from 'react';

export default function v3Popup() {
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        const hasSeenPopup = sessionStorage.getItem('seenSecurePassPopup');
        if (!hasSeenPopup) {
            setShowPopup(true);
            sessionStorage.setItem('seenSecurePassPopup', 'true');
        }
    }, []);

    if (!showPopup) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/69 bg-opacity-50">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 max-w-md w-full relative">
                <button
                    className="absolute top-3 right-3 text-gray-500 hover:text-red-500"
                    onClick={() => setShowPopup(false)}
                >
                    ✕
                </button>
                <h1 className="text-xl text-center font-bold mb-2">Coming soon (ver 3.0.0)</h1>
                <p className="text-sm text-gray-600 text-center dark:text-gray-300 mb-4">
                    <strong>Worried about forgetting your vault password and losing access to your data?</strong><br /><br /> Our next version will make use of <strong>passkey</strong> to securely encrypt and store your vault password, <strong>eliminating the need to remember</strong> it. You will also be able to change/reset your vault password without losing access to your saved data!
                </p>                
            </div>
        </div>
    );
}

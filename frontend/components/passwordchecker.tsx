"use client";

import { useState } from "react";

interface CrackTimes {
    [method: string]: string;
}

interface PasswordStrengthResult {
    password: string;
    length: number;
    charset_size: number;
    entropy_bits: number;
    estimted_crack_times: CrackTimes;
    verdict: string;
}
  
export default function PasswordChecker() {
    const [password, setPassword] = useState("");
    const [result, setResult] = useState<null | PasswordStrengthResult>(null);

    const [loading, setLoading] = useState(false);

    const checkStrength = async () => {
        if (!password) return;

        setLoading(true);
        try {
            const response = await fetch(
                `https://securepassvault-1.onrender.com/utils/password-strength?password=${encodeURIComponent(password)}`,
                {
                    method: "POST",
                    headers: { "Accept": "application/json" },
                }
            );
              

            const data = await response.json();
            console.log("✅ API Response:", data);
            setResult(data);
        } catch (err) {
            console.error("❌ Failed to fetch password strength", err);
        } finally {
            setLoading(false);
        }
    };

    const getVerdictColor = (verdict: string) => {
        switch (verdict) {
            case "Very Strong":
                return "text-green-400";
            case "Strong":
                return "text-green-300";
            case "Moderate":
                return "text-yellow-400";
            case "Weak":
                return "text-orange-400";
            case "Very Weak":
                return "text-red-400";
            default:
                return "text-gray-300";
        }
    };

    return (
        <div className="text-sm text-white space-y-3 mt-4 p-3 rounded-xl border border-gray-700 bg-gray-900">
            <h3 className="font-semibold neon-text text-lg">Password Checker</h3>

            <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[color:var(--neon)]/30 bg-gray-800 border border-gray-700 placeholder-gray-500 transition duration-200"
            />

            <button
                onClick={checkStrength}
                disabled={loading || !password}
                className="bg-[color:var(--neon)] hover:bg-opacity-80 transition px-3 py-2 w-full rounded-lg font-semibold text-sm"
            >
                {loading ? "Checking..." : "Check Strength"}
            </button>

            {result?.verdict && (
                <div className="mt-2 space-y-2">
                    <p>
                        <strong>Verdict:</strong>{" "}
                        <span className={`font-bold ${getVerdictColor(result.verdict)}`}>
                            {result.verdict}
                        </span>
                    </p>

                    {result.estimted_crack_times && (
                        <div>
                            <strong>Crack Times:</strong>
                            <ul className="list-disc list-inside text-gray-300">
                                {Object.entries(result.estimted_crack_times).map(
                                    ([method, time]) => (
                                        <li key={method}>
                                            {method}: <span className="text-white">{String(time)}</span>
                                        </li>
                                    )
                                )}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
                    headers: { Accept: "application/json" },
                }
            );

            const data: PasswordStrengthResult = await response.json();
            console.log("Password Strength Response:", data);
            setResult(data);
        } catch (err) {
            console.error("Failed to fetch password strength", err);
        } finally {
            setLoading(false);
        }
    };

    const getBarColor = (verdict: string) => {
        switch (verdict) {
            case "Very Strong":
                return "bg-green-500";
            case "Strong":
                return "bg-green-400";
            case "Moderate":
                return "bg-yellow-400";
            case "Weak":
                return "bg-orange-400";
            case "Very Weak":
                return "bg-red-500";
            default:
                return "bg-gray-400";
        }
    };

    const getTextColor = (verdict: string) => {
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

    const getVerdictScore = (verdict: string): number => {
        switch (verdict) {
            case "Very Weak":
                return 20;
            case "Weak":
                return 40;
            case "Moderate":
                return 60;
            case "Strong":
                return 80;
            case "Very Strong":
                return 100;
            default:
                return 0;
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

            <AnimatePresence>
                {result?.verdict && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="mt-2 space-y-3 bg-gray-800/40 p-4 rounded-lg overflow-hidden"
                    >
                        {/* Safety Meter */}
                        <div className="w-full h-3 rounded bg-gray-700 overflow-hidden">
                            <motion.div
                                className={`h-full ${getBarColor(result.verdict)}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${getVerdictScore(result.verdict)}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>

                        {/* Verdict Text */}
                        <p className="text-base">
                            <strong>Verdict:</strong>{" "}
                            <motion.span
                                className={`font-bold ${getTextColor(result.verdict)}`}
                                key={result.verdict}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.4 }}
                            >
                                {result.verdict}
                            </motion.span>
                        </p>

                        {/* Crack Times */}
                        {result.estimted_crack_times && (
                            <div>
                                <strong>Crack Times:</strong>
                                <ul className="list-disc list-inside text-gray-300 break-words overflow-x-auto">
                                    {Object.entries(result.estimted_crack_times).map(([method, time]) => (
                                        <li key={method}>
                                            {method}: <span className="text-white">{String(time)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

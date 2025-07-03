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
                { method: "POST", headers: { Accept: "application/json" } }
            );
            const data: PasswordStrengthResult = await response.json();
            setResult(data);
        } catch (err) {
            console.error("Failed to fetch password strength", err);
        } finally {
            setLoading(false);
        }
    };

    const getBarColor = (verdict: string) => {
        switch (verdict) {
            case "Very Strong": return "bg-green-500";
            case "Strong": return "bg-green-400";
            case "Moderate": return "bg-yellow-400";
            case "Weak": return "bg-orange-400";
            case "Very Weak": return "bg-red-500";
            default: return "bg-gray-400";
        }
    };

    const getTextColor = (verdict: string) => {
        switch (verdict) {
            case "Very Strong": return "text-green-400";
            case "Strong": return "text-green-300";
            case "Moderate": return "text-yellow-400";
            case "Weak": return "text-orange-400";
            case "Very Weak": return "text-red-400";
            default: return "text-gray-300";
        }
    };

    const getVerdictScore = (verdict: string): number => {
        switch (verdict) {
            case "Very Weak": return 20;
            case "Weak": return 40;
            case "Moderate": return 60;
            case "Strong": return 80;
            case "Very Strong": return 100;
            default: return 0;
        }
    };

    return (
        <div className="text-sm text-white w-full px-6 py-10 space-y-6">
            <h3 className="font-semibold neon-text text-2xl text-center mb-4">Check Your Password Strength</h3>

            <div className="max-w-xl mx-auto space-y-4">
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
            </div>

            <AnimatePresence>
                {result && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="w-full space-y-6 text-base px-2 sm:px-8"
                    >
                        {/* Two Columns */}
                        <div className="flex flex-col md:flex-row justify-center items-stretch gap-8 md:gap-12 w-full max-w-5xl mx-auto">
                            {/* Left Column */}
                            <div className="flex-1 space-y-4 justify-center md:text-left">
                                <div className="flex flex-col sm:flex-row justify-end gap-4">
                                    <p><strong>Password:</strong> {result.password}</p>
                                </div>
                                <div className="flex flex-col sm:flex-row justify-center gap-4 sm:pl-50">
                                    <p><strong>Length:</strong> {result.length}</p>
                                </div>
                                <div className="flex flex-col sm:flex-row justify-end gap-4">
                                    <p className="text-center"><strong>{result.charset_size}</strong><br />Charset </p>
                                    <div className="hidden md:block border-l border-gray-700 h-auto mx-2"></div>
                                    <p className="text-center"><strong>{result.entropy_bits.toFixed(2)}<br /></strong>Entropy (bits)</p>
                                </div>
                            </div>

                            {/* Vertical Divider */}
                            <div className="hidden md:block border-1 border-gray-700 h-auto mx-2"></div>

                            {/* Right Column */}
                            <div className="flex-1">
                                <strong className="block mb-2">Crack Times:</strong>
                                <motion.ul
                                    className="list-disc list-inside text-gray-300 space-y-1 pl-4"
                                    initial="hidden"
                                    animate="visible"
                                    variants={{
                                        visible: {
                                            transition: {
                                                staggerChildren: 0.15
                                            }
                                        }
                                    }}
                                >
                                    {Object.entries(result.estimted_crack_times).map(([method, time]) => (
                                        <motion.li
                                            key={method}
                                            className="text-sm sm:text-base"
                                            variants={{
                                                hidden: { opacity: 0, y: 5 },
                                                visible: { opacity: 1, y: 0 }
                                            }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {method}: <span className="text-white">{time}</span>
                                        </motion.li>
                                    ))}
                                </motion.ul>
                            </div>
                        </div>

                        {/* Verdict Text */}
                        <p className="text-center text-base">
                            <strong className="mr-1">Verdict:</strong>
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

                        {/* Safety Meter */}
                        <div className="w-full max-w-xl mx-auto h-3 rounded bg-gray-700 overflow-hidden">
                            <motion.div
                                className={`h-full ${getBarColor(result.verdict)}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${getVerdictScore(result.verdict)}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <br />
            {/* Footer Note */}
            <div className="text-center text-gray-400 text-xs mt-8">
                <p>
                    This tool estimates the strength of your password based on its length, character set, and entropy.
                </p>
                <p className="mt-1">
                    For best results, use a mix of uppercase, lowercase, numbers, and special characters.
                </p>
            </div>

            {/* Security Note */}
            <div className="mt-6 p-4 rounded-xl bg-[color:var(--neon)]/10 border border-[color:var(--neon)]/20">
                <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[color:var(--neon)] rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                        <p className="text-sm text-gray-300">
                            <span className="font-medium text-[color:var(--neon)]">Security Note:</span> The password you enter is not stored in our system. This tool only analyzes the strength of the password you enter during the request.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

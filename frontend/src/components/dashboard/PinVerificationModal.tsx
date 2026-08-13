"use client";

import React, { useState } from "react";
import { ShieldCheck, X, KeyRound, AlertCircle, RefreshCw } from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "@/config/api.config";

interface PinVerificationModalProps {
    isOpen: boolean;
    usn: string;
    dob: string;
    onClose: () => void;
    onSuccess: (updatedStudentData?: any) => void;
}

const PinVerificationModal: React.FC<PinVerificationModalProps> = ({
    isOpen,
    usn,
    dob,
    onClose,
    onSuccess,
}) => {
    const [authType, setAuthType] = useState<string>("Father's Mobile");
    const [last4Digits, setLast4Digits] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    if (!isOpen) return null;

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!last4Digits || last4Digits.length !== 4) {
            setError("Please enter the exact last 4 digits.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
                usn: usn.toUpperCase(),
                dob: dob,
                authType: authType,
                last4Digits: last4Digits,
                forceResync: true,
            });

            if (response.data.success) {
                const { sessionId, usn: userUsn } = response.data.data;
                localStorage.setItem("studentSessionId", sessionId);
                localStorage.setItem("studentUsn", userUsn);
                
                onSuccess(response.data.data);
                onClose();
            } else if (response.data.requiresSecondaryAuth) {
                setError("Portal verification failed. Please check your selected option and 4-digit PIN.");
            } else {
                setError(response.data.message || "Verification failed. Please try again.");
            }
        } catch (err: any) {
            setError(
                err.response?.data?.message || "Invalid credentials or portal verification failed."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-card fade-in">
                <button className="close-btn" onClick={onClose} disabled={loading}>
                    <X size={18} />
                </button>

                <div className="modal-header">
                    <div className="icon-wrapper">
                        <ShieldCheck size={28} color="var(--accent-primary, #00ADB5)" />
                    </div>
                    <h3 className="modal-title">Portal Verification Required</h3>
                    <p className="modal-subtitle">
                        Enter your 4-digit verification PIN to authenticate with the college portal and update your placement & academic records.
                    </p>
                </div>

                <form onSubmit={handleVerify} className="modal-form">
                    <div className="form-group">
                        <label className="form-label">Verification Option</label>
                        <select
                            value={authType}
                            onChange={(e) => setAuthType(e.target.value)}
                            className="select-field"
                            disabled={loading}
                        >
                            <option value="Father's Mobile">Father's Mobile Number</option>
                            <option value="Mother's Mobile">Mother's Mobile Number</option>
                            <option value="ABC ID">ABC ID (Academic Bank of Credits)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Last 4 Digits</label>
                        <div className="input-with-icon">
                            <KeyRound size={18} className="input-icon" />
                            <input
                                type="password"
                                maxLength={4}
                                className="pin-input-field"
                                value={last4Digits}
                                onChange={(e) => setLast4Digits(e.target.value.replace(/\D/g, ""))}
                                placeholder="• • • •"
                                disabled={loading}
                                autoFocus
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="error-banner">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="modal-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-cancel"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={loading || last4Digits.length !== 4}
                        >
                            {loading ? (
                                <>
                                    <RefreshCw size={16} className="animate-spin" /> Verifying...
                                </>
                            ) : (
                                "Verify & Update"
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <style jsx>{`
                .modal-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.75);
                    backdrop-filter: blur(8px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                    padding: 20px;
                }
                .modal-card {
                    background: var(--bg-secondary, #1B2333);
                    border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
                    border-radius: 16px;
                    padding: 32px;
                    width: 100%;
                    max-width: 440px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
                    position: relative;
                }
                .close-btn {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: transparent;
                    border: none;
                    color: var(--text-muted, #94a3b8);
                    cursor: pointer;
                    padding: 6px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s ease;
                }
                .close-btn:hover {
                    background: rgba(255, 255, 255, 0.08);
                    color: var(--text-primary, #fff);
                }
                .modal-header {
                    text-align: center;
                    margin-bottom: 24px;
                }
                .icon-wrapper {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: rgba(0, 173, 181, 0.12);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px auto;
                    border: 1px solid rgba(0, 173, 181, 0.25);
                }
                .modal-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--text-primary, #fff);
                    margin-bottom: 8px;
                }
                .modal-subtitle {
                    font-size: 0.85rem;
                    color: var(--text-muted, #94a3b8);
                    line-height: 1.5;
                }
                .modal-form {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                }
                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .form-label {
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: var(--text-secondary, #cbd5e1);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .select-field {
                    background: var(--bg-card, #131A26);
                    border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
                    border-radius: 10px;
                    padding: 12px 14px;
                    color: var(--text-primary, #fff);
                    font-size: 0.9rem;
                    outline: none;
                    cursor: pointer;
                    width: 100%;
                }
                .input-with-icon {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .input-icon {
                    position: absolute;
                    left: 14px;
                    color: var(--text-muted, #94a3b8);
                }
                .pin-input-field {
                    background: var(--bg-card, #131A26);
                    border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
                    border-radius: 10px;
                    padding: 12px 14px 12px 42px;
                    color: var(--text-primary, #fff);
                    font-size: 1.1rem;
                    font-weight: 700;
                    letter-spacing: 0.35em;
                    text-align: center;
                    width: 100%;
                    outline: none;
                    transition: border-color 0.2s ease;
                }
                .pin-input-field:focus {
                    border-color: var(--accent-primary, #00ADB5);
                }
                .error-banner {
                    background: rgba(239, 68, 68, 0.12);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #ef4444;
                    padding: 10px 14px;
                    border-radius: 10px;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    line-height: 1.4;
                }
                .modal-actions {
                    display: flex;
                    gap: 12px;
                    margin-top: 8px;
                }
                .btn-cancel {
                    flex: 1;
                    padding: 12px;
                    background: transparent;
                    border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.1));
                    border-radius: 10px;
                    color: var(--text-secondary, #cbd5e1);
                    font-weight: 600;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .btn-cancel:hover {
                    background: rgba(255, 255, 255, 0.05);
                }
                .btn-submit {
                    flex: 1.5;
                    padding: 12px;
                    background: var(--accent-primary, #00ADB5);
                    border: none;
                    border-radius: 10px;
                    color: #fff;
                    font-weight: 700;
                    font-size: 0.9rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s ease;
                }
                .btn-submit:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .btn-submit:not(:disabled):hover {
                    opacity: 0.9;
                    box-shadow: 0 4px 14px rgba(0, 173, 181, 0.4);
                }
            `}</style>
        </div>
    );
};

export default PinVerificationModal;

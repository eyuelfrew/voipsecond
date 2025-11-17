import React, { useState } from 'react';
import { Pause, Play, X, Coffee, Utensils, Phone, Clock, AlertCircle, CheckCircle } from 'lucide-react';

const PauseModal = ({ isOpen, onClose, onPause, onResume, isPaused, currentPauseReason }) => {
    const [selectedReason, setSelectedReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successAction, setSuccessAction] = useState(''); // 'pause' or 'resume'

    const pauseReasons = [
        { id: 'break', label: 'Break', icon: Coffee, color: 'blue' },
        { id: 'lunch', label: 'Lunch', icon: Utensils, color: 'green' },
        { id: 'meeting', label: 'Meeting', icon: Phone, color: 'purple' },
        { id: 'training', label: 'Training', icon: Clock, color: 'yellow' },
        { id: 'personal', label: 'Personal', icon: AlertCircle, color: 'orange' },
        { id: 'other', label: 'Other', icon: Clock, color: 'gray' },
    ];

    if (!isOpen) return null;

    const handlePause = async () => {
        if (!selectedReason) {
            alert('Please select a pause reason');
            return;
        }

        const reason = selectedReason === 'other' ? customReason : selectedReason;
        if (!reason) {
            alert('Please provide a reason');
            return;
        }

        setIsSubmitting(true);
        try {
            await onPause(reason);
            // Show success state
            setSuccessAction('pause');
            setShowSuccess(true);
            // Wait for state to update and show success
            setTimeout(() => {
                setSelectedReason('');
                setCustomReason('');
                setIsSubmitting(false);
                setShowSuccess(false);
                setSuccessAction('');
                onClose();
            }, 800);
        } catch (error) {
            console.error('Failed to pause:', error);
            alert('Failed to pause. Please try again.');
            setIsSubmitting(false);
        }
    };

    const handleResume = async () => {
        setIsSubmitting(true);
        try {
            await onResume();
            // Show success state
            setSuccessAction('resume');
            setShowSuccess(true);
            // Wait for state to update and show success
            setTimeout(() => {
                setIsSubmitting(false);
                setShowSuccess(false);
                setSuccessAction('');
                onClose();
            }, 800);
        } catch (error) {
            console.error('Failed to resume:', error);
            alert('Failed to resume. Please try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        {isPaused ? (
                            <Play className="w-6 h-6 text-black" />
                        ) : (
                            <Pause className="w-6 h-6 text-black" />
                        )}
                        <h2 className="text-xl font-bold text-black">
                            {isPaused ? 'Resume Work' : 'Pause Work'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-black hover:bg-black/10 rounded-lg p-1 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Success Message */}
                    {showSuccess && (
                        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3 animate-slide-down">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                            <div>
                                <p className="text-green-800 font-semibold">
                                    {successAction === 'pause' ? 'Paused Successfully!' : 'Resumed Successfully!'}
                                </p>
                                <p className="text-green-600 text-sm">
                                    {successAction === 'pause' ? 'You won\'t receive new calls' : 'You can now receive calls'}
                                </p>
                            </div>
                        </div>
                    )}

                    {isPaused ? (
                        // Resume View
                        <div className="space-y-4">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-sm text-gray-700">
                                    <span className="font-semibold">Current Status:</span> Paused
                                </p>
                                <p className="text-sm text-gray-700 mt-1">
                                    <span className="font-semibold">Reason:</span> {currentPauseReason}
                                </p>
                            </div>
                            {!showSuccess && (
                                <p className="text-gray-600">
                                    Click the button below to resume taking calls.
                                </p>
                            )}
                            <button
                                onClick={handleResume}
                                disabled={isSubmitting}
                                className={`w-full font-bold py-3 rounded-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                    showSuccess 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-green-500 hover:bg-green-600 text-white'
                                }`}
                            >
                                {showSuccess ? (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        <span>Success!</span>
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-5 h-5" />
                                        <span>{isSubmitting ? 'Resuming...' : 'Resume Work'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        // Pause View
                        <div className="space-y-4">
                            <p className="text-gray-600 text-sm">
                                Select a reason for pausing. You won't receive new calls until you resume.
                            </p>

                            {/* Reason Selection Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {pauseReasons.map((reason) => {
                                    const Icon = reason.icon;
                                    const isSelected = selectedReason === reason.id;
                                    return (
                                        <button
                                            key={reason.id}
                                            onClick={() => setSelectedReason(reason.id)}
                                            className={`p-4 rounded-lg border-2 transition-all ${
                                                isSelected
                                                    ? 'border-yellow-500 bg-yellow-50'
                                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                            }`}
                                        >
                                            <Icon
                                                className={`w-6 h-6 mx-auto mb-2 ${
                                                    isSelected ? 'text-yellow-600' : 'text-gray-500'
                                                }`}
                                            />
                                            <span
                                                className={`text-sm font-medium ${
                                                    isSelected ? 'text-yellow-700' : 'text-gray-700'
                                                }`}
                                            >
                                                {reason.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Custom Reason Input */}
                            {selectedReason === 'other' && (
                                <div className="animate-slide-down">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Specify Reason
                                    </label>
                                    <input
                                        type="text"
                                        value={customReason}
                                        onChange={(e) => setCustomReason(e.target.value)}
                                        placeholder="Enter your reason..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                                        autoFocus
                                    />
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex space-x-3 pt-2">
                                <button
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePause}
                                    disabled={isSubmitting || !selectedReason || (selectedReason === 'other' && !customReason)}
                                    className={`flex-1 px-4 py-3 font-bold rounded-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                        showSuccess 
                                            ? 'bg-green-500 text-white' 
                                            : 'bg-yellow-500 hover:bg-yellow-600 text-black'
                                    }`}
                                >
                                    {showSuccess ? (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            <span>Success!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Pause className="w-5 h-5" />
                                            <span>{isSubmitting ? 'Pausing...' : 'Pause'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-down {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.2s ease-out;
                }
                .animate-slide-down {
                    animation: slide-down 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default PauseModal;

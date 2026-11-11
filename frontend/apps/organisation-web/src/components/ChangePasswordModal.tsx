import React, { useState } from 'react';
import { Lock, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { chapterWorkflowApi } from '@/services/chapterWorkflowApi';
import { authStorage } from '@/utils/authStorage';

interface Props {
  isOpen: boolean;
  isForced?: boolean;
  initialCurrentPassword?: string;
  identifier?: string;
  onSuccess: () => void;
  onClose?: () => void;
}

export function ChangePasswordModal({
  isOpen,
  isForced = false,
  initialCurrentPassword = '',
  identifier,
  onSuccess,
  onClose,
}: Props) {
  const [currentPassword, setCurrentPassword] = useState(initialCurrentPassword);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      if (initialCurrentPassword) {
        setCurrentPassword(initialCurrentPassword);
      } else if (!currentPassword) {
        setCurrentPassword('Leader@123');
      }
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen, initialCurrentPassword]);

  if (!isOpen) return null;

  // Validation rules
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const isDifferentFromDefault =
    newPassword.trim() !== 'Leader@123' &&
    newPassword.trim() !== 'Sethu@123456' &&
    newPassword.trim() !== 'Password@123';
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isValid =
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasDigit &&
    isDifferentFromDefault &&
    passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!currentPassword) {
      setErrorMessage('Current password is required.');
      return;
    }

    if (!isValid) {
      if (!hasMinLength) setErrorMessage('New password must be at least 8 characters.');
      else if (!hasUppercase) setErrorMessage('New password must contain at least one uppercase letter (A-Z).');
      else if (!hasLowercase) setErrorMessage('New password must contain at least one lowercase letter (a-z).');
      else if (!hasDigit) setErrorMessage('New password must contain at least one numeric digit (0-9).');
      else if (!isDifferentFromDefault) setErrorMessage('New password must differ from default system passwords.');
      else if (!passwordsMatch) setErrorMessage('New passwords do not match.');
      return;
    }

    let targetIdentifier = identifier || '';
    if (!targetIdentifier) {
      const sess = authStorage.getActiveSession();
      if (sess) {
        targetIdentifier = sess.email || sess.identifier || '';
      }
    }

    setLoading(true);
    try {
      const res = await chapterWorkflowApi.changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
        confirmNewPassword: confirmPassword.trim(),
        identifier: targetIdentifier || undefined,
      });

      if (res.success) {
        setSuccessMessage('Password changed successfully! Securing leadership session…');
        // Update local session
        const sess = authStorage.getActiveSession();
        if (sess) {
          sess.mustChangePassword = false;
          authStorage.setActiveSession(sess);
        }

        setTimeout(() => {
          onSuccess();
        }, 800);
      } else {
        setErrorMessage(res.message || 'Failed to change password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: isForced
              ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
              : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            padding: '24px',
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lock size={20} className="text-white" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#ffffff' }}>
                {isForced ? 'Mandatory Password Setup' : 'Change Account Password'}
              </h2>
              <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '4px 0 0 0' }}>
                {isForced
                  ? 'First login detected. You must set a new secure password to proceed.'
                  : 'Update your leadership account credentials'}
              </p>
            </div>
          </div>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', color: '#0f172a' }}>
          {errorMessage && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '16px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
              }}
            >
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Current Password */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label htmlFor="current-pwd-input" style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                Current Password *
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setCurrentPassword('Leader@123')}
                  style={{
                    background: '#e0f2fe',
                    color: '#0369a1',
                    border: '1px solid #bae6fd',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    cursor: 'pointer',
                  }}
                  title="Click to fill default Leader@123"
                >
                  Fill Leader@123
                </button>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="current-pwd-input"
                name="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password (default: Leader@123)"
                required
                className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  width: '100%',
                  padding: '10px 60px 10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #94a3b8',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  color: '#0f172a',
                  WebkitTextFillColor: '#0f172a',
                  backgroundColor: '#ffffff',
                  caretColor: '#0284c7',
                }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#0284c7',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px',
                }}
              >
                {showCurrent ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div style={{ marginBottom: '14px' }}>
            <label htmlFor="new-pwd-input" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              New Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="new-pwd-input"
                name="newPassword"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                autoFocus={true}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 digit"
                required
                className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  width: '100%',
                  padding: '10px 60px 10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #94a3b8',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  color: '#0f172a',
                  WebkitTextFillColor: '#0f172a',
                  backgroundColor: '#ffffff',
                  caretColor: '#0284c7',
                }}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#0284c7',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px',
                }}
              >
                {showNew ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="confirm-pwd-input" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Confirm New Password *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="confirm-pwd-input"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                required
                className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  width: '100%',
                  padding: '10px 60px 10px 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #94a3b8',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  color: '#0f172a',
                  WebkitTextFillColor: '#0f172a',
                  backgroundColor: '#ffffff',
                  caretColor: '#0284c7',
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#0284c7',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px',
                }}
              >
                {showConfirm ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>

          {/* Validation Checklist */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              fontSize: '12px',
            }}
          >
            <div style={{ fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Security Requirements:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <div style={{ color: hasMinLength ? '#15803d' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{hasMinLength ? '✓' : '○'}</span> At least 8 characters
              </div>
              <div style={{ color: hasUppercase ? '#15803d' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{hasUppercase ? '✓' : '○'}</span> One uppercase letter
              </div>
              <div style={{ color: hasLowercase ? '#15803d' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{hasLowercase ? '✓' : '○'}</span> One lowercase letter
              </div>
              <div style={{ color: hasDigit ? '#15803d' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{hasDigit ? '✓' : '○'}</span> One numeric number
              </div>
              <div style={{ color: isDifferentFromDefault ? '#15803d' : '#e11d48', gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>{isDifferentFromDefault ? '✓' : '✕'}</span> Cannot be default password (Leader@123)
              </div>
              {confirmPassword.length > 0 && (
                <div style={{ color: passwordsMatch ? '#15803d' : '#e11d48', gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>{passwordsMatch ? '✓' : '✕'}</span> Passwords match
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            {!isForced && onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !isValid}
              style={{
                padding: '9px 22px',
                borderRadius: '8px',
                border: 'none',
                background: isValid && !loading ? '#0284c7' : '#94a3b8',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: isValid && !loading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ShieldCheck size={16} />
              {loading ? 'Changing Password…' : isForced ? 'Set Password & Enter Portal' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

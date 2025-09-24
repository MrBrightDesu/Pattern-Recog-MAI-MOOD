import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import ErrorPopup from './ErrorPopup';
import './Login.css';

function Login({ onToggleMode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      setShowErrorPopup(true);
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password);
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = '';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'ไม่พบผู้ใช้นี้ในระบบ';
          break;
        case 'auth/wrong-password':
          errorMessage = 'รหัสผ่านไม่ถูกต้อง';
          break;
        case 'auth/invalid-email':
          errorMessage = 'รูปแบบอีเมลไม่ถูกต้อง';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'มีการพยายามเข้าสู่ระบบมากเกินไป กรุณาลองใหม่ภายหลัง';
          break;
        default:
          errorMessage = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      }
      setError(errorMessage);
      setShowErrorPopup(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseErrorPopup = () => {
    setShowErrorPopup(false);
    setError('');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>เข้าสู่ระบบ</h1>
          <p>ยินดีต้อนรับสู่ Emotion Detection App</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">

          <div className="input-group">
            <div className="input-wrapper">
              <Mail className="input-icon" />
              <input
                type="email"
                placeholder="อีเมล"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-input"
              />
            </div>
          </div>

          <div className="input-group">
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="รหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="auth-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-button primary"
          >
            {loading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <LogIn className="button-icon" />
                เข้าสู่ระบบ
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            ยังไม่มีบัญชี?{' '}
            <button
              type="button"
              onClick={onToggleMode}
              className="auth-link"
            >
              <UserPlus className="link-icon" />
              สมัครสมาชิก
            </button>
          </p>
        </div>
      </div>
      
      {/* Error Popup */}
      <ErrorPopup
        isOpen={showErrorPopup}
        onClose={handleCloseErrorPopup}
        title="เกิดข้อผิดพลาด"
        message={error}
        type="error"
      />
    </div>
  );
}

export default Login;

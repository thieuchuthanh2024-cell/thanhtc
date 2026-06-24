"use client";

import React, { useState } from "react";
import { X, Lock, Mail, Phone, User, Shield, CheckCircle, AlertCircle, Key, UserPlus } from "lucide-react";
import { AgentProfile, AgentRole } from "@/types";

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (agent: AgentProfile) => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  
  // Register Fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AgentRole>("Cộng tác viên");
  const [regPassword, setRegPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Quick helper accounts to click
  const mockAccounts = [
    { email: "admin@kho-sim.vn", pass: "admin123", role: "Admin", label: "Admin - Gốc" },
    { email: "hung@gmail.com", pass: "123456", role: "Đại lý cấp 1", label: "Đại lí cấp 1 (Hà Đông)" },
    { email: "duc.ctv@gmail.com", pass: "123456", role: "Cộng tác viên", label: "Cộng tác viên" },
  ];

  const handleMockClick = (acc: { email: string; pass: string }) => {
    setCredential(acc.email);
    setPassword(acc.pass);
    setIsLogin(true);
    setError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credential || !password) {
      setError("Vui lòng nhập Email/SĐT và Mật khẩu.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Đăng nhập thất bại.");
      }

      setSuccessMsg("Đăng nhập thành công!");
      setTimeout(() => {
        onSuccess(data.agent);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || "Kết nối API thất bại.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !email || !regPassword) {
      setError("Vui lòng điền đầy đủ tất cả các thông tin.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          password: regPassword,
          role,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Đăng ký thất bại.");
      }

      setSuccessMsg("Đăng ký tài khoản đại lý thành công! Đang đăng nhập tự động...");
      setTimeout(() => {
        onSuccess(data.agent);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Kết nối API thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" id="auth-modal-screen">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 relative flex flex-col" id="auth-modal-card">
        {/* Brand Banner */}
        <div className="bg-gradient-to-r from-[#003366] to-[#001f3f] px-6 py-6 text-white relative">
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-all cursor-pointer"
            id="close-auth-modal"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="space-y-1">
            <span className="bg-[#FFD700] text-[#003366] px-2 py-0.5 rounded-sm text-[10px] font-extrabold uppercase tracking-widest">
              PRODUCTIVE SECURITY CARD
            </span>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#FFD700]" /> CỔNG THÀNH VIÊN VIETSIM
            </h2>
            <p className="text-xs text-blue-100">Đăng nhập tài khoản đại lý nguồn hoặc CTV bán SIM số đẹp</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-150 text-sm">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`w-1/2 py-3 text-center font-bold border-b-2 transition-all cursor-pointer ${
              isLogin ? "border-[#003366] text-[#003366]" : "border-transparent text-slate-500 hover:text-[#003366]"
            }`}
          >
            ĐĂNG NHẬP
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`w-1/2 py-3 text-center font-bold border-b-2 transition-all cursor-pointer ${
              !isLogin ? "border-[#003366] text-[#003366]" : "border-transparent text-slate-500 hover:text-[#003366]"
            }`}
          >
            ĐĂNG KÝ HỢP TÁC
          </button>
        </div>

        {/* Feedback Messages */}
        <div className="px-6 pt-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg flex items-start gap-2 text-xs text-red-700 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded-lg flex items-start gap-2 text-xs text-emerald-700">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Form area */}
        <div className="p-6">
          {isLogin ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block uppercase">Email hoặc Số điện thoại</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    placeholder="Ví dụ: admin@kho-sim.vn"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#003366] focus:ring-1 focus:ring-[#003366]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block uppercase">Mật khẩu bảo mật</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#003366] focus:ring-1 focus:ring-[#003366]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#003366] hover:bg-blue-800 text-white font-bold py-3 rounded-xl shadow-md transition-all text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? "Đang xác minh..." : "XÁC NHẬN ĐĂNG NHẬP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 overflow-y-auto max-h-[350px] pr-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block uppercase">Họ và Tên Đối tác</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn Hải"
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#003366]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block uppercase">Số Điện Thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#003366]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 block uppercase">Địa Chỉ Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="hai@gmail.com"
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#003366]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block uppercase font-sans">Chọn Tài Khoản Muốn Đắp Cấp</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AgentRole)}
                  className="w-full bg-white border border-slate-200 text-slate-800 px-3 py-2 rounded-xl text-xs font-bold focus:outline-none focus:border-[#003366]"
                >
                  <option value="Đại lý cấp 1">Đại lý cấp 1 (Nhận chiết khấu 20%)</option>
                  <option value="Đại lý cấp 2">Đại lý cấp 2 (Nhận chiết khấu 15%)</option>
                  <option value="Partner">Đối tác Partner (Nhận chiết khấu 12%)</option>
                  <option value="Cộng tác viên">Cộng tác viên CTV (Nhận chiết khấu 10%)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 block uppercase">Thiết lập Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mật khẩu tối thiểu 6 ký tự"
                    minLength={6}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#003366]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#003366] hover:bg-blue-800 text-white font-bold py-2.5 rounded-xl shadow-md transition-all text-xs cursor-pointer flex items-center justify-center gap-1"
              >
                <UserPlus className="w-4 h-4" /> {loading ? "Đang khởi tạo tài khoản..." : "ĐĂNG KÝ NGAY"}
              </button>
            </form>
          )}

          {/* Quick-helper accounts to click */}
          {isLogin && (
            <div className="mt-5 pt-4 border-t border-slate-150 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                Mẫu thử nghiệm trực quan (Click để điền tài khoản)
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {mockAccounts.map((acc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleMockClick(acc)}
                    className="bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded-xl px-3 py-1.5 text-[11px] text-left flex justify-between items-center transition-all cursor-pointer group"
                  >
                    <div>
                      <span className="font-semibold text-slate-700">{acc.label}:</span>{" "}
                      <span className="text-slate-500 font-mono italic">{acc.email}</span>
                    </div>
                    <span className="text-[9px] bg-blue-100 text-[#003366] px-1.5 py-0.5 rounded font-mono group-hover:scale-105 transition-all">
                      Pass: {acc.pass}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

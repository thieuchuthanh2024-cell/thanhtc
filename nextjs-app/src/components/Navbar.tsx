"use client";

import React, { useState } from "react";
import { Phone, Users, Shield, ArrowLeftRight, Sparkles, TrendingUp, ShoppingBag, LogIn, LogOut, BookOpen, Menu, X } from "lucide-react";
import { AgentRole, AgentProfile } from "@/types";
import VietsimLogo from "@/components/VietsimLogo";

interface NavbarProps {
  activeRole: AgentRole;
  currentAgent: AgentProfile | null;
  onChangeRole: (role: AgentRole) => void;
  activeTab: string;
  onChangeTab: (tab: string) => void;
  cartCount: number;
  isProductionMode: boolean;
  onChangeMode: (prod: boolean) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  allowSimulation: boolean;
}

export default function Navbar({
  activeRole,
  currentAgent,
  onChangeRole,
  activeTab,
  onChangeTab,
  cartCount,
  isProductionMode,
  onChangeMode,
  onOpenAuth,
  onLogout,
  allowSimulation,
}: NavbarProps) {
  const roles: AgentRole[] = ["Khách hàng", "Admin", "Đại lý cấp 1", "Đại lý cấp 2", "Partner", "Cộng tác viên"];
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileAdminOpen, setIsMobileAdminOpen] = useState(false);
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const dropdownTimeoutRef = React.useRef<any>(null);

  const handleAdminMouseEnter = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setIsAdminDropdownOpen(true);
  };

  const handleAdminMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setIsAdminDropdownOpen(false);
    }, 500); // 500ms delay to allow smooth transition down to submenu
  };

  React.useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  return (
    <nav className="bg-[#003366] text-white shadow-md sticky top-0 z-40" id="app-navbar">
      {/* Simulation Ribbon - Hidden if in Production Mode */}
      {!isProductionMode && (
        <div className="bg-[#001f3f] text-xs py-2 px-4 border-b border-blue-900/45 text-slate-300 flex flex-wrap gap-2 items-center justify-between animate-fadeIn" id="role-panel">
          <div className="flex items-center gap-2 font-mono">
            <Shield className="w-4 h-4 text-[#FFD700] animate-pulse shrink-0" />
            <span className="font-bold tracking-wider text-slate-100 uppercase text-[10px] sm:text-xs">
              MÔ PHỎNG VAI TRÒ HỆ THỐNG:
            </span>
          </div>

          {/* Desktop/Tablet - Row of pills */}
          <div className="hidden sm:flex flex-wrap gap-1.5 items-center">
            {roles.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onChangeRole(r)}
                className={`px-3 py-1 rounded-full font-medium transition-all text-xs cursor-pointer ${
                  activeRole === r
                    ? "bg-[#FFD700] text-[#003366] font-bold shadow-md scale-102"
                    : "bg-slate-800/60 text-slate-200 hover:bg-slate-800/80"
                }`}
                id={`role-btn-${r}`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Mobile (Safari/iPhone) - Space Saving Dropdown select */}
          <div className="flex sm:hidden w-full mt-1.5 items-center justify-between gap-2 border-t border-blue-950/40 pt-2">
            <span className="text-[10px] text-slate-400 shrink-0 font-bold uppercase">Chuyển vai trò nhanh:</span>
            <select
              value={activeRole}
              onChange={(e) => onChangeRole(e.target.value as AgentRole)}
              className="bg-[#002244] text-[#FFD700] font-bold text-xs py-1 px-2 rounded border border-blue-800 focus:outline-none flex-1 max-w-[160px] cursor-pointer"
              id="role-mobile-select"
            >
              {roles.map((r) => (
                <option key={r} value={r} className="bg-[#002244] text-white">
                  🔑 {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo Brand */}
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => onChangeTab("search")}>
            <VietsimLogo className="w-9 h-9 sm:w-10 sm:h-10 drop-shadow-md shrink-0" />
            <div className="leading-none">
              <h1 className="font-sans font-black text-lg sm:text-xl tracking-tight text-white flex items-center gap-0.5">
                VIET<span className="text-[#FFD700]">SIM</span>
              </h1>
              <p className="font-mono text-[8px] sm:text-[9px] text-blue-200 tracking-wider uppercase">
                Đại Lý Toàn Quốc
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex space-x-1">
            <button
              onClick={() => onChangeTab("search")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "search" ? "bg-[#002244] text-[#FFD700] font-bold" : "text-blue-100 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> Tra cứu Kho Số</span>
            </button>

            <button
              onClick={() => onChangeTab("ai-consult")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === "ai-consult" ? "bg-[#002244] text-[#FFD700] font-bold" : "text-blue-100 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[#FFD700]" /> Tư vấn Phong Thủy AI</span>
            </button>

            <button
              onClick={() => onChangeTab("orders")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all relative ${
                activeTab === "orders" ? "bg-[#002244] text-[#FFD700] font-bold" : "text-blue-100 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4" /> Đơn Hàng
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                    {cartCount}
                  </span>
                )}
              </span>
            </button>

            {activeRole === "Admin" ? (
              <div 
                className="relative"
                onMouseEnter={handleAdminMouseEnter}
                onMouseLeave={handleAdminMouseLeave}
                id="admin-parent-dropdown-wrapper"
              >
                <button
                  type="button"
                  onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    ["agents", "sims-sync", "reports", "guide"].includes(activeTab)
                      ? "bg-[#002244] text-[#FFD700]"
                      : "text-blue-100 hover:text-white"
                  }`}
                  id="admin-parent-dropdown-btn"
                >
                  <Shield className="w-4 h-4 text-[#FFD700]" /> Admin ▾
                </button>

                {isAdminDropdownOpen && (
                  <div 
                    className="absolute left-0 mt-1.5 w-52 bg-[#002244] border border-blue-900 rounded-xl shadow-lg py-2 z-50 animate-fadeIn"
                    id="admin-parent-dropdown"
                  >
                    <button
                      onClick={() => {
                        onChangeTab("agents");
                        setIsAdminDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-all hover:bg-[#003366] hover:text-[#FFD700] ${
                        activeTab === "agents" ? "text-[#FFD700] bg-[#003366]" : "text-blue-100"
                      }`}
                    >
                      👥 Quản lý Đại lý
                    </button>
                    
                    <button
                      onClick={() => {
                        onChangeTab("sims-sync");
                        setIsAdminDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-all hover:bg-[#003366] hover:text-[#FFD700] ${
                        activeTab === "sims-sync" ? "text-[#FFD700] bg-[#003366]" : "text-blue-100"
                      }`}
                    >
                      🔄 Đồng bộ Kho số
                    </button>
                    
                    <button
                      onClick={() => {
                        onChangeTab("reports");
                        setIsAdminDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-all hover:bg-[#003366] hover:text-[#FFD700] ${
                        activeTab === "reports" ? "text-[#FFD700] bg-[#003366]" : "text-blue-100"
                      }`}
                    >
                      📈 Báo Cáo Doanh Thu
                    </button>
                    
                    <button
                      onClick={() => {
                        onChangeTab("packages-admin");
                        setIsAdminDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-all hover:bg-[#003366] hover:text-[#FFD700] ${
                        activeTab === "packages-admin" ? "text-[#FFD700] bg-[#003366]" : "text-blue-100"
                      }`}
                    >
                      📶 Gói cước & Nhà mạng
                    </button>

                    <button
                      onClick={() => {
                        onChangeTab("guide");
                        setIsAdminDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-all hover:bg-[#003366] hover:text-[#FFD700] ${
                        activeTab === "guide" ? "text-[#FFD700] bg-[#003366]" : "text-blue-100"
                      }`}
                    >
                      📖 Hướng Dẫn Sử Dụng
                    </button>

                    <button
                      onClick={() => {
                        onChangeTab("sql-admin");
                        setIsAdminDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center gap-2 transition-all hover:bg-[#003366] hover:text-[#FFD700] ${
                        activeTab === "sql-admin" ? "text-[#FFD700] bg-[#003366]" : "text-blue-100"
                      }`}
                    >
                      🛠️ Truy vấn SQL
                    </button>
                  </div>
                )}
              </div>
            ) : (
              activeRole !== "Khách hàng" && (
                <>
                  <button
                    onClick={() => onChangeTab("agents")}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      activeTab === "agents" ? "bg-[#002244] text-[#FFD700] font-bold" : "text-blue-100 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" /> Chiết Khấu Sim
                    </span>
                  </button>

                  <button
                    onClick={() => onChangeTab("reports")}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      activeTab === "reports" ? "bg-[#002244] text-[#FFD700] font-bold" : "text-blue-100 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> Báo Cáo Doanh Thu</span>
                  </button>
                </>
              )
            )}
          </div>

          {/* Active Partner Info, Login & Mode Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Mode Toggle Slider - Hidden on Mobile, placed securely in Desktop or drawer */}
            {allowSimulation && (
              <div className="hidden md:flex bg-blue-950/80 p-0.5 rounded-lg border border-blue-900 items-center text-[10px] font-mono select-none">
                <button
                  type="button"
                  onClick={() => onChangeMode(true)}
                  title="Yêu cầu tài khoản đăng nhập để có quyền đại lý/admin"
                  className={`px-2 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                    isProductionMode 
                      ? "bg-[#003366] text-[#FFD700] border-l border-blue-800 shadow-sm" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  🔒 Thực tế
                </button>
                <button
                  type="button"
                  onClick={() => onChangeMode(false)}
                  title="Mở thanh chuyển đổi nhanh vai trò"
                  className={`px-2 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                    !isProductionMode 
                      ? "bg-[#003366] text-[#FFD700] border-r border-blue-800 shadow-sm" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  🛠️ Mô phỏng
                </button>
              </div>
            )}

            {/* Authentication state indicator - Compact on mobile header */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {currentAgent ? (
                <>
                  <div className="hidden sm:flex flex-col items-end pl-2">
                    <span className="font-sans font-bold text-xs text-slate-100 line-clamp-1 max-w-[120px]">
                      {currentAgent.name}
                    </span>
                    <span className="font-sans text-[9px] text-[#FFD700] font-semibold bg-blue-950/40 px-1 py-0.5 border border-blue-800 rounded">
                      {currentAgent.role}
                    </span>
                  </div>
                  <button
                    onClick={onLogout}
                    title="Đăng xuất khỏi hệ thống"
                    className="p-1.5 sm:p-2 rounded-lg bg-red-950/40 text-red-100 hover:bg-red-900 hover:text-white border border-red-900/60 transition-all cursor-pointer flex items-center justify-center"
                    id="btn-logout"
                  >
                    <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="hidden sm:flex bg-[#FFD700] hover:bg-[#ffe043] text-[#003366] font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-sm items-center gap-1 cursor-pointer whitespace-nowrap"
                  id="btn-login"
                >
                  <LogIn className="w-3.5 h-3.5 stroke-[2.5]" /> Đăng nhập
                </button>
              )}
            </div>

            {/* Mobile Direct Dropdown Navigation - Perfect for Safari iPhone, securely sized */}
            <select
              value={activeTab}
              onChange={(e) => onChangeTab(e.target.value)}
              className="md:hidden bg-[#002244] text-[#FFD700] hover:text-white font-bold text-[11px] py-1.5 px-2 rounded-lg border border-blue-850/80 focus:outline-none focus:ring-1 focus:ring-[#FFD700] max-w-[95px] xs:max-w-[120px] cursor-pointer text-ellipsis overflow-hidden font-sans"
              aria-label="Menu nhanh"
              id="mobile-tab-dropdown-select"
            >
              <option value="search" className="bg-[#002244] text-[#FFD700]">🔍 Tìm số</option>
              <option value="ai-consult" className="bg-[#002244] text-white">✨ Phong thủy</option>
              <option value="orders" className="bg-[#002244] text-white">🛒 Đơn hàng</option>
              {activeRole === "Admin" ? (
                <optgroup label="👑 PANEL ADMIN" className="bg-[#002244] text-[#FFD700]">
                  <option value="agents" className="bg-[#002244] text-white">👥 Quản lý ĐL</option>
                  <option value="sims-sync" className="bg-[#002244] text-white">🔄 Đồng bộ kho</option>
                  <option value="reports" className="bg-[#002244] text-white">📈 Doanh thu</option>
                  <option value="guide" className="bg-[#002244] text-white">📖 HD Admin</option>
                  <option value="sql-admin" className="bg-[#002244] text-white">🛠️ Truy vấn SQL</option>
                </optgroup>
              ) : (
                activeRole !== "Khách hàng" && (
                  <>
                    <option value="agents" className="bg-[#002244] text-white">👥 Chiết khấu</option>
                    <option value="reports" className="bg-[#002244] text-white">📈 Doanh thu</option>
                  </>
                )
              )}
            </select>

            {/* Hamburger Menu on Mobile - Aligned nicely on the right of the mobile dropdown/logo */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 sm:p-2 rounded-lg text-blue-100 hover:text-white hover:bg-blue-900/40 focus:outline-none transition-all cursor-pointer flex items-center justify-center border border-blue-900/60"
              aria-label="Toggle navigation menu"
              id="btn-mobile-menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dynamic Navigation Panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#002244] border-t border-blue-900/60 px-4 py-4 space-y-3 animate-fadeIn" id="mobile-menu-drawer">
          <div className="flex flex-col space-y-1">
            <button
              onClick={() => {
                onChangeTab("search");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "search" ? "bg-[#003366] text-[#FFD700] font-bold" : "text-blue-100 hover:bg-slate-800/20"
              }`}
            >
              <Phone className="w-4 h-4" /> Tra cứu Kho Số
            </button>

            <button
              onClick={() => {
                onChangeTab("ai-consult");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "ai-consult" ? "bg-[#003366] text-[#FFD700] font-bold" : "text-blue-100 hover:bg-slate-800/20"
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#FFD700]" /> Tư vấn Phong Thủy AI
            </button>

            <button
              onClick={() => {
                onChangeTab("orders");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                activeTab === "orders" ? "bg-[#003366] text-[#FFD700] font-bold" : "text-blue-100 hover:bg-slate-800/20"
              }`}
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" /> Đơn Hàng
              </span>
              {cartCount > 0 && (
                <span className="bg-red-600 px-2 py-0.5 rounded-full text-white text-[10px] font-bold">
                  {cartCount} mới
                </span>
              )}
            </button>

            {activeRole === "Admin" ? (
              <div className="space-y-1 block border-t border-blue-900/40 pt-3" id="mobile-admin-accordion">
                <button
                  type="button"
                  onClick={() => setIsMobileAdminOpen(!isMobileAdminOpen)}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold text-[#FFD700] hover:bg-slate-800/10 flex items-center justify-between cursor-pointer border border-blue-900/40 bg-blue-950/20"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#FFD700]" /> ADMIN PANEL (XỔ DỌC)
                  </span>
                  <span>{isMobileAdminOpen ? "▲" : "▼"}</span>
                </button>
                
                {isMobileAdminOpen && (
                  <div className="pl-4 py-1.5 space-y-1 bg-blue-950/30 p-2 rounded-lg border border-blue-900/30 animate-fadeIn" id="mobile-admin-accordion-content">
                    <button
                      onClick={() => {
                        onChangeTab("agents");
                        setIsMobileAdminOpen(false);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                        activeTab === "agents" ? "bg-[#003366] text-[#FFD700] font-bold" : "text-blue-200 hover:bg-slate-800/20"
                      }`}
                    >
                      👥 Quản lý Đại lý
                    </button>
                    
                    <button
                      onClick={() => {
                        onChangeTab("sims-sync");
                        setIsMobileAdminOpen(false);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                        activeTab === "sims-sync" ? "bg-[#003366] text-[#FFD700] font-bold" : "text-blue-200 hover:bg-slate-800/20"
                      }`}
                    >
                      🔄 Đồng bộ Kho số
                    </button>
                    
                    <button
                      onClick={() => {
                        onChangeTab("reports");
                        setIsMobileAdminOpen(false);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                        activeTab === "reports" ? "bg-[#003366] text-[#FFD700] font-bold" : "text-blue-200 hover:bg-slate-800/20"
                      }`}
                    >
                      📈 Báo Cáo Doanh Thu
                    </button>
                    
                    <button
                      onClick={() => {
                        onChangeTab("packages-admin");
                        setIsMobileAdminOpen(false);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                        activeTab === "packages-admin" ? "bg-[#003366] text-[#FFD700] font-bold" : "text-blue-200 hover:bg-slate-800/20"
                      }`}
                    >
                      📶 Gói cước & Nhà mạng
                    </button>

                    <button
                      onClick={() => {
                        onChangeTab("guide");
                        setIsMobileAdminOpen(false);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                        activeTab === "guide" ? "bg-[#003366] text-[#FFD700] font-bold" : "text-blue-200 hover:bg-slate-800/20"
                      }`}
                    >
                      📖 Hướng Dẫn Sử Dụng
                    </button>

                    <button
                      onClick={() => {
                        onChangeTab("sql-admin");
                        setIsMobileAdminOpen(false);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                        activeTab === "sql-admin" ? "bg-[#003366] text-[#FFD700] font-bold" : "text-blue-200 hover:bg-slate-800/20"
                      }`}
                    >
                      🛠️ Truy vấn SQL
                    </button>
                  </div>
                )}
              </div>
            ) : (
              activeRole !== "Khách hàng" && (
                <>
                  <button
                    onClick={() => {
                      onChangeTab("agents");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === "agents" ? "bg-[#003366] text-[#FFD700] font-bold" : "text-blue-100 hover:bg-slate-800/20"
                    }`}
                  >
                    <Users className="w-4 h-4" /> Chiết Khấu Sim
                  </button>

                  <button
                    onClick={() => {
                      onChangeTab("reports");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === "reports" ? "bg-[#003366] text-[#FFD700] font-bold" : "text-blue-100 hover:bg-slate-800/20"
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" /> Báo Cáo Doanh Thu
                  </button>
                </>
              )
            )}
          </div>

          {/* Partner Status Inside Mobile Panel */}
          {currentAgent ? (
            <div className="pt-3 border-t border-blue-900/60 flex items-center justify-between px-3">
              <div className="flex flex-col">
                <span className="font-sans font-bold text-xs text-slate-150">
                  {currentAgent.name}
                </span>
                <span className="font-sans text-[9px] text-[#FFD700] font-semibold bg-[#003366] px-1.5 py-0.5 border border-blue-900/60 rounded w-fit mt-0.5">
                  {currentAgent.role}
                </span>
              </div>
              <button
                onClick={() => {
                  onLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-red-950/40 text-red-105 hover:bg-red-900 hover:text-white border border-red-900/40 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Đăng xuất
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-blue-900/40 px-3">
              <button
                onClick={() => {
                  onOpenAuth();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-[#FFD700] hover:bg-[#ffe043] text-[#003366] font-extrabold py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 stroke-[2.5]" /> Đăng nhập hệ thống
              </button>
            </div>
          )}

          {/* Simulation config toggle for mobile screens */}
          {allowSimulation && (
            <div className="pt-3 border-t border-blue-900/40 flex items-center justify-between px-3">
              <span className="text-xs font-bold text-slate-300">Chế độ hệ thống:</span>
              <div className="bg-blue-950 p-0.5 rounded-lg border border-blue-900/60 flex items-center text-[10px] font-mono select-none">
                <button
                  type="button"
                  onClick={() => {
                    onChangeMode(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    isProductionMode 
                      ? "bg-[#003366] text-[#FFD700] shadow" 
                      : "text-slate-400"
                  }`}
                >
                  🔒 Thực tế
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChangeMode(false);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    !isProductionMode 
                      ? "bg-[#003366] text-[#FFD700] shadow" 
                      : "text-slate-400"
                  }`}
                >
                  🛠️ Mô phỏng
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

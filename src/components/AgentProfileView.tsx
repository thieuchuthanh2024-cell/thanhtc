import React, { useState, useEffect } from "react";
import { Users, Percent, DollarSign, Plus, Edit2, Check, X, ShieldAlert, Award, Phone } from "lucide-react";
import { AgentProfile, AgentRole } from "../types";

interface AgentProfileViewProps {
  activeRole: AgentRole;
  onChangeRole: (role: AgentRole) => void;
  agents: AgentProfile[];
  onUpdateAgent: (agent: AgentProfile) => Promise<void>;
}

export default function AgentProfileView({
  activeRole,
  onChangeRole,
  agents,
  onUpdateAgent,
}: AgentProfileViewProps) {
  const currentAgent = agents.find((a) => a.role === activeRole);

  // Form states for creating/editing agent
  const [editingAgent, setEditingAgent] = useState<AgentProfile | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    role: "Đại lý cấp 1" as AgentRole,
    discountRate: 15,
    phone: "",
    email: "",
  });

  const handleEditClick = (ag: AgentProfile) => {
    setEditingAgent(ag);
    setFormData({
      id: ag.id,
      name: ag.name,
      role: ag.role,
      discountRate: ag.discountRate * 100,
      phone: ag.phone,
      email: ag.email,
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedAgent: AgentProfile = {
      id: formData.id || "ag-" + Math.random().toString(36).slice(2, 9),
      name: formData.name,
      role: formData.role,
      discountRate: Number(formData.discountRate) / 100,
      phone: formData.phone,
      email: formData.email,
      commissionEarned: editingAgent ? editingAgent.commissionEarned : 0,
      totalSales: editingAgent ? editingAgent.totalSales : 0,
    };

    await onUpdateAgent(updatedAgent);
    setEditingAgent(null);
    setShowAddForm(false);
    setFormData({ id: "", name: "", role: "Đại lý cấp 1", discountRate: 15, phone: "", email: "" });
  };

  return (
    <div className="space-y-6" id="agent-view-panel">
      {/* 1. Header Banner depending on active view */}
      {activeRole === "Admin" ? (
        <div className="bg-gradient-to-r from-[#003366] to-[#001f3f] rounded-2xl p-6 sm:p-8 text-white shadow-md border-l-4 border-[#FFD700]">
          <div className="max-w-xl space-y-2">
            <span className="bg-[#FFD700] text-[#003366] px-3 py-1 rounded-sm text-[10px] font-extrabold uppercase tracking-wider">
              Bảng kiểm soát Đặc Quyền Quản Trị
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Quản Trị Phân Quyền Đại Lý & Chiết Khấu
            </h2>
            <p className="text-xs text-blue-100">
              Kiểm tra cấp bậc đại lý toàn quốc, thiết lập phần trăm hoa hồng hoa hồng trích thưởng (từ cộng tác viên đến đại lý nguồn cấp 1 miền) và phân phối đơn hàng trực tiếp.
            </p>
          </div>
        </div>
      ) : currentAgent ? (
        <div className="bg-gradient-to-r from-[#001f3f] to-[#003366] rounded-2xl p-6 sm:p-8 text-white shadow-md border-l-4 border-[#FFD700] grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-2 md:col-span-2">
            <span className="bg-[#FFD700] text-[#003366] px-2.5 py-1 rounded-sm text-[10px] font-extrabold uppercase tracking-wider">
              Khu Vực Chuyên Biệt Cho Đối Tác SIM
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Chào Đại lý, {currentAgent.name}!
            </h2>
            <p className="text-xs text-blue-100">
              Bạn đang được áp dụng cơ chế giá lấy buôn **Chiết khấu {(currentAgent.discountRate * 100).toFixed(0)}%** trực tiếp vào giá thanh toán. Doanh thu của bạn sẽ được tích lũy vào hoa hồng hàng tháng.
            </p>
          </div>
          {/* Key agent metrics widget */}
          <div className="bg-white/10 hover:bg-white/15 transition-all outline outline-white/20 p-4 rounded-xl flex items-center justify-between col-span-1">
            <div className="space-y-1">
              <span className="text-[10px] text-[#FFD700] uppercase tracking-widest font-bold">
                Hoa hồng khả dụng
              </span>
              <p className="text-2xl font-black font-sans text-[#FFD700]">
                {currentAgent.commissionEarned.toLocaleString("vi-VN")} <span className="text-xs">đ</span>
              </p>
            </div>
            <Award className="w-10 h-10 text-[#FFD700] shrink-0 stroke-2" />
          </div>
        </div>
      ) : (
        <div className="bg-teal-50 border border-teal-100 rounded-3xl p-6 flex gap-3 text-teal-800">
          <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold">HƯỚNG DẪN ĐỊNH DANH ĐẠI LÝ:</h4>
            <p>Khách hàng vãng lai không được hưởng chính sách giá buôn. Hãy sử dụng thanh mô phỏng vai trò màu cam đen phía đỉnh màn hình để nhảy vào các tài khoản Đại lý Cấp 1, Cấp 2 hoặc CTV để thử nghiệm tính năng chiết khấu giá đại lý!</p>
          </div>
        </div>
      )}

      {/* 2. Visual summary widgets for Admin */}
      {activeRole === "Admin" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="admin-summary-box">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400">Số lượng Đại lý</p>
              <h4 className="text-2xl font-extrabold text-slate-800">{agents.length}</h4>
            </div>
            <Users className="w-10 h-10 text-indigo-500/10" />
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400">Chiết khấu max</p>
              <h4 className="text-2xl font-extrabold text-indigo-600">
                {(Math.max(...agents.map((a) => a.discountRate)) * 100).toFixed(0)}%
              </h4>
            </div>
            <Percent className="w-10 h-10 text-indigo-500/10" />
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400">Doanh thu Đối tác</p>
              <h4 className="text-2xl font-extrabold text-emerald-600">
                {agents.reduce((acc, a) => acc + a.totalSales, 0).toLocaleString("vi-VN")} đ
              </h4>
            </div>
            <DollarSign className="w-10 h-10 text-emerald-500/10" />
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400">Tổng hoa hồng chia sẻ</p>
              <h4 className="text-2xl font-extrabold text-slate-800">
                {agents.reduce((acc, a) => acc + a.commissionEarned, 0).toLocaleString("vi-VN")} đ
              </h4>
            </div>
            <Percent className="w-10 h-10 text-indigo-500/10" />
          </div>
        </div>
      )}

      {/* 3. Main Console Tables */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="agent-table-panel">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
          <div>
            <h3 className="font-sans font-bold text-base text-slate-800">
              {activeRole === "Admin" ? "Bảng Danh Sách Đại Lý & Chính Sách" : "Thông Tin Liên Hệ Đại Lý Của Bạn"}
            </h3>
            <p className="text-[11px] text-slate-400">
              {activeRole === "Admin" ? "Cập nhật cấu hình phân quyền" : "Mọi đơn hàng liên kết sẽ cộng hoa hồng nợ tại kho tổng này"}
            </p>
          </div>

          {activeRole === "Admin" && !showAddForm && !editingAgent && (
            <button
              onClick={() => {
                setShowAddForm(true);
                setFormData({ id: "", name: "", role: "Đại lý cấp 1", discountRate: 15, phone: "", email: "" });
              }}
              className="bg-[#003366] hover:bg-blue-800 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Thêm Đại lý mới
            </button>
          )}
        </div>

        {/* Dynamic add / edit form widget */}
        {(showAddForm || editingAgent) && (
          <form onSubmit={handleFormSubmit} className="p-6 bg-slate-50/50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
            <h4 className="col-span-1 md:col-span-3 font-sans font-bold text-xs text-slate-500 uppercase tracking-widest">
              {editingAgent ? `CẬP NHẬT ĐỐI TÁC: ${editingAgent.name}` : "ĐĂNG KÝ THÔNG TIN ĐẠI LÝ ĐỐI TÁC MỚI"}
            </h4>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 block">Tên đại lý / Nhà bán</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Nguyễn Văn Cường"
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 block">Cấp bậc / Phân quyền đại lý</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as AgentRole })}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
              >
                <option value="Đại lý cấp 1">Đại lý cấp 1 (Kho sỉ lớn - 20%)</option>
                <option value="Đại lý cấp 2">Đại lý cấp 2 (Điểm bán lẻ - 15%)</option>
                <option value="Partner">Đối tác Partner thương mại (12%)</option>
                <option value="Cộng tác viên">Cộng tác viên tự do (10%)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 block">Được hưởng chiết khấu (%)</label>
              <input
                type="number"
                required
                min={0}
                max={40}
                value={formData.discountRate}
                onChange={(e) => setFormData({ ...formData, discountRate: Number(e.target.value) })}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 block">Số điện thoại</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="09xx.xxx.xxx"
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 block">Email giao dịch</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="dealer@gmail.com"
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
              />
            </div>

            <div className="flex gap-2 items-end md:col-span-1 justify-end pt-4">
              <button
                type="button"
                onClick={() => {
                  setEditingAgent(null);
                  setShowAddForm(false);
                }}
                className="bg-white hover:bg-slate-100 border border-slate-200 rounded-lg px-4 py-2 text-xs font-bold text-slate-600 transition-colors cursor-pointer"
              >
                Huỷ bỏ
              </button>
              <button
                type="submit"
                className="bg-[#003366] hover:bg-blue-850 text-white rounded-lg px-4 py-2 text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Lưu lại thông tin
              </button>
            </div>
          </form>
        )}

        {/* Display Grid of Current agents */}
        <div className="overflow-x-auto">
          {activeRole === "Admin" ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-100">
                  <th className="px-6 py-3.5 font-bold">Đối tác / Đại lý</th>
                  <th className="px-6 py-3.5 font-bold">Phân quyền vai trò</th>
                  <th className="px-6 py-3.5 font-bold">Hệ số Chiết khấu</th>
                  <th className="px-6 py-3.5 font-bold">Doanh số đã bán</th>
                  <th className="px-6 py-3.5 font-bold">Hoa hồng tích lũy</th>
                  <th className="px-6 py-3.5 font-bold">Liên kết liên lạc</th>
                  <th className="px-6 py-3.5 font-bold text-right">Tuỳ chọn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                {agents.map((ag) => (
                  <tr key={ag.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{ag.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{ag.id}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        ag.role === "Admin"
                          ? "bg-slate-900 text-white"
                          : ag.role === "Đại lý cấp 1"
                          ? "bg-red-100 text-red-700"
                          : ag.role === "Đại lý cấp 2"
                          ? "bg-blue-100 text-blue-700"
                          : ag.role === "Partner"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-purple-100 text-purple-700"
                      }`}>
                        {ag.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-800">
                      {(ag.discountRate * 100).toFixed(0)}%
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {ag.totalSales.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">
                      {ag.commissionEarned.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="px-6 py-4 space-y-0.5">
                      <p className="font-semibold">{ag.phone}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{ag.email}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {ag.role !== "Admin" ? (
                        <button
                          onClick={() => handleEditClick(ag)}
                          className="text-indigo-600 hover:text-indigo-900 p-1 bg-slate-100 hover:bg-slate-200 rounded transition whitespace-nowrap inline-flex items-center gap-1 cursor-pointer font-semibold text-[11px]"
                        >
                          <Edit2 className="w-3 h-3" /> Chỉnh sửa
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Hệ thống nguồn</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center space-y-3">
              <Percent className="w-12 h-12 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h4 className="font-sans font-bold text-slate-800 text-sm">Chính sách Đại lý của của bạn</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Đại lý được quyền phân phối SIM của tổng kho, ăn chênh lệch giá buôn bằng cách tự lên đơn cho khách. Hoặc chia sẻ link liên kết CTV để hưởng hoa hồng thụ động trực tiếp.
                </p>
              </div>
              <div className="inline-block bg-slate-50 border border-slate-150 rounded-xl p-4 text-left space-y-1">
                <p className="text-xs">👋 Tên: <strong>{currentAgent ? currentAgent.name : "Khách vãng lai"}</strong></p>
                <p className="text-xs">🤝 Quyền đắc dụng: <strong>{currentAgent ? currentAgent.role : "Khách hàng mua lẻ"}</strong></p>
                <p className="text-xs">💰 Mức bù sỉ mặc định: <strong>{currentAgent ? (currentAgent.discountRate * 100) : 0}%</strong></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

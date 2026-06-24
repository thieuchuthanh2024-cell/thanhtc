import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Check, RefreshCw, Layers, Wifi, PhoneCall, MessageSquare, Tag, AlertCircle } from "lucide-react";

interface MobileNetwork {
  id: string;
  name: string;
  logo: string;
  notes: string;
}

interface MobilePackage {
  id: string;
  networkId: string;
  name: string;
  monthlyFee: number;
  minutesInternal: number;
  minutesExternal: number;
  smsInternal: number;
  smsExternal: number;
  dataGb: number;
  dataLimitText: string;
  outOfBundleCharge: string;
  isMandatory: boolean;
}

export default function PackagesAdminView() {
  const [activeSubTab, setActiveSubTab] = useState<"networks" | "packages">("networks");
  
  // Data States
  const [networksList, setNetworksList] = useState<MobileNetwork[]>([]);
  const [packagesList, setPackagesList] = useState<MobilePackage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter package list by network
  const [filterNetworkId, setFilterNetworkId] = useState<string>("All");

  // Models for Add/Edit Form
  const [editingNetworkId, setEditingNetworkId] = useState<string | null>(null);
  const [networkForm, setNetworkForm] = useState({
    id: "",
    name: "",
    logo: "#003366",
    notes: ""
  });

  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [packageForm, setPackageForm] = useState({
    id: "",
    networkId: "",
    name: "",
    monthlyFee: 120000,
    minutesInternal: 1000,
    minutesExternal: 50,
    smsInternal: 0,
    smsExternal: 0,
    dataGb: 60,
    dataLimitText: "2GB/Ngày",
    outOfBundleCharge: "Hết data ngừng truy cập",
    isMandatory: false
  });

  // Modal open states
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);

  // Fetch lists on mount
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const resN = await fetch("/api/networks");
      if (resN.ok) {
        const dataN = await resN.json();
        setNetworksList(dataN);
      }
      
      const resP = await fetch("/api/packages");
      if (resP.ok) {
        const dataP = await resP.json();
        setPackagesList(dataP);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Không thể kết nối đến máy chủ để tải danh mục hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Alert message triggers
  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // ---------------- NETWORKS WORKFLOW ----------------
  const handleOpenAddNetwork = () => {
    setEditingNetworkId(null);
    setNetworkForm({
      id: "",
      name: "",
      logo: "#003366",
      notes: ""
    });
    setShowNetworkModal(true);
  };

  const handleOpenEditNetwork = (net: MobileNetwork) => {
    setEditingNetworkId(net.id);
    setNetworkForm({
      id: net.id,
      name: net.name,
      logo: net.logo || "#003366",
      notes: net.notes || ""
    });
    setShowNetworkModal(true);
  };

  const handleSaveNetwork = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    if (!networkForm.name.trim()) {
      setErrorMsg("Vui lòng điền tên nhà mạng.");
      return;
    }

    try {
      const isEdit = !!editingNetworkId;
      const url = isEdit ? `/api/networks/${editingNetworkId}` : "/api/networks";
      const method = isEdit ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(networkForm)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Giao dịch lưu nhà mạng thất bại.");
      }

      await fetchData();
      setShowNetworkModal(false);
      triggerSuccess(isEdit ? "Cập nhật nhà mạng thành công!" : "Khởi tạo nhà mạng mới thành công!");
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteNetwork = async (id: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa nhà mạng "${id}"? Tất cả các sim liên quan sẽ mất liên kết.`)) {
      return;
    }
    setErrorMsg(null);
    try {
      const response = await fetch(`/api/networks/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error("Lỗi xóa liên kết nhà mạng từ cơ sở dữ liệu.");
      }
      await fetchData();
      triggerSuccess("Đã xóa nhà mạng khỏi tổng kho số!");
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // ---------------- PACKAGES WORKFLOW ----------------
  const handleOpenAddPackage = () => {
    setEditingPackageId(null);
    setPackageForm({
      id: "",
      networkId: networksList[0]?.id || "",
      name: "",
      monthlyFee: 120000,
      minutesInternal: 1000,
      minutesExternal: 50,
      smsInternal: 0,
      smsExternal: 0,
      dataGb: 60,
      dataLimitText: "2GB/Ngày",
      outOfBundleCharge: "Hết data ngừng truy cập",
      isMandatory: false
    });
    setShowPackageModal(true);
  };

  const handleOpenEditPackage = (pkg: MobilePackage) => {
    setEditingPackageId(pkg.id);
    setPackageForm({
      id: pkg.id,
      networkId: pkg.networkId,
      name: pkg.name,
      monthlyFee: pkg.monthlyFee,
      minutesInternal: pkg.minutesInternal || 0,
      minutesExternal: pkg.minutesExternal || 0,
      smsInternal: pkg.smsInternal || 0,
      smsExternal: pkg.smsExternal || 0,
      dataGb: pkg.dataGb || 0,
      dataLimitText: pkg.dataLimitText || "",
      outOfBundleCharge: pkg.outOfBundleCharge || "",
      isMandatory: !!pkg.isMandatory
    });
    setShowPackageModal(true);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!packageForm.networkId) {
      setErrorMsg("Vui lòng chọn một nhà mạng cung cấp.");
      return;
    }
    if (!packageForm.name.trim()) {
      setErrorMsg("Vui lòng nhập tên gói cước.");
      return;
    }

    try {
      const isEdit = !!editingPackageId;
      const url = isEdit ? `/api/packages/${editingPackageId}` : "/api/packages";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(packageForm)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Giao dịch lưu gói cước thất bại.");
      }

      await fetchData();
      setShowPackageModal(false);
      triggerSuccess(isEdit ? "Đã cập nhật tính năng của gói cước thành công!" : "Tạo gói cước mới thành công!");
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!window.confirm("Bạn có tin chắc muốn xóa gói cước này không?")) {
      return;
    }
    setErrorMsg(null);
    try {
      const response = await fetch(`/api/packages/${id}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error("Lỗi xóa gói cước khỏi database.");
      }
      await fetchData();
      triggerSuccess("Đã xóa vĩnh viễn gói cước!");
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const filteredPackages = filterNetworkId === "All"
    ? packagesList
    : packagesList.filter(p => p.networkId === filterNetworkId);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-md space-y-8" id="packages-admin-dashboard">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 font-sans tracking-tight">
            QUẢN LÝ GÓI CƯỚC & NHÀ MẠNG
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Thiết lập danh mục nhà sim, thông số kỹ thuật của các gói ưu đãi đi kèm và gói cam kết bắt buộc.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Đọc lại dữ liệu
        </button>
      </div>

      {/* Alert Notices */}
      {errorMsg && (
        <div className="flex items-center gap-2.5 bg-red-50 text-red-700 text-xs font-bold p-4 rounded-2xl border border-red-100">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2.5 bg-emerald-50 text-emerald-800 text-xs font-bold p-4 rounded-2xl border border-emerald-100 animate-fadeIn">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Selector Subtabs */}
      <div className="flex border-b border-slate-100 pb-0 gap-2">
        <button
          onClick={() => { setActiveSubTab("networks"); setErrorMsg(null); }}
          className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === "networks"
              ? "border-b-2 border-[#003366] text-[#003366]"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Layers className="w-4 h-4" /> (1) Sách nhà mạng ({networksList.length})
        </button>
        <button
          onClick={() => { setActiveSubTab("packages"); setErrorMsg(null); }}
          className={`pb-3 px-4 text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === "packages"
              ? "border-b-2 border-[#003366] text-[#003366]"
              : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Wifi className="w-4 h-4" /> (2) Kho gói cước ({packagesList.length})
        </button>
      </div>

      {loading && (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-[#003366] rounded-full animate-spin"></div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Đang nạp bộ mã nhà mạng...</span>
        </div>
      )}

      {!loading && activeSubTab === "networks" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-500 font-mono">
              Tổng số nhà mạng liên kết hệ thống: <b>{networksList.length} nhà mạng</b>
            </span>
            <button
              onClick={handleOpenAddNetwork}
              className="flex items-center gap-1 px-4 py-2 text-xs font-bold bg-[#003366] text-white hover:bg-opacity-90 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm nhà mạng
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {networksList.map((net) => (
              <div
                key={net.id}
                className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 hover:border-[#003366]/40 hover:shadow-xs transition-all relative overflow-hidden flex flex-col justify-between min-h-[140px]"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <span 
                      className="w-5 h-5 rounded-full border border-slate-200 shrink-0"
                      style={{ backgroundColor: net.logo }}
                    ></span>
                    <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">{net.name}</h3>
                    <code className="text-[10px] font-mono uppercase bg-slate-200/60 text-slate-600 px-1.5 py-0.5 rounded ml-auto">
                      ID: {net.id}
                    </code>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {net.notes || "Không có tài liệu thuyết minh."}
                  </p>
                </div>

                <div className="flex justify-end gap-1.5 border-t border-slate-100/80 pt-3 mt-4">
                  <button
                    onClick={() => handleOpenEditNetwork(net)}
                    className="flex p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                    title="Chỉnh sửa thông số nhà mạng"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteNetwork(net.id)}
                    className="flex p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                    title="Xóa nhà mạng"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && activeSubTab === "packages" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-mono py-1">Lọc theo nhà mạng:</span>
              <button
                onClick={() => setFilterNetworkId("All")}
                className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all border ${
                  filterNetworkId === "All"
                    ? "bg-[#003366] text-white border-[#003366]"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                Tất cả gói ({packagesList.length})
              </button>
              {networksList.map(net => (
                <button
                  key={net.id}
                  onClick={() => setFilterNetworkId(net.id)}
                  className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all border ${
                    filterNetworkId === net.id
                      ? "bg-[#003366] text-white border-[#003366]"
                      : "bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {net.name}
                </button>
              ))}
            </div>

            <button
              onClick={handleOpenAddPackage}
              className="flex items-center gap-1 px-4 py-2 text-xs font-bold bg-[#003366] text-white hover:bg-opacity-90 rounded-xl transition-all cursor-pointer shadow-xs self-start sm:self-center"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm gói cước mới
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPackages.map((pkg) => {
              const matchedNet = networksList.find(n => n.id === pkg.networkId);
              return (
                <div
                  key={pkg.id}
                  className={`bg-white border rounded-2xl p-5 hover:shadow-xs transition-all relative overflow-hidden flex flex-col justify-between min-h-[220px] ${
                    pkg.isMandatory ? "border-amber-400 bg-amber-50/10" : "border-slate-100"
                  }`}
                >
                  <div>
                    {pkg.isMandatory && (
                      <span className="absolute top-0 right-0 bg-amber-400 text-slate-900 font-sans font-black text-[9px] px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wider">
                        Gói cam kết
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-[10px] uppercase font-mono font-bold text-[#003366]">
                        {matchedNet?.name || pkg.networkId}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{pkg.name}</h3>
                    
                    <div className="text-lg font-black text-[#003366] mt-1">
                      {pkg.monthlyFee.toLocaleString()}đ<span className="text-xs text-slate-400 font-normal"> / tháng</span>
                    </div>

                    <div className="space-y-2 mt-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                        <Plus className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span>Data tốc độ cao: <b>{pkg.dataLimitText || `${pkg.dataGb}GB`}</b></span>
                      </div>

                      {(pkg.minutesInternal > 0 || pkg.minutesExternal > 0) && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                          <PhoneCall className="w-3 h-3 text-blue-500 shrink-0" />
                          <span>
                            Gọi: <b>{pkg.minutesInternal > 0 ? `${pkg.minutesInternal}p nội mạng` : ""}</b>
                            {pkg.minutesInternal > 0 && pkg.minutesExternal > 0 ? " + " : ""}
                            <b>{pkg.minutesExternal > 0 ? `${pkg.minutesExternal}p ngoại mạng` : ""}</b>
                          </span>
                        </div>
                      )}

                      {(pkg.smsInternal > 0 || pkg.smsExternal > 0) && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                          <MessageSquare className="w-3 h-3 text-[#FF5500] shrink-0" />
                          <span>
                            SMS: <b>{pkg.smsInternal > 0 ? `${pkg.smsInternal} tin nội` : ""}</b>
                            {pkg.smsInternal > 0 && pkg.smsExternal > 0 ? " + " : ""}
                            <b>{pkg.smsExternal > 0 ? `${pkg.smsExternal} tin ngoại` : ""}</b>
                          </span>
                        </div>
                      )}

                      {pkg.outOfBundleCharge && (
                        <p className="text-[10px] text-slate-400 font-sans italic mt-1 pl-4">
                          Cước vượt gói: {pkg.outOfBundleCharge}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-1.5 border-t border-slate-100 pt-3 mt-4">
                    <button
                      onClick={() => handleOpenEditPackage(pkg)}
                      className="flex p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                      title="Chỉnh sửa thông số gói cước"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePackage(pkg.id)}
                      className="flex p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                      title="Xóa gói cước"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredPackages.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">
              Mạng hiện tại chưa đăng ký thêm bất cứ gói cước nào. Hãy nhấp "+ Thêm gói cước mới" để bắt đầu!
            </div>
          )}
        </div>
      )}

      {/* ----------------- MODAL FOR NETWORKS ----------------- */}
      {showNetworkModal && (
        <div className="fixed inset-0 bg-[#001f3f]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 border border-slate-100 shadow-xl space-y-6 animate-scaleIn">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-900 font-sans">
                {editingNetworkId ? `Hiệu chỉnh: ${editingNetworkId.toUpperCase()}` : "Thêm nhà mạng di động mới"}
              </h3>
              <button
                onClick={() => setShowNetworkModal(false)}
                className="text-slate-400 hover:text-slate-600 font-black text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNetwork} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 font-mono mb-1">MÃ NHÀ MẠNG (ID viết liền thường)</label>
                <input
                  type="text"
                  placeholder="e.g. viettel, vinaphone, mobifone"
                  disabled={!!editingNetworkId}
                  value={networkForm.id}
                  onChange={(e) => setNetworkForm({ ...networkForm, id: e.target.value })}
                  className="w-full text-xs font-mono border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#003366] shrink-0"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 font-mono mb-1">TÊN HIỂN THỊ (*)</label>
                <input
                  type="text"
                  placeholder="e.g. Viettel Mobile, VinaPhone"
                  required
                  value={networkForm.name}
                  onChange={(e) => setNetworkForm({ ...networkForm, name: e.target.value })}
                  className="w-full text-xs font-sans border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#003366]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 font-mono mb-1">MÀU BIỂU TƯỢNG (Màu Hex)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={networkForm.logo}
                    onChange={(e) => setNetworkForm({ ...networkForm, logo: e.target.value })}
                    className="w-12 h-10 border border-slate-200 rounded-lg p-1 bg-slate-50 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    required
                    placeholder="#EE0000"
                    value={networkForm.logo}
                    onChange={(e) => setNetworkForm({ ...networkForm, logo: e.target.value })}
                    className="w-full text-xs font-mono border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#003366]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 font-mono mb-1">THUYẾT MINH / GHI CHÚ</label>
                <textarea
                  placeholder="e.g. Tổng công ty viễn thông Quân Đội..."
                  rows={3}
                  value={networkForm.notes}
                  onChange={(e) => setNetworkForm({ ...networkForm, notes: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#003366]"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNetworkModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-600 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#003366] text-white hover:bg-opacity-90 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Xác nhận lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL FOR MOBILE PACKAGES ----------------- */}
      {showPackageModal && (
        <div className="fixed inset-0 bg-[#001f3f]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 sm:p-8 border border-slate-100 shadow-xl space-y-6 animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-slate-900 font-sans">
                {editingPackageId ? `Chỉnh sửa gói cước: ${packageForm.name}` : "Đăng ký gói cước mới"}
              </h3>
              <button
                onClick={() => setShowPackageModal(false)}
                className="text-slate-400 hover:text-slate-600 font-black text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 font-mono mb-1">MÃ GÓI (Độc nhất - Ẩn/Tự sinh)</label>
                  <input
                    type="text"
                    placeholder="Tự sinh nếu rỗng"
                    value={packageForm.id}
                    disabled={!!editingPackageId}
                    onChange={(e) => setPackageForm({ ...packageForm, id: e.target.value })}
                    className="w-full text-xs font-mono border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#003366]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 font-mono mb-1">CHỌN NHÀ MẠNG (*)</label>
                  <select
                    value={packageForm.networkId}
                    onChange={(e) => setPackageForm({ ...packageForm, networkId: e.target.value })}
                    className="w-full text-xs font-sans border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#003366] cursor-pointer"
                  >
                    <option value="">Chọn nhà mạng...</option>
                    {networksList.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 font-mono mb-1">TÊN GÓI CƯỚC (*)</label>
                  <input
                    type="text"
                    placeholder="e.g. V120C, YOLO100"
                    required
                    value={packageForm.name}
                    onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                    className="w-full text-xs font-sans border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#003366]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 font-mono mb-1">GIÁ THUÊ BAO THÁNG (*)</label>
                  <input
                    type="number"
                    placeholder="120000"
                    required
                    value={packageForm.monthlyFee}
                    onChange={(e) => setPackageForm({ ...packageForm, monthlyFee: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#003366]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 font-mono mb-1">DATA TỐC ĐỘ CAO (GB)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="60"
                    value={packageForm.dataGb}
                    onChange={(e) => setPackageForm({ ...packageForm, dataGb: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#003366]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 font-mono mb-1">CÁCH CHIA DATA (Hiện thị)</label>
                  <input
                    type="text"
                    placeholder="e.g. 2GB / Ngày, 10GB/tháng"
                    value={packageForm.dataLimitText}
                    onChange={(e) => setPackageForm({ ...packageForm, dataLimitText: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#003366]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 font-mono mb-1">PHÚT GỌI NỘI MẠNG</label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={packageForm.minutesInternal}
                    onChange={(e) => setPackageForm({ ...packageForm, minutesInternal: parseInt(e.target.value, 10) || 0 })}
                    className="w-full text-xs border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#003366]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 font-mono mb-1">PHÚT GỌI NGOẠI MẠNG</label>
                  <input
                    type="number"
                    placeholder="50"
                    value={packageForm.minutesExternal}
                    onChange={(e) => setPackageForm({ ...packageForm, minutesExternal: parseInt(e.target.value, 10) || 0 })}
                    className="w-full text-xs border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#003366]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 font-mono mb-1">SMS NỘI MẠNG</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={packageForm.smsInternal}
                    onChange={(e) => setPackageForm({ ...packageForm, smsInternal: parseInt(e.target.value, 10) || 0 })}
                    className="w-full text-xs border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#003366]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 font-mono mb-1">SMS NGOẠI MẠNG</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={packageForm.smsExternal}
                    onChange={(e) => setPackageForm({ ...packageForm, smsExternal: parseInt(e.target.value, 10) || 0 })}
                    className="w-full text-xs border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#003366]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 font-mono mb-1">PHÍ PHÁT SINH NGOÀI GÓI NHANH</label>
                <input
                  type="text"
                  placeholder="e.g. Hết data ngừng truy cập, Cước gọi ngoài gói 1.000đ/phút"
                  value={packageForm.outOfBundleCharge}
                  onChange={(e) => setPackageForm({ ...packageForm, outOfBundleCharge: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#003366]"
                />
              </div>

              <div className="flex items-center gap-3 bg-amber-500/10 p-4 rounded-xl border border-amber-300">
                <input
                  type="checkbox"
                  id="form-is-mandatory"
                  checked={packageForm.isMandatory}
                  onChange={(e) => setPackageForm({ ...packageForm, isMandatory: e.target.checked })}
                  className="w-4 h-4 text-[#003366] border-slate-300 focus:ring-[#003366] rounded cursor-pointer shrink-0"
                />
                <label htmlFor="form-is-mandatory" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  <b>Gói cam kết bắt buộc khi mua sim đẹp:</b> Khi được gán vào số Sim đẹp (mặc định cho Sim &ge; 50 triệu), người dùng bắt buộc phải đăng ký mua kèm gói cước, không được lựa chọn các gói khác.
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPackageModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-bold text-slate-600 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#003366] text-white hover:bg-opacity-90 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Xác nhận lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

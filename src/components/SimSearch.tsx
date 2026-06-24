import React, { useState, useEffect } from "react";
import { Search, Sliders, ChevronDown, RefreshCw, Upload, Check, ClipboardCopy, Info, HelpCircle } from "lucide-react";
import { SimCard, AgentRole, AgentProfile } from "../types";

interface SimSearchProps {
  activeRole: AgentRole;
  currentAgent: AgentProfile | null;
  onBookSim: (sim: SimCard) => void;
  onRefreshStock: () => void;
  sims: SimCard[];
  onImportSims: (text: string) => Promise<{ importedCount: number; skippedCount: number }>;
}

export default function SimSearch({
  activeRole,
  currentAgent,
  onBookSim,
  onRefreshStock,
  sims,
  onImportSims,
}: SimSearchProps) {
  // Filtering States
  const [search, setSearch] = useState("");
  const [carrier, setCarrier] = useState("All");
  const [category, setCategory] = useState("All");
  const [priceRange, setPriceRange] = useState("All");
  const [licensePlate, setLicensePlate] = useState("");
  const [sumRange, setSumRange] = useState("All");
  const [statusFilter, setStatusFilter] = useState("Active");
  
  // Advanced controls toggle
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("price-asc");

  // Admin Bulk Import State
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isSyncingFromPartner, setIsSyncingFromPartner] = useState(false);

  // Pull Stock Synchronization from Suppliers/Carriers via REST API
  const handleSyncFromPartner = async () => {
    setIsSyncingFromPartner(true);
    setImportStatus("Đang gọi API nhà mạng hoặc đại lý sỉ đối tác để lấy dữ liệu kho số thực tế...");
    setShowImport(true);
    try {
      const res = await fetch("/api/partner/sims/pull-sync", {
        method: "POST"
      });
      if (!res.ok) {
        throw new Error("Lỗi phản hồi hệ thống sỉ từ Partner Gateway");
      }
      const data = await res.json();
      if (data.success) {
        setImportStatus(
          `Đồng bộ sỉ thành công! Kết nối: [${data.details.mode}] -> ${data.syncLogMessage}. Nhập thành công ${data.details.importedFromPartner} SIM mới, bỏ qua ${data.details.skippedDuplicates} SIM trùng.`
        );
        onRefreshStock();
      } else {
        setImportStatus(`Lỗi kết nối đối tác: ${data.syncLogMessage || "Không thể đồng bộ"}`);
      }
    } catch (err: any) {
      setImportStatus(`Đồng bộ thất bại: ${err.message || "Lỗi mạng hoặc cấu hình API chưa chuẩn"}`);
    } finally {
      setIsSyncingFromPartner(false);
    }
  };

  // Server-side filtered & paginated inventory states
  const [filteredSims, setFilteredSims] = useState<SimCard[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [debouncedLicensePlate, setDebouncedLicensePlate] = useState(licensePlate);

  // Debouncing handlers to prevent backend database query floods on rapid typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedLicensePlate(licensePlate);
    }, 450);
    return () => clearTimeout(handler);
  }, [licensePlate]);

  // Reset to page 1 automatically when any query criteria is updated
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, carrier, category, priceRange, debouncedLicensePlate, sumRange, sortBy, statusFilter]);

  // Synchronous server data fetch coordinates
  const fetchSimPage = async () => {
    setLoading(true);
    try {
      const qParams = new URLSearchParams({
        paginated: "true",
        page: currentPage.toString(),
        limit: "15",
        search: debouncedSearch,
        carrier,
        category,
        priceRange,
        licensePlate: debouncedLicensePlate,
        sumRange,
        sortBy,
        status: statusFilter
      });
      const response = await fetch(`/api/sims?${qParams.toString()}`);
      if (response.ok) {
        const resJSON = await response.json();
        setFilteredSims(resJSON.items || []);
        setTotalPages(resJSON.totalPages || 1);
        setTotalCount(resJSON.totalCount || 0);
      }
    } catch (err) {
      console.error("Critical error syncing server-side SIM records list:", err);
    } finally {
      setLoading(false);
    }
  };

  // Run fetch on core state hooks changes (including props sims change which represents additions/deletions)
  useEffect(() => {
    fetchSimPage();
  }, [sims, currentPage, debouncedSearch, carrier, category, priceRange, debouncedLicensePlate, sumRange, sortBy, statusFilter]);

  // Handle BULK IMPORT ACTION
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importText.trim()) return;
    setImportStatus("Đang xử lý import...");
    try {
      const res = await onImportSims(importText);
      setImportStatus(
        `Import thành công! Thêm mới ${res.importedCount} số sim, bỏ qua ${res.skippedCount} số lỗi/trùng.`
      );
      setImportText("");
      onRefreshStock();
      setTimeout(() => setShowImport(false), 3000);
    } catch (err) {
      setImportStatus("Import thất bại. Vui lòng kiểm tra định dạng dữ liệu.");
    }
  };

  const clearAllFilters = () => {
    setSearch("");
    setCarrier("All");
    setCategory("All");
    setPriceRange("All");
    setSumRange("All");
    setLicensePlate("");
    setStatusFilter("Active");
    setSortBy("price-asc");
  };

  return (
    <div className="space-y-6" id="sim-search-container">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-r from-[#003366] to-[#001f3f] rounded-2xl p-6 sm:p-8 text-white shadow-md border-l-4 border-[#FFD700] relative overflow-hidden" id="hero-banner">
        <div className="absolute right-0 top-0 opacity-5 transform translate-x-12 translate-y-[-14px] pointer-events-none">
          <Sliders className="w-96 h-96" />
        </div>
        <div className="max-w-2xl relative z-10 space-y-3">
          <span className="bg-[#FFD700] text-[#003366] px-3 py-1 rounded-sm text-xs font-extrabold tracking-wider uppercase">
            HỆ THỐNG ĐẠI LÝ CHUYÊN NGHIỆP
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight font-sans">
            Tìm số điện thoại hoàn hảo của bạn
          </h2>
          <p className="text-sm text-blue-100 text-wrap">
            Trải nghiệm tra cứu và xử lý thông minh từ kho số toàn quốc. Sử dụng ký tự đại diện <strong className="bg-[#FFD700]/20 text-[#FFD700] px-1 py-0.5 rounded font-mono">*</strong> để lọc vị trí chính xác (ví dụ: <strong className="font-mono text-white">09*888</strong>).
          </p>
        </div>
      </div>

      {/* Primary Search Controls Grid */}
      <div className="bg-white rounded-xl p-6 shadow-xs border border-slate-200/80 space-y-4" id="controls-panel">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Main search Input with asterisk notation */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nhập số sim muốn tìm (ví dụ: *888, 098*, 091*88)..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#003366] focus:bg-white text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400"
              id="main-sim-input"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 border rounded-lg flex items-center gap-2 cursor-pointer transition-all text-sm font-semibold ${
                showFilters || licensePlate || sumRange !== "All" || priceRange !== "All"
                  ? "border-[#003366] bg-blue-50/50 text-[#003366]"
                  : "border-slate-200 hover:bg-slate-50 text-slate-600"
              }`}
            >
              <Sliders className="w-4 h-4" />
              Bộ lọc nâng cao
            </button>

            {activeRole === "Admin" && (
              <button
                onClick={() => setShowImport(!showImport)}
                className="px-4 py-3 border border-indigo-200 bg-indigo-50/30 text-indigo-600 rounded-xl flex items-center gap-2 text-sm font-bold cursor-pointer hover:bg-indigo-50 transition-all font-sans"
                id="toggle-import"
              >
                <Upload className="w-4 h-4" />
                Nhập kho số
              </button>
            )}

            <button
              onClick={onRefreshStock}
              className="p-3 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
              title="Cập nhật lại danh sách"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Admin Import panel */}
        {showImport && activeRole === "Admin" && (
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 space-y-3" id="admin-import-panel">
            <div className="flex items-start gap-2 text-indigo-800">
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold">HƯỚNG DẪN IMPORT FILE KHO SỐ:</p>
                <p>Nhập danh sách SIM thô hoặc định dạng phân tách (mỗi sim một hàng). Hỗ trợ tách các trường bằng dấu phẩy (<strong className="font-mono">,</strong>). Ví dụ:</p>
                <code className="block bg-white p-1.5 rounded font-mono border border-indigo-100/50">
                  0986777777, 85000000, Viettel, Tứ Quý<br />
                  0912168168, 12000000, Vinaphone, Lộc Phát<br />
                  0909555555, 340000000, Mobifone, Ngũ Quý
                </code>
              </div>
            </div>
            <form onSubmit={handleImportSubmit} className="space-y-2">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Nhập danh sách SIM số tại đây (mỗi hàng 1 đầu số SIM)..."
                rows={5}
                className="w-full p-3 bg-white border border-slate-300 rounded-lg font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-indigo-700 italic font-medium">
                  {importStatus || "Dữ liệu mới sẽ kế thừa cấu trúc phân loại tự động nếu bỏ trống cột"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Autogenerate mock imports
                      setImportText(
                        `0988.111.222, 1200000\n0919.888.666, 35000000\n0909.123.123, 14500000\n0888.999.000, 8500000`
                      );
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                  >
                    Mẫu thử nhanh
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold shadow cursor-pointer"
                  >
                    Thực thi Import
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Primary Carrier filtering Tabs */}
        <div>
          <span className="text-xs font-bold text-slate-400 block mb-2 font-mono uppercase tracking-widest">
            Chọn nhà mạng di động
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "All", name: "Tất cả", color: "bg-slate-100 border-slate-200 text-slate-800" },
              { id: "Viettel", name: "Viettel", color: "bg-red-50 border-red-200 text-red-600 hover:bg-red-100" },
              { id: "Vinaphone", name: "Vinaphone", color: "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100" },
              { id: "Mobifone", name: "Mobifone", color: "bg-yellow-50 border-yellow-200 text-amber-700 hover:bg-yellow-100" },
              { id: "Vietnamobile", name: "Vietnamobile", color: "bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100" },
              { id: "Wintel", name: "Wintel", color: "bg-slate-900 border-slate-700 text-white hover:bg-slate-850" },
              { id: "Itelecom", name: "iTelecom", color: "bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200" },
            ].map((op) => (
              <button
                key={op.id}
                onClick={() => setCarrier(op.id)}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                  carrier === op.id
                    ? "bg-[#003366] text-white border-[#003366] scale-102 font-extrabold shadow-sm"
                    : op.color
                }`}
              >
                {op.name}
              </button>
            ))}
          </div>
        </div>

        {/* Smart License Plate Matcher & Advanced filters expanded */}
        {(showFilters || licensePlate || statusFilter !== "Active") && (
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 text-slate-700 animate-fadeIn" id="advanced-filters">
            {/* Lọc số trùng biển số xe */}
            <div className="space-y-1 bg-white p-3 rounded-lg border border-slate-200/60 shadow-sm col-span-1">
              <label className="text-xs font-bold text-slate-500 font-mono uppercase flex items-center justify-between">
                <span>Khớp biển số đẹp VD: 29A-999.99</span>
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" title="Nếu nhập số 9999, hệ thống sẽ ưu tiên đề xuất các số SIM kết thúc bằng 9999 hoặc chứa 9999" />
              </label>
              <div className="flex items-center gap-1">
                {/* Visual License Plate design */}
                <div className="bg-slate-100 border border-slate-300 text-slate-900 rounded font-sans text-xs px-2.5 py-1.5 font-bold uppercase tracking-wide flex-shrink-0 flex items-center justify-center border-r-3">
                  Biển số
                </div>
                <input
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  placeholder="Nhập số biển xe (VD: 3456...)"
                  className="w-full p-1.5 text-xs font-bold border border-slate-200 rounded text-slate-800 focus:outline-none focus:border-red-500 font-mono tracking-wider"
                />
                {licensePlate && (
                  <button
                    onClick={() => setLicensePlate("")}
                    className="text-xs text-slate-400 hover:text-red-500 cursor-pointer p-1"
                  >
                    Xoá
                  </button>
                )}
              </div>
              <span className="text-[10px] text-slate-400 block italic leading-tight">
                Tìm các đầu SIM kết thúc bằng chuỗi trùng với xe của bạn.
              </span>
            </div>

            {/* Price Selection ranges */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 block">Chọn khoảng giá</label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="All">Tất cả mức giá</option>
                <option value="under-3m">Dưới 3 Triệu VNĐ</option>
                <option value="3m-10m">Từ 3 Triệu - 10 Triệu VNĐ</option>
                <option value="10m-50m">Từ 10 Triệu - 50 Triệu VNĐ</option>
                <option value="50m-200m">Từ 50 Triệu - 200 Triệu VNĐ</option>
                <option value="above-200m">Trên 200 Triệu VNĐ (Premium)</option>
              </select>
            </div>

            {/* Sum Range selection (Tổng số điểm) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 block">Lọc theo Tổng Điểm (Sum)</label>
              <select
                value={sumRange}
                onChange={(e) => setSumRange(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="All">Bất kỳ tổng nút nào</option>
                <option value="10-30">Nút thấp (10 - 30 điểm)</option>
                <option value="31-50">Nút trung (31 - 50 điểm)</option>
                <option value="51-70">Nút phát đạt (51 - 70 điểm)</option>
                <option value="71-90">Nút cực đẹp (71 - 90 điểm)</option>
              </select>
            </div>

            {/* Status selection */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 block">Trạng thái số</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium cursor-pointer"
              >
                <option value="Active">Mặc định (Bỏ số Đã bán)</option>
                <option value="Còn hàng">Bản ghi Còn hàng</option>
                <option value="Đã giữ chỗ">Bản ghi Đã giữ chỗ</option>
                <option value="Chờ thanh toán">Chờ thanh toán</option>
                <option value="Đã bán">Bản ghi Đã bán</option>
                <option value="All">Tất cả trạng thái</option>
              </select>
            </div>
          </div>
        )}

        {/* Clear active filter elements info bar */}
        {(search || carrier !== "All" || category !== "All" || priceRange !== "All" || licensePlate || sumRange !== "All" || statusFilter !== "Active") && (
          <div className="bg-amber-50 text-amber-800 rounded-lg p-3 text-xs flex justify-between items-center">
            <span>
              Đang áp dụng bộ lọc:{" "}
              {search && <strong>Từ khoá &quot;{search}&quot;, </strong>}
              {carrier !== "All" && <strong>Mạng {carrier}, </strong>}
              {category !== "All" && <strong>Mẫu {category}, </strong>}
              {priceRange !== "All" && <strong>Giá lọc: {priceRange}, </strong>}
              {licensePlate && <strong>Mã biển số: {licensePlate}, </strong>}
              {sumRange !== "All" && <strong>Tìm nút điểm: {sumRange}, </strong>}
              {statusFilter !== "Active" && <strong>Trạng thái: {statusFilter === "All" ? "Tất cả" : statusFilter}.</strong>}
            </span>
            <button
              onClick={clearAllFilters}
              className="text-red-600 font-bold underline hover:text-red-700 cursor-pointer shrink-0 ml-4"
            >
              Xoá tất cả bộ lọc
            </button>
          </div>
        )}

        {/* Sorting and category quick pills block */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-4 gap-4">
          <div className="flex flex-wrap gap-1.5 items-center w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-400 mr-2 font-mono uppercase">Tìm nhanh:</span>
            {["All", "Tứ Quý", "Ngũ Quý", "Lộc Phát", "Thần Tài", "Sảnh Tiến", "Tam Hoa", "Sim Taxi"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  category === cat
                    ? "bg-[#003366] text-white shadow-sm font-bold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat === "All" ? "Mọi loại số" : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 text-xs font-semibold">
            <label className="text-slate-400">Sắp xếp theo:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 cursor-pointer focus:outline-none"
            >
              <option value="price-asc">Giá tăng dần ↗</option>
              <option value="price-desc">Giá giảm dần ↘</option>
              <option value="sum-desc">Số nút cao trước ↓</option>
              <option value="sum-asc">Số nút thấp trước ↑</option>
            </select>
          </div>
        </div>
      </div>

      {/* Result inventory list */}
      <div className="space-y-4 relative" id="sim-records-grid">
        {loading && (
          <div className="absolute inset-x-0 top-0 bottom-0 bg-white/70 backdrop-blur-[1px] z-20 flex items-center justify-center rounded-2xl min-h-[300px]" style={{ pointerEvents: 'none' }}>
            <div className="flex flex-col items-center gap-2 bg-white/95 p-5 rounded-2xl shadow-lg border border-slate-100">
              <div className="w-8 h-8 border-3 border-slate-200 border-t-[#003366] rounded-full animate-spin"></div>
              <span className="text-xs font-bold text-slate-600 font-sans animate-pulse">Đang đồng bộ và truy vấn kho số từ database...</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-slate-600 text-sm font-medium px-2">
          <span>Tìm thấy <strong>{totalCount}</strong> số sim phù hợp</span>
          {licensePlate && (
            <span className="text-xs bg-amber-500/10 border border-amber-500/25 text-amber-800 font-bold px-2 py-0.5 rounded">
              Ưu tiên sim trùng đuôi biển số hoặc nút may mắn!
            </span>
          )}
        </div>

        {filteredSims.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm space-y-4">
            <Info className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-sans font-bold text-slate-800 text-lg">Không tìm thấy số SIM phù hợp</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Rất tiếc, kho số đại lý hiện tại không đáp ứng các tiêu chuẩn sàng lọc của bạn. Hãy giảm bớt bộ lọc hoặc chuyển sang mục <strong className="text-amber-500">Tư vấn Phong Thủy AI</strong> để tìm được sim ưng ý!
              </p>
            </div>
            <button
              onClick={clearAllFilters}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Đặt lại toàn bộ lọc
            </button>
          </div>
        ) : (
          <>
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-200 ${loading ? 'opacity-35' : ''}`}>
              {filteredSims.map((sim) => {
                // Calculate discounted agent price if applicable
                const discountRate = currentAgent ? currentAgent.discountRate : 0;
                const finalPrice = sim.price * (1 - discountRate);
                const isReserved = sim.status !== "Còn hàng";

                return (
                  <div
                    key={sim.id}
                    className={`bg-white rounded-xl p-5 border shadow-xs transition-all relative overflow-hidden flex flex-col justify-between ${
                      isReserved 
                        ? "border-slate-100 opacity-65" 
                        : "border-slate-250 hover:border-[#003366] hover:shadow-md"
                    }`}
                    id={`sim-card-${sim.id}`}
                  >
                    {/* Carrier Flag Sticker */}
                    <div className="flex items-center justify-between mb-3 text-xs font-bold">
                      <span className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold uppercase ${
                        sim.carrier === "Viettel"
                          ? "bg-red-600 text-white"
                          : sim.carrier === "Vinaphone"
                          ? "bg-blue-600 text-white"
                          : sim.carrier === "Mobifone"
                          ? "bg-yellow-500 text-indigo-950"
                          : "bg-slate-800 text-slate-100"
                      }`}>
                        {sim.carrier}
                      </span>
                      <span className="text-slate-400 font-mono tracking-tight bg-slate-100 px-2 py-0.5 rounded">
                        Nút: {sim.sum}
                      </span>
                    </div>

                    {/* Main SIM Number Display */}
                    <div className="space-y-1 mb-4">
                      <h3 className="font-sans font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                        {sim.number}
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                          {sim.category}
                        </span>
                        {sim.isHot && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-bold animate-pulse">
                            HOT
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sim.status === "Còn hàng"
                            ? "bg-emerald-100 text-emerald-700"
                            : sim.status === "Chờ thanh toán"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {sim.status}
                        </span>
                      </div>
                    </div>

                    {/* Price & Buying button area */}
                    <div className="border-t border-slate-100 pt-4 mt-auto space-y-3">
                      <div className="flex items-end justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">
                            Mức giá bán lẻ
                          </span>
                          <span className={`font-sans font-black text-xl text-slate-950 ${discountRate > 0 ? "line-through text-slate-400 text-xs decoration-red-500/60" : ""}`}>
                            {sim.price.toLocaleString("vi-VN")} <span className="text-xs font-normal">đ</span>
                          </span>
                        </div>

                        {discountRate > 0 && (
                          <div className="text-right space-y-0.5">
                            <span className="text-[10px] text-emerald-600 font-extrabold block uppercase tracking-wide animate-pulse">
                              Giá đại lý (-{(discountRate * 100).toFixed(0)}%)
                            </span>
                            <span className="font-sans font-black text-xl text-emerald-600">
                              {finalPrice.toLocaleString("vi-VN")} <span className="text-xs font-normal">đ</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {isReserved ? (
                        <button
                          disabled
                          className="w-full bg-slate-100 text-slate-400 py-2.5 rounded-lg text-xs font-bold font-mono tracking-wide"
                        >
                          ĐÃ ĐƯỢC GIỮ CHỖ
                        </button>
                      ) : (
                        <button
                          onClick={() => onBookSim(sim)}
                          className="w-full bg-[#003366] hover:bg-blue-800 text-white py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                        >
                          {activeRole === "Khách hàng" ? "Đặt mua sim ngay" : `Lên đơn Đại lý (${activeRole})`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls Panel */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-6 mt-6 bg-slate-50 rounded-xl p-4 gap-4" id="pagination-panel">
                <span className="text-xs text-slate-500 font-semibold animate-fade-in">
                  Đang xem <strong className="text-slate-800 font-bold">{filteredSims.length}</strong> trên <strong className="text-[#003366] font-extrabold">{totalCount.toLocaleString()}</strong> số SIM điện thoại
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1 || loading}
                    className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    ◀ Trước
                  </button>
                  
                  <div className="flex items-center gap-1 text-xs">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum = currentPage;
                      if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      if (pageNum < 1 || pageNum > totalPages) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          disabled={loading}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                            currentPage === pageNum
                              ? "bg-[#003366] text-white"
                              : "border border-slate-200 bg-white hover:bg-slate-100 text-slate-600"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || loading}
                    className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    Sau ▶
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, CheckCircle, Clock, Truck, ShieldX, CreditCard, ChevronRight, 
  RefreshCw, Clipboard, Search, ChevronLeft, AlertCircle 
} from "lucide-react";
import { Order, OrderStatus, AgentRole } from "../types";

interface OrdersViewProps {
  activeRole: AgentRole;
  orders: Order[]; // Retained for prop signature backward compatibility
  onUpdateStatus: (id: string, status: OrderStatus, paymentStatus?: string) => Promise<void>;
  onRefreshOrders: () => void;
}

export default function OrdersView({
  activeRole,
  orders: propOrders,
  onUpdateStatus,
  onRefreshOrders,
}: OrdersViewProps) {
  const [filter, setFilter] = useState<string>("All");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

  // Pagination states
  const [localOrders, setLocalOrders] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Search local state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debouncing for the order search to avoid rapid DB querying
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch orders from paginated endpoint
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const qParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        status: filter
      });
      // If there's a search query, pass it (unpaginated search or filter)
      if (debouncedSearch) {
        qParams.append("search", debouncedSearch);
      }
      
      const res = await fetch(`/api/orders?${qParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        let ordersList: Order[] = [];
        // Since backend handles compatibility:
        if (Array.isArray(data)) {
          // Fallback if backend returned raw list
          ordersList = data;
          setLocalOrders(data);
          setTotalCount(data.length);
          setTotalPages(1);
        } else {
          ordersList = data.orders || [];
          setLocalOrders(ordersList);
          setTotalCount(data.totalCount || 0);
          setTotalPages(data.totalPages || 1);
        }

        // Auto-select the first order if none is selected or selected is no longer matching
        if (ordersList.length > 0) {
          setSelectedOrder((prev) => {
            if (prev && ordersList.some((o) => o.id === prev.id)) {
              // Try to find the latest version in the newly fetched list to update statuses
              const updated = ordersList.find((o) => o.id === prev.id);
              return updated || prev;
            }
            return ordersList[0];
          });
        } else {
          setSelectedOrder(null);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tải danh sách đơn hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger loading when filters, pages, or search terms shift
  useEffect(() => {
    fetchOrders();
  }, [filter, currentPage, debouncedSearch]);

  // Auto-reset page to 1 when filters are updated
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, debouncedSearch]);

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case "Chờ duyệt":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Đang xử lý":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Đang giao":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "Đã hoàn thành":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Đã hủy":
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const handleStatusChange = async (id: string, nextStatus: OrderStatus, paymentStatus?: string) => {
    setLoadingOrderId(id);
    try {
      await onUpdateStatus(id, nextStatus, paymentStatus);
      // Reload local state to display fresh order information without total page reset
      await fetchOrders();
      // Notify parent to recalibrate central states (like header navbar pending counter badge!)
      onRefreshOrders();
      // Update details card view state container
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder((prev) => prev ? { ...prev, status: nextStatus, paymentStatus: paymentStatus || prev.paymentStatus } : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrderId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans" id="orders-dashboard-wrapper">
      
      {/* 1. Left Section: Orders list containing searchable list */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-sans font-bold text-slate-800 text-base">Hồ Sơ Đơn Hàng &amp; Vận Chuyển</h3>
            <p className="text-[11px] text-slate-400">
              Danh sách quản lý giao dịch SIM thuê bao trực tuyến (Hỗ trợ quy mô lớn)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchOrders();
                onRefreshOrders();
              }}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all cursor-pointer text-slate-500"
              title="Làm mới trạng thái đơn hàng"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Order search and utility bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-450" />
          <input
            type="text"
            placeholder="Tra cứu theo mã đơn hàng, số SIM, người mua hoặc số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-medium pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#003366] focus:bg-white transition-all shadow-inner"
          />
        </div>

        {/* Filter status tab toolbar */}
        <div className="flex flex-wrap gap-1 bg-slate-100/75 p-1 rounded-xl">
          {["All", "Chờ duyệt", "Đang xử lý", "Đang giao", "Đã hoàn thành", "Đã hủy"].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`flex-1 py-1.5 px-2 text-[10.5px] sm:text-xs font-bold rounded-lg cursor-pointer transition-all ${
                filter === st 
                  ? "bg-white text-slate-900 shadow-sm font-extrabold" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {st === "All" ? "Tất cả đơn" : st}
            </button>
          ))}
        </div>

        {/* Display date cutoff warning for completed and cancelled items */}
        {(filter === "All" || filter === "Đã hoàn thành" || filter === "Đã hủy") && (
          <div className="bg-blue-50/40 border border-blue-100/70 p-3 rounded-2xl flex items-start gap-2.5 text-blue-800 text-[11px] leading-relaxed font-sans shadow-2xs">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Để tối ưu hiệu suất cơ sở dữ liệu quy mô lớn (lên tới 1 triệu đơn hàng), các đơn hàng ở trạng thái <strong>Đã hoàn thành</strong> và <strong>Đã hủy</strong> chỉ được truy vấn hiển thị trong vòng <strong>1 năm trở lại đây</strong>.
            </span>
          </div>
        )}

        {/* Orders Cards Stack */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 relative min-h-[150px]">
          {loading ? (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-[#003366]" />
                <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Đang truy vấn database...</span>
              </div>
            </div>
          ) : null}

          {localOrders.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-semibold space-y-2">
              <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-xs">Không tìm thấy mã đơn hàng nào phù hợp với bộ lọc hiển thị hiện tại.</p>
            </div>
          ) : (
            localOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => {
                  setSelectedOrder(order);
                  // Scroll to details on mobile/small screens
                  setTimeout(() => {
                    const detailPane = document.getElementById("order-details-pane");
                    if (detailPane) {
                      detailPane.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    }
                  }, 100);
                }}
                className={`p-4 bg-slate-50 hover:bg-slate-100/50 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative ${
                  selectedOrder?.id === order.id ? "border-[#003366] bg-blue-50/20" : "border-slate-150"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-xs font-black text-slate-900 bg-slate-200/50 px-1.5 py-0.5 rounded">#{order.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${getStatusStyle(order.status)}`}>
                      {order.status}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${order.paymentStatus === "Đã thanh toán" ? "bg-emerald-100 text-emerald-700 font-extrabold border border-emerald-200" : "bg-red-100 text-red-700 border border-red-250"}`}>
                      {order.paymentStatus}
                    </span>
                    {order.packageName && (
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold border flex items-center gap-0.5 ${
                        order.isPackageMandatory 
                          ? "bg-amber-50 text-amber-805 border-amber-200 font-extrabold" 
                          : "bg-blue-50 text-[#003366] border-blue-200"
                      }`} title={order.packageDetails || ""}>
                        <span>📶</span> Gói {order.packageName}
                      </span>
                    )}
                  </div>
                  <h4 className="font-sans font-extrabold text-base text-slate-900 tracking-tight leading-snug">
                    SIM {order.simNumber} (mạng {order.carrier})
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Người mua: <strong className="text-slate-700">{order.customerName}</strong> • SĐT: {order.customerPhone}
                  </p>
                  {order.packageName && (
                    <div className="text-[10.5px] mt-1.5 bg-gradient-to-r from-blue-50/70 to-indigo-50/30 border border-blue-100/80 text-blue-900 px-2.5 py-1.5 rounded-xl space-y-0.5">
                      <p className="font-semibold flex items-center gap-1">
                        <span className="text-xs">🎁</span> Gói cước: <span className="font-bold text-slate-800">{order.packageName}</span> • <span className="font-semibold text-indigo-700">{order.packageFee?.toLocaleString("vi-VN")} đ/tháng</span> {order.isPackageMandatory ? " (Gói cam kết)" : ""}
                      </p>
                      {order.packageDetails && (
                        <p className="text-[9.5px] text-slate-500 leading-tight pl-4 font-normal">
                          Ưu đãi: {order.packageDetails}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="sm:text-right flex flex-row sm:flex-col justify-between sm:justify-end items-center sm:items-end w-full sm:w-auto border-t sm:border-t-0 border-slate-200/50 pt-2 sm:pt-0 gap-1 shrink-0">
                  <span className="text-[10px] text-slate-450 block sm:hidden font-bold uppercase tracking-wider">Tổng tiền:</span>
                  <p className="font-sans font-extrabold text-[#003366] text-sm font-black">
                    {order.discountPrice.toLocaleString("vi-VN")} đ
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono tracking-tight bg-slate-150 px-1.5 py-0.5 rounded">
                    {new Date(order.createdAt).toLocaleDateString("vi-VN") + " " + new Date(order.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* PAGINATION PANEL FOOTER */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs select-none">
            <span className="text-slate-500 font-medium font-sans">
              Hiển thị <strong className="text-slate-800">{localOrders.length}</strong> / <strong className="text-slate-800">{totalCount.toLocaleString("vi-VN")}</strong> đơn hàng
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1 || loading}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer flex items-center justify-center"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-bold text-slate-700 font-sans tracking-wide">
                Trang {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages || loading}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-white transition-all cursor-pointer flex items-center justify-center"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Right Section: Live Timeline Tracking & Admin Actions Control Console */}
      <div id="order-details-pane" className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm lg:col-span-1 space-y-5">
        <h3 className="font-sans font-bold text-slate-800 text-sm border-b border-slate-50 pb-3">
          Chi Tiết Lộ Trình Cấp Số &amp; Tác Vụ
        </h3>

        {selectedOrder ? (
          <div className="space-y-5 animate-fadeIn">
            {/* Summary parameters card */}
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase font-mono">
                <span>Mã vận chuyển: #{selectedOrder.id}</span>
                <span className="text-pink-600">Thanh toán: {selectedOrder.paymentMethod.toUpperCase()}</span>
              </div>
              <p className="font-sans font-black text-xl text-slate-950 leading-none">
                SIM {selectedOrder.simNumber}
              </p>
              <div className="text-xs space-y-1 text-slate-700 leading-snug pt-1">
                <p>Khách hàng: <strong>{selectedOrder.customerName}</strong></p>
                <p>Điện thoại giao dịch: <strong>{selectedOrder.customerPhone}</strong></p>
                <p>Nơi nhận sim: <strong className="text-slate-400 text-[11px] font-medium block leading-tight">{selectedOrder.customerAddress}</strong></p>
                
                {selectedOrder.packageName ? (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3.5 mt-2 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">📶</span>
                        <div>
                          <p className="text-[10px] font-bold text-blue-900 leading-none">Gói cước đăng ký kèm</p>
                          <p className="text-[8px] text-[#003366]/70 uppercase tracking-wide font-mono font-bold mt-0.5">{selectedOrder.carrier}</p>
                        </div>
                      </div>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold border ${
                        selectedOrder.isPackageMandatory 
                          ? "bg-amber-100 text-amber-805 border-amber-200" 
                          : "bg-blue-100 text-blue-800 border-blue-200"
                      }`}>
                        {selectedOrder.isPackageMandatory ? "🎗️ Cam kết sử dụng" : "✨ Gói tự chọn"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-white/80 p-2 rounded-lg border border-blue-50">
                      <div>
                        <span className="text-slate-400 font-sans block text-[9px]">Tên gói cước:</span>
                        <strong className="text-slate-900 text-xs font-black">{selectedOrder.packageName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 font-sans block text-[9px]">Cước phí:</span>
                        <strong className="text-indigo-950 font-mono text-xs font-bold">
                          {selectedOrder.packageFee?.toLocaleString("vi-VN") || "0"} đ<span className="text-[8px] font-normal text-slate-500">/tháng</span>
                        </strong>
                      </div>
                    </div>

                    {selectedOrder.packageDetails && (
                      <div className="text-[10px] text-slate-600 bg-white/40 border border-blue-50/50 p-2 rounded-lg">
                        <span className="font-bold text-[#003366] uppercase tracking-wider block text-[7px] font-mono mb-0.5">Ưu đãi của gói cước:</span>
                        <p className="leading-snug text-slate-650">
                          {selectedOrder.packageDetails}
                        </p>
                      </div>
                    )}

                    {selectedOrder.isPackageMandatory && (
                      <div className="bg-amber-50/80 border border-amber-100 rounded-lg p-2">
                        <p className="text-[8px] text-amber-900 leading-normal font-sans">
                          * Đây là SIM đẹp có gói cam kết sử dụng 12 tháng, không được tự ý huỷ gói hoặc đổi nhà mạng trong chu kỳ cam kết.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 mt-2 text-left">
                    <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 leading-none">
                      <span className="opacity-60">📶</span> Gói cước đăng ký kèm: <span className="text-slate-400 font-semibold font-sans">Không đăng ký gói cước bổ sung (Mua SIM trần)</span>
                    </p>
                  </div>
                )}

                {selectedOrder.agentRole && (
                  <p className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mt-2 inline-block">
                     Thuộc sỉ buôn: {selectedOrder.agentRole}
                  </p>
                )}
              </div>
            </div>

            {/* PIPELINE LIVE PROGRESS TRACKING VISUALIZER */}
            <div className="space-y-4 pt-1" id="timeline-pipeline">
              <span className="text-[10px] text-slate-450 font-bold block uppercase tracking-wider font-mono">
                Lịch sử lưu trình đấu nối chính chủ:
              </span>

              <div className="relative border-l border-slate-200/80 pl-5 ml-2.5 space-y-4 text-xs">
                {/* Stage 1: Đăng ký */}
                <div className="relative">
                  <div className={`absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full ring-4 ring-white flex items-center justify-center ${
                    selectedOrder.status !== "Đã hủy" ? "bg-emerald-500" : "bg-slate-350"
                  }`}></div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800 leading-none">Tiếp nhận đơn &amp; Giữ sim</p>
                    <p className="text-[10px] text-slate-400">Khách hàng đặt số trực tuyến, hệ thống khóa số an toàn.</p>
                  </div>
                </div>

                {/* Stage 2: Đấu sóng hoặc Xác nhận */}
                <div className="relative">
                  <div className={`absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full ring-4 ring-white flex items-center justify-center ${
                    selectedOrder.status === "Đang xử lý" || selectedOrder.status === "Đang giao" || selectedOrder.status === "Đã hoàn thành"
                      ? "bg-emerald-500"
                      : "bg-slate-200"
                  }`}></div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800 leading-none">Khai báo thông tin chính chủ</p>
                    <p className="text-[10px] text-slate-400">Kiểm tra thông tin căn cước, đấu sóng mạng viễn thông quốc tế.</p>
                  </div>
                </div>

                {/* Stage 3: Chuyển phát nhanh */}
                <div className="relative">
                  <div className={`absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full ring-4 ring-white flex items-center justify-center ${
                    selectedOrder.status === "Đang giao" || selectedOrder.status === "Đã hoàn thành"
                      ? "bg-emerald-500"
                      : "bg-slate-200"
                  }`}></div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800 leading-none">Chuyển phát bưu điện (COD / Grab)</p>
                    <p className="text-[10px] text-slate-400">Vận chuyển thẻ nhựa / quét eSIM mã QR qua email đối tác.</p>
                  </div>
                </div>

                {/* Stage 4: Hoàn thành */}
                <div className="relative">
                  <div className={`absolute -left-[27px] top-0.5 w-3.5 h-3.5 rounded-full ring-4 ring-white flex items-center justify-center ${
                    selectedOrder.status === "Đã hoàn thành" ? "bg-emerald-500" : "bg-slate-200"
                  }`}></div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800 leading-none">Bàn giao &amp; Đóng hồ sơ</p>
                    <p className="text-[10px] text-slate-400">Sóng ổn định, kích hoạt thành công đơn hàng vĩnh viễn.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ADMIN CONTROLS CONSOLE SECTION */}
            {activeRole === "Admin" && (
              <div className="border-t border-slate-100 pt-4 space-y-3.5 bg-slate-50 p-4 rounded-2xl" id="admin-actions-belt">
                <div className="flex items-center gap-1.5 text-indigo-900">
                  <Clock className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider font-mono">
                    Khung Thao Tác Của Quản Trị Viên
                  </span>
                </div>

                {loadingOrderId === selectedOrder.id ? (
                  <div className="text-center p-2 text-xs text-slate-400 font-bold">
                    Đang gửi thông tin API nhà mạng...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedOrder.status === "Chờ duyệt" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(selectedOrder.id, "Đang xử lý", "Đã thanh toán")}
                          className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black cursor-pointer leading-tight text-center"
                        >
                          Duyệt &amp; Khai báo
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(selectedOrder.id, "Đã hủy")}
                          className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-100 rounded-lg text-[10px] font-bold cursor-pointer leading-tight text-center"
                        >
                          Hủy đơn hàng
                        </button>
                      </>
                    )}

                    {selectedOrder.status === "Đang xử lý" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(selectedOrder.id, "Đang giao")}
                          className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black cursor-pointer leading-tight text-center"
                        >
                          Bàn giao bưu cục giao
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(selectedOrder.id, "Đã hủy")}
                          className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold cursor-pointer leading-tight text-center"
                        >
                          Hủy đơn
                        </button>
                      </>
                    )}

                    {selectedOrder.status === "Đang giao" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(selectedOrder.id, "Đã hoàn thành")}
                          className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black cursor-pointer leading-tight text-center"
                        >
                          Xác nhận thành công ✔
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(selectedOrder.id, "Đã hủy")}
                          className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold cursor-pointer leading-tight text-center"
                        >
                          Báo trả hàng / Hủy
                        </button>
                      </>
                    )}

                    {selectedOrder.status === "Đã hoàn thành" && (
                      <span className="col-span-2 text-center text-xs text-slate-400 italic">
                        Đơn hàng đã hoàn tất vĩnh viễn, quý khách không cần thao tác thêm.
                      </span>
                    )}

                    {selectedOrder.status === "Đã hủy" && (
                      <span className="col-span-2 text-center text-xs text-red-500 italic font-mono font-bold">
                        ĐƠN ĐÃ HỦY VÀ HOÀN TRẢ SỐ VỀ KHO
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <Clipboard className="w-12 h-12 mx-auto text-slate-200" />
            <p className="text-xs">
              Vui lòng click vào một đơn hàng bất kỳ trong danh sách bên cạnh để kiểm tra tiến độ đấu sóng hoặc thực hiện tác vụ của Quản trị viên.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

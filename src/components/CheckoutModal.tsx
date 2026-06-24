import React, { useState, useEffect } from "react";
import { X, CreditCard, ShieldCheck, CheckCircle2, QrCode, AlertCircle, Sparkles, ChevronRight, Wifi } from "lucide-react";
import { SimCard, Order, AgentRole } from "../types";

// Helper to map dynamic bank names configured by admin into clean, compliant VietQR Bank IDs
const mapToVietQRBankId = (bankName: string): string => {
  const normalized = bankName.toLowerCase().trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove Vietnamese accents
    .replace(/[^\w\s]/g, " ");       // replace special characters with spaces to preserve word boundaries

  const words = normalized.split(/\s+/).filter(Boolean);

  // 1. TCB (Techcombank) - check first to avoid matching "mb" in "techcombank"
  if (normalized.includes("techcom") || normalized.includes("tcb") || normalized.includes("ky thuong")) {
    return "TCB";
  }

  // 2. Sacombank
  if (normalized.includes("sacom") || normalized.includes("stb") || normalized.includes("sai gon thuong tin")) {
    return "STB";
  }

  // 3. MB (Military Bank)
  if (
    normalized.includes("mbbank") || 
    words.includes("mb") || 
    normalized.includes("quan doi")
  ) {
    return "MB";
  }

  // 4. VCB (Vietcombank)
  if (normalized.includes("vietcom") || normalized.includes("vcb") || normalized.includes("ngoai thuong")) {
    return "VCB";
  }

  // 5. ICB (VietinBank)
  if (normalized.includes("vietin") || normalized.includes("ctg") || words.includes("icb") || normalized.includes("cong thuong")) {
    return "ICB";
  }

  // 6. BIDV
  if (normalized.includes("bidv") || normalized.includes("dau tu")) {
    return "BIDV";
  }

  // 7. Agribank
  if (normalized.includes("agri") || words.includes("vba") || normalized.includes("agribank") || normalized.includes("nong nghiep")) {
    return "AGRIBANK";
  }

  // 8. ACB
  if (words.includes("acb") || normalized.includes("a chau")) {
    return "ACB";
  }

  // 9. VPB (VPBank)
  if (words.includes("vp") || words.includes("vpb") || normalized.includes("thinh vuong")) {
    return "VPB";
  }

  // 10. TPB (TPBank)
  if (words.includes("tp") || words.includes("tpb") || normalized.includes("tien phong")) {
    return "TPB";
  }

  // 11. VIB
  if (words.includes("vib") || normalized.includes("quoc te")) {
    return "VIB";
  }

  // 12. SHB
  if (words.includes("shb") || normalized.includes("sai gon ha noi")) {
    return "SHB";
  }

  // 13. OCB
  if (words.includes("ocb") || normalized.includes("phuong dong")) {
    return "OCB";
  }

  // 14. HDBank
  if (words.includes("hdb") || normalized.includes("hdbank") || normalized.includes("phat trien")) {
    return "HDBank";
  }

  // 15. MSB
  if (words.includes("msb") || normalized.includes("hang hai")) {
    return "MSB";
  }

  // 16. SCB
  if (words.includes("scb") || normalized.includes("sai gon")) {
    return "SCB";
  }

  // 17. NCB
  if (words.includes("ncb") || normalized.includes("quoc dan")) {
    return "NCB";
  }

  // 18. LPBank
  if (normalized.includes("lienviet") || words.includes("lpb") || normalized.includes("buu dien") || normalized.includes("lpbank")) {
    return "LPBank";
  }

  // 19. SeABank
  if (normalized.includes("seabank") || words.includes("seab")) {
    return "SeABank";
  }

  // 20. BacABank
  if (normalized.includes("bac a") || words.includes("bab")) {
    return "BacABank";
  }

  // 21. NamABank
  if (normalized.includes("nam a") || words.includes("nab")) {
    return "NamABank";
  }

  // 22. VietBank
  if (normalized.includes("vietbank")) {
    return "VietBank";
  }

  // 23. VietABank
  if (normalized.includes("viet a") || words.includes("vab")) {
    return "VietABank";
  }

  // 24. SaigonBank
  if (normalized.includes("saigonbank")) {
    return "SaigonBank";
  }

  // 25. Eximbank
  if (normalized.includes("exim") || words.includes("eib")) {
    return "Eximbank";
  }

  // 26. SHBVN (Shinhan Bank)
  if (normalized.includes("shinhan")) {
    return "SHBVN";
  }

  // Fallback: uppercase without alphanumeric
  return bankName.toUpperCase().replace(/[^A-Z0-9]/gi, "");
};

interface CheckoutModalProps {
  sim: SimCard;
  activeRole: AgentRole;
  agentId?: string;
  onClose: () => void;
  onSubmitOrder: (orderData: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    paymentMethod: "momo" | "vietqr" | "vnpay";
    packageId?: string;
  }) => Promise<Order>;
  onSimulatePayment: (id: string) => Promise<void>;
}

export default function CheckoutModal({
  sim,
  activeRole,
  agentId,
  onClose,
  onSubmitOrder,
  onSimulatePayment,
}: CheckoutModalProps) {
  // Step workflow control: "form" | "payment" | "success"
  const [step, setStep] = useState<"form" | "payment" | "success">("form");

  // Form Inputs
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"momo" | "vietqr" | "vnpay">("vietqr");

  // Packages associated with Carrier
  const [carrierPackages, setCarrierPackages] = useState<any[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [loadingPackages, setLoadingPackages] = useState<boolean>(false);

  useEffect(() => {
    // If the SIM card already locks details of a mandatory package
    if (sim.mandatoryPackageId) {
      setSelectedPackageId(sim.mandatoryPackageId);
    }
    
    // Fetch packages for this SIM's network
    setLoadingPackages(true);
    const netId = (sim.networkId || sim.carrier).toLowerCase().trim();
    fetch(`/api/packages?networkId=${netId}`)
      .then(res => {
        if (res.ok) return res.json();
        return [];
      })
      .then(data => {
        setCarrierPackages(data);
      })
      .catch(err => console.error("Error fetching packages for SIM's carrier", err))
      .finally(() => setLoadingPackages(false));
  }, [sim]);

  // Dynamic dynamic secrets from backend config
  const [secrets, setSecrets] = useState<any>({
    vietqr_enabled: true,
    vietqr_bank: "MB BANK",
    vietqr_account: "1903.8888.8888",
    vietqr_owner: "CONG TY CỔ PHẦN ĐẠI LÝ SIM VIET NAM",
    momo_enabled: true,
    momo_phone: "0988.888.888",
    momo_owner: "NGUYEN VAN ADMIN",
    vnpay_enabled: true,
  });

  useEffect(() => {
    fetch("/api/config")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to load config");
      })
      .then((data) => {
        if (data && data.secrets) {
          setSecrets(data.secrets);
          
          // Fallback selection if vietqr is disabled
          if (!data.secrets.vietqr_enabled) {
            if (data.secrets.momo_enabled) {
              setPaymentMethod("momo");
            } else if (data.secrets.vnpay_enabled) {
              setPaymentMethod("vnpay");
            }
          }
        }
      })
      .catch((err) => console.error("Error loading secure configuration in checkout:", err));
  }, []);

  // Booking states
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Submit client detail to generate order
  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!customerName || !customerPhone) {
      setError("Vui lòng điền đầy đủ Họ tên và Số điện thoại nhận sim.");
      return;
    }

    try {
      const order = await onSubmitOrder({
        customerName,
        customerPhone,
        customerAddress: customerAddress || "Nhận tại cửa hàng / COD",
        paymentMethod,
        packageId: selectedPackageId || undefined,
      });
      setCreatedOrder(order);
      setStep("payment");
    } catch (err: any) {
      setError(err.message || "Không thể khởi tạo đặt thuê bao.");
    }
  };

  // Simulate gateway verification
  const handleSimulatePaymentAction = async () => {
    if (!createdOrder) return;
    setPaying(true);
    setError(null);
    try {
      // call server payment simulator
      await onSimulatePayment(createdOrder.id);
      
      // Update local state to show paid
      const updatedOrder = { ...createdOrder, paymentStatus: "Đã thanh toán" as any, status: "Đang xử lý" as any };
      setCreatedOrder(updatedOrder);
      
      // delay for realistic gateway visual transition
      setTimeout(() => {
        setStep("success");
        setPaying(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Cổng thanh toán phản hồi lỗi kỹ thuật. Xin quý khách vui lòng thanh toán thủ công.");
      setPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn" id="checkout-modal-wrapper">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-150 text-[#003366] flex items-center justify-center font-bold text-xs shadow-xs">
              MUA
            </div>
            <div>
              <h3 className="font-sans font-bold text-slate-800 text-sm">
                Xử Lý Đơn Hàng • {sim.number}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Nhà mạng: {sim.carrier} • Cấp biệt: {activeRole}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 px-2.5 bg-slate-200/50 text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Scroll area */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex items-center gap-2 text-xs text-red-700 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Enter customer particulars */}
          {step === "form" && (
            <form onSubmit={handleClientSubmit} className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">
                    Số SIM đã chọn
                  </span>
                  <p className="font-sans font-black text-2xl text-slate-900 tracking-tight text-[#003366]">
                    {sim.number}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Phân loại: <strong className="text-[#003366]">{sim.category}</strong> • Tổng điểm: {sim.sum} nút
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">
                    Thanh toán
                  </span>
                  <p className="font-sans font-black text-lg text-slate-900">
                    {(sim.price * (1 - (activeRole !== "Khách hàng" ? 0.15 : 0))).toLocaleString("vi-VN")} đ
                  </p>
                  {activeRole !== "Khách hàng" && (
                    <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded font-extrabold block">
                      Đã giảm chiết khấu đại lý
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-sans font-bold text-xs text-slate-500 uppercase tracking-wider font-mono">
                  Thông tin khách hàng thụ hưởng
                </h4>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Họ và tên khách hàng *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nhập tên người đứng tên sim..."
                    className="w-full text-slate-900 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#003366] text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Số điện thoại liên hệ *</label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Số ĐT trao đổi thông tin hoặc giữ liên lạc..."
                    className="w-full text-slate-900 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#003366] text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Địa chỉ giao hàng / Ghi chú (Nếu nhận tại quầy ghi: Tại quầy)</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Địa chỉ số nhà, ngõ, phường, tỉnh/thành phố nhận Sim..."
                    className="w-full text-slate-900 p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#003366] text-xs font-semibold"
                  />
                </div>
              </div>

              {/* CHỌN GÓI CƯỚC ĐI KÈM */}
              <div className="space-y-2 bg-slate-50 p-4 border border-slate-150 rounded-2xl">
                <div className="flex items-center gap-1.5 justify-between">
                  <h4 className="font-sans font-bold text-xs text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1">
                    <Wifi className="w-4 h-4 text-[#003366]" /> Gói cước di động đi kèm
                  </h4>
                  {sim.mandatoryPackageId && (
                    <span className="text-[10px] bg-amber-400 text-slate-900 font-extrabold px-2 py-0.5 rounded-full uppercase scale-95 tracking-wide shadow-xs">
                      Cam kết bắt buộc
                    </span>
                  )}
                </div>

                {sim.mandatoryPackageId ? (
                  // Locked Mandatory Package Display
                  <div className="bg-amber-500/10 border border-amber-350 p-3 rounded-xl space-y-1 mt-2 animate-fadeIn text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs">
                        🎁 Gói cam kết: {sim.mandatoryPackage?.name || "Cam kết gán sẵn"}
                      </span>
                      <span className="font-black text-[#003366] text-xs">
                        {(sim.mandatoryPackage?.monthlyFee || 200000).toLocaleString()}đ / tháng
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-600 font-mono">
                      Ưu đãi: {sim.mandatoryPackage?.dataLimitText || "4GB/ngày"}, {sim.mandatoryPackage?.minutesInternal || 2000}p nội, {sim.mandatoryPackage?.minutesExternal || 100}p ngoại mạng.
                    </p>
                    <p className="text-[10px] text-amber-800 font-sans italic pt-1">
                      ⚠️ Chú ý: Đây là số sim đẹp của nhà mạng {sim.carrier}. Khách hàng cam kết đăng ký sử dụng tối thiểu 12 tháng gói cước kèm theo này.
                    </p>
                  </div>
                ) : (
                  // General Package Selection Dropdown / Selector
                  <div className="space-y-2 mt-2">
                    <label className="text-[10px] text-slate-500 font-mono block text-left">
                      Lựa chọn gói cước ưu đãi bổ sung của nhà mạng {sim.carrier}:
                    </label>
                    <select
                      value={selectedPackageId}
                      onChange={(e) => setSelectedPackageId(e.target.value)}
                      className="w-full text-slate-900 p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#003366] text-xs font-semibold cursor-pointer"
                    >
                      <option value="">-- Chỉ mua SIM (Không kèm gói cước) --</option>
                      {carrierPackages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} ({pkg.monthlyFee.toLocaleString()}đ/th) — {pkg.dataLimitText || `${pkg.dataGb}GB`}
                        </option>
                      ))}
                    </select>

                    {selectedPackageId && (
                      (() => {
                        const selPkg = carrierPackages.find(p => p.id === selectedPackageId);
                        if (!selPkg) return null;
                        return (
                          <div className="bg-blue-50/50 border border-blue-150 p-2.5 rounded-xl space-y-1 text-slate-700 animate-fadeIn mt-1.5 text-left">
                            <p className="text-[10px] font-bold text-slate-800">
                              🚀 Ưu đãi gói {selPkg.name}:
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono leading-relaxed">
                              Hạn mức Data: {selPkg.dataLimitText || `${selPkg.dataGb}GB`}. Gọi: {selPkg.minutesInternal || 0}p nội, {selPkg.minutesExternal || 0}p ngoại mạng. 
                              {selPkg.outOfBundleCharge && ` (${selPkg.outOfBundleCharge})`}
                            </p>
                          </div>
                        );
                      })()
                    )}
                  </div>
                )}
              </div>

              {/* Select payment method */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-sans font-bold text-xs text-slate-500 uppercase tracking-wider font-mono">
                    Phương thức thanh toán trực tuyến
                  </h4>
                  <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1 animate-pulse">
                    ● Hệ thống tự động cập nhật cấu hình mới
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    disabled={!secrets.vietqr_enabled}
                    onClick={() => setPaymentMethod("vietqr")}
                    className={`p-3 border rounded-xl flex flex-col items-center gap-1.5 transition-all text-center relative ${
                      !secrets.vietqr_enabled ? "opacity-45 cursor-not-allowed bg-slate-50 border-dashed" : "cursor-pointer"
                    } ${
                      paymentMethod === "vietqr"
                        ? "border-[#003366] bg-blue-50/50 text-[#003366] font-bold"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-indigo-700" />
                    <span className="text-[10px] break-words">Chuyển khoản VietQR</span>
                    {!secrets.vietqr_enabled && (
                      <span className="absolute -top-1 -right-1 text-[8px] bg-amber-500 text-white font-sans px-1 py-0.5 rounded-sm scale-85 font-extrabold shadow-sm">TẠM TẮT</span>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={!secrets.momo_enabled}
                    onClick={() => setPaymentMethod("momo")}
                    className={`p-3 border rounded-xl flex flex-col items-center gap-1.5 transition-all text-center relative ${
                      !secrets.momo_enabled ? "opacity-45 cursor-not-allowed bg-slate-50 border-dashed" : "cursor-pointer"
                    } ${
                      paymentMethod === "momo"
                        ? "border-pink-500 bg-pink-50/50 text-pink-700 font-bold"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-pink-600" />
                    <span className="text-[10px] break-words">Ví điện tử MoMo</span>
                    {!secrets.momo_enabled && (
                      <span className="absolute -top-1 -right-1 text-[8px] bg-amber-500 text-white font-sans px-1 py-0.5 rounded-sm scale-85 font-extrabold shadow-sm">TẠM TẮT</span>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={!secrets.vnpay_enabled}
                    onClick={() => setPaymentMethod("vnpay")}
                    className={`p-3 border rounded-xl flex flex-col items-center gap-1.5 transition-all text-center relative ${
                      !secrets.vnpay_enabled ? "opacity-45 cursor-not-allowed bg-slate-50 border-dashed" : "cursor-pointer"
                    } ${
                      paymentMethod === "vnpay"
                        ? "border-blue-500 bg-blue-50/50 text-blue-700 font-bold"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span className="text-[10px] break-words">Cổng VNPay Portal</span>
                    {!secrets.vnpay_enabled && (
                      <span className="absolute -top-1 -right-1 text-[8px] bg-amber-500 text-white font-sans px-1 py-0.5 rounded-sm scale-85 font-extrabold shadow-sm">TẠM TẮT</span>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-4 bg-[#003366] hover:bg-blue-800 text-white font-bold rounded-lg shadow-md cursor-pointer transition-all flex items-center justify-center gap-1"
              >
                Tiến hành tạo đơn hàng và thanh toán <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: Show dynamic payment screen qr code/instructions */}
          {step === "payment" && createdOrder && (
            <div className="space-y-5 text-center py-2" id="payment-simulation-wrapper">
              <div className="bg-slate-50 px-4 py-3 rounded-xl inline-block border border-slate-200 font-mono text-[11px] font-bold text-slate-500 animate-pulse">
                TRẠNG THÁI: CHỜ KHÁCH QUÉT QR KHỚP THANH TOÁN
              </div>

              {/* Dynamic Momo gateway simulation */}
              {paymentMethod === "momo" && (
                <div className="space-y-4 max-w-xs mx-auto text-slate-800" id="momo-gate">
                  <div className="bg-pink-600 text-white p-3.5 rounded-xl font-bold flex flex-col items-center justify-center gap-1">
                    <span className="font-sans font-black tracking-wide">MoMo Gateway Sim</span>
                    <span className="text-[9px] font-normal opacity-90">(Cập nhật tự động)</span>
                  </div>
 
                  {/* QR code image mockup */}
                  <div className="p-3 bg-white border-2 border-pink-500 rounded-2xl inline-block shadow-md">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=momo_phone_${secrets.momo_phone || "0988888888"}_amount_${createdOrder.discountPrice}_order_${createdOrder.id}`}
                      alt="Momo QR Code"
                      className="w-44 h-44 mx-auto"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="bg-slate-50 p-2 text-left rounded-lg border border-slate-100 mb-2 space-y-0.5">
                      <p className="text-slate-400 font-semibold uppercase text-[8px] tracking-wider">Thông tin ví nhận tiền</p>
                      <p className="text-slate-800">SĐT Ví: <strong>{secrets.momo_phone || "0988.888.888"}</strong></p>
                      <p className="text-slate-800">Chủ ví: <strong>{secrets.momo_owner || "NGUYEN VAN ADMIN"}</strong></p>
                    </div>
                    <p className="font-semibold text-slate-400">Nội dung chuyển khoản (Tự động):</p>
                    <p className="font-mono bg-slate-100 p-1.5 rounded text-pink-700 font-bold">{createdOrder.id}</p>
                    <p className="font-bold text-base text-pink-600 mt-2">
                      Số tiền: {createdOrder.discountPrice.toLocaleString("vi-VN")} đ
                    </p>
                  </div>
                </div>
              )}
 
              {/* Dynamic VietQR banking instructions */}
              {paymentMethod === "vietqr" && (
                <div className="space-y-4 max-w-md mx-auto text-slate-800 text-left bg-slate-50/50 p-4 border border-indigo-200 rounded-2xl shadow-sm" id="vietqr-gate">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-6 h-6 text-indigo-700 animate-pulse" />
                      <div>
                        <h4 className="font-sans font-bold text-xs text-indigo-950 uppercase">
                          Thanh toán tự động Chuẩn VietQR (EMVCo)
                        </h4>
                        <p className="text-[10px] text-emerald-600 font-bold">● Hỗ trợ quét tự động điền thông tin cho 40+ ngân hàng</p>
                      </div>
                    </div>
                  </div>
 
                  <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start pt-2">
                    <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm shrink-0 flex flex-col items-center gap-1.5 w-fit">
                      <img
                        src={`https://img.vietqr.io/image/${mapToVietQRBankId(secrets.vietqr_bank || "MB")}-${(secrets.vietqr_account || "190388888888").replace(/\D/g, "")}-compact.png?amount=${createdOrder.discountPrice}&addInfo=${encodeURIComponent(`SIM ${createdOrder.id}`)}&accountName=${encodeURIComponent(secrets.vietqr_owner || "")}`}
                        alt="VietQR Code"
                        className="w-40 h-40 object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[8px] font-sans font-extrabold text-[#003366] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider">
                        Quét Bằng App Ngân Hàng Thật
                      </span>
                    </div>
                    <div className="text-xs space-y-2 flex-1 w-full font-sans">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-100 space-y-1">
                        <p className="text-slate-400 font-semibold uppercase text-[9px] tracking-wider mb-0.5">Tài khoản thụ hưởng mới</p>
                        <p className="text-slate-800">Ngân hàng: <strong>{secrets.vietqr_bank || "MB BANK"}</strong></p>
                        <p className="text-slate-800">Số tài khoản: <strong>{secrets.vietqr_account || "1903.8888.8888"}</strong></p>
                        <p className="text-slate-800">Chủ TK: <strong>{secrets.vietqr_owner || "CONG TY CỔ PHẦN ĐẠI LÝ SIM VIET NAM"}</strong></p>
                      </div>
                      
                      <div className="bg-indigo-50 p-2.5 rounded-lg border border-indigo-100/50 text-indigo-800 space-y-1">
                        <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest text-left">Nội dung cú pháp quét (Memo)</p>
                        <p className="font-mono text-xs font-extrabold text-indigo-900 tracking-widest">{`SIM ${createdOrder.id}`}</p>
                        <p className="text-[10px] italic">Số tiền: <strong>{createdOrder.discountPrice.toLocaleString("vi-VN")} đ</strong></p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic VNPay Gate simulation */}
              {paymentMethod === "vnpay" && (
                <div className="space-y-4 max-w-sm mx-auto text-slate-800 bg-blue-50/50 p-5 rounded-2xl border border-blue-150 text-center" id="vnpay-gate">
                  <div className="bg-blue-600 text-white py-2 rounded-xl text-xs font-bold leading-none tracking-wide">
                    VNPAY SECURE PORTAL
                  </div>
                  <div className="p-3 space-y-2">
                    <p className="text-xs text-slate-500">Mã đơn giao dịch: <strong>{createdOrder.id}</strong></p>
                    <p className="text-lg font-black text-blue-700">Giá thanh toán: {createdOrder.discountPrice.toLocaleString("vi-VN")} đ</p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Hệ thống tự động liên kết thẻ nội địa Vietcombank, Techcombank, BIDV và ứng dụng QR của 32 ngân hàng lớn.
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 text-yellow-800 text-xs p-3.5 rounded-xl border border-yellow-200 flex gap-2 items-center justify-start text-left max-w-md mx-auto">
                <ShieldCheck className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <span>
                  Để thuận tiện khảo sát quy trình bán Số, quý khách click nút giả lập thanh toán bên dưới để máy chủ ghi nhận <strong>&quot;Đã nhận đủ tiền từ khách chuyển khoản&quot;</strong> instantly!
                </span>
              </div>

              <div className="flex gap-2 justify-center max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Huỷ bỏ đơn
                </button>
                <button
                  type="button"
                  disabled={paying}
                  onClick={handleSimulatePaymentAction}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 leading-tight disabled:bg-slate-400 text-white text-xs font-extrabold rounded-xl shadow cursor-pointer transition-all flex items-center justify-center gap-1.5 shrink-0"
                >
                  {paying ? "Kiểm tra giao dịch..." : "GIẢ LẬP ĐÃ CHUYỂN TIỀN ✔"}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment finished and successfully booked */}
          {step === "success" && createdOrder && (
            <div className="text-center py-6 space-y-5 animate-scaleUp" id="checkout-finished-panel">
              <div className="w-16 h-16 bg-emerald-100/80 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl shadow-inner animate-bounce">
                <CheckCircle2 className="w-10 h-10 stroke-3" />
              </div>

              <div className="space-y-1">
                <h3 className="font-sans font-extrabold text-slate-900 text-lg">THANH TOÁN THÀNH CÔNG!</h3>
                <p className="text-xs text-slate-400">
                  Cổng API của {paymentMethod.toUpperCase()} vừa phản hồi mã CODE giao dịch hợp lệ.
                </p>
              </div>

              <div className="bg-emerald-50 rounded-2xl p-4 text-left text-xs text-emerald-950 border border-emerald-100 flex flex-col space-y-1">
                <p>Mã hóa đơn: <strong>{createdOrder.id}</strong></p>
                <p>Số thuê bao đặt mua: <strong>{createdOrder.simNumber} (mạng {createdOrder.carrier})</strong></p>
                {createdOrder.packageName && (
                  <p>🎁 Gói cước đi kèm: <strong className="text-[#003366]">{createdOrder.packageName}</strong> ({createdOrder.packageFee?.toLocaleString() || "0"}đ/tháng {createdOrder.isPackageMandatory ? "- Gói cam kết" : ""})</p>
                )}
                <p>Khách hàng: <strong>{createdOrder.customerName}</strong></p>
                <p>Số nhận: <strong>{createdOrder.customerPhone}</strong></p>
                <p>Nơi nhận sim: <strong>{createdOrder.customerAddress}</strong></p>
                <p className="pt-2 border-t border-emerald-250 mt-1 font-bold">
                  Thanh toán hoàn tất: {createdOrder.discountPrice.toLocaleString("vi-VN")} đ
                </p>
              </div>

              <div className="text-left text-[11px] text-slate-400 leading-snug p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <p className="font-semibold text-slate-500 uppercase mb-0.5 tracking-wider font-mono">Quy trình cấp số tự động:</p>
                <p>SIM số đẹp vừa được khóa vĩnh viễn trên hệ thống đại lý. Đơn hàng đã đồng bộ về Tổng Kho để nhân viên kỹ thuật thực hiện thủ tục đấu sóng, gán thông tin đăng ký chính chủ và gửi chuyển phát nhanh về địa chỉ thụ hưởng.</p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-[#003366] hover:bg-blue-850 text-white rounded-lg text-xs font-bold tracking-wider uppercase cursor-pointer"
              >
                Đóng hộp giao dịch &amp; tiếp tục
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

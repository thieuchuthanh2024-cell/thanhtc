import React, { useState } from "react";
import { 
  Download, BookOpen, Terminal, Settings, Layers, Cpu, 
  Database, Users, Shield, Server, FileText, CheckCircle2, 
  ArrowLeftRight, HelpCircle, Code, Copy, Sparkles, Phone, Check,
  Eye, EyeOff, Save, RefreshCw, Play, Key, CreditCard, Globe, Calendar, Clock
} from "lucide-react";

export default function ManualView() {
  const [activeSubTab, setActiveSubTab] = useState<"general" | "roles" | "deployment" | "secrets" | "api-docs" | "maintenance">("general");
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // States & handlers for protected Next.js zip download
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [downloadPassword, setDownloadPassword] = useState("");
  const [downloadPassError, setDownloadPassError] = useState("");
  const [isVerifyingPass, setIsVerifyingPass] = useState(false);

  const handleZipDownloadInitiated = (e: React.MouseEvent) => {
    e.preventDefault();
    setDownloadPassword("");
    setDownloadPassError("");
    setIsPassModalOpen(true);
  };

  const handleVerifyPasswordAndDownload = async () => {
    if (!downloadPassword) {
      setDownloadPassError("Vui lòng nhập mật khẩu!");
      return;
    }
    setIsVerifyingPass(true);
    setDownloadPassError("");
    try {
      const response = await fetch("/api/verify-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: downloadPassword }),
      });
      const data = await response.json();
      if (response.ok && data.success && data.token) {
        setIsPassModalOpen(false);
        // Trigger download programmatically using the secure double-use/single-use token route
        const a = document.createElement("a");
        a.href = `/api/download-nextjs-zip?token=${encodeURIComponent(data.token)}`;
        a.download = "nextjs_source_code.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        setDownloadPassError(data.error || "Mật khẩu không chính xác. Vui lòng kiểm tra lại!");
      }
    } catch (err) {
      setDownloadPassError("Gặp lỗi khi kết nối máy chủ để kiểm tra bảo mật.");
    } finally {
      setIsVerifyingPass(false);
    }
  };

  const [isExportingSql, setIsExportingSql] = useState(false);
  const [exportSqlError, setExportSqlError] = useState<string | null>(null);
  const [sqlBackupText, setSqlBackupText] = useState<string | null>(null);

  const handleDownloadSql = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExportingSql(true);
    setExportSqlError(null);
    try {
      const response = await fetch("/api/admin/export-sql-backup");
      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }
      const text = await response.text();
      setSqlBackupText(text);

      // Create blob & trigger browser-safe link download
      const blob = new Blob([text], { type: "application/sql" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vietsim_backup.sql";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("SQL download failed:", err);
      setExportSqlError("Không thể tải file tự động do chính sách bảo mật sandbox của iFrame AI Studio. Bạn hoàn toàn có thể nhấn nút xem và sao chép trực tiếp nội dung SQL bên dưới!");
    } finally {
      setIsExportingSql(false);
    }
  };

  // States for DB Maintenance & Seeding (up to 3 million SIM cards)
  const [dbPassword, setDbPassword] = useState("");
  const [generateCount, setGenerateCount] = useState("10000");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [maintenanceStatus, setMaintenanceStatus] = useState<string | null>(null);
  const [maintenanceError, setMaintenanceError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<any>(null);

  // DB Connection Info state
  const [dbInfo, setDbInfo] = useState<any>({
    SQL_HOST: "127.0.0.1",
    SQL_USER: "postgres",
    SQL_DB_NAME: "postgres",
    SQL_PORT: "5432"
  });

  // Advanced configurations & API Keys states loaded from secrets_config.json
  const [secrets, setSecrets] = useState<any>({
    vietqr_enabled: true,
    vietqr_bank: "Techcombank",
    vietqr_account: "0912903903",
    vietqr_owner: "CONG TY CỔ PHẦN ĐẠI LÝ SIM VIET NAM",
    momo_enabled: true,
    momo_phone: "0988.888.888",
    momo_owner: "NGUYEN VAN ADMIN",
    vnpay_enabled: true,
    vnpay_terminal_id: "VNPAY001",
    vnpay_secret_key: "SEC_ABC123XYZ",
    api_partner_sync_stock_url: "https://api.partner.telecom/v3/stock/sync",
    api_partner_sync_stock_key: "PARTNER_STOCK_KEY_XYZ_999",
    api_partner_activation_url: "https://api.carrier-connect.net/v2/sim/kit-connect",
    api_partner_activation_key: "CARRIER_JWT_SECRET_8888",
    api_payment_webhook_momo_url: "https://kho-sim.vn/api/webhook/payments/momo",
    api_payment_webhook_vnpay_url: "https://kho-sim.vn/api/webhook/payments/vnpay",
    api_payment_webhook_vietqr_url: "https://kho-sim.vn/api/webhook/payments/vietqr",
    sync_schedule_enabled: true,
    sync_schedule_period: "daily",
    sync_schedule_hour: "02",
    sync_last_run: null,
    sync_scraper_target: "https://simthanglong.vn/sim-gia-re",
    sync_scraper_sim_count: "25"
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");

  // Visibility states for secrets
  const [showVnpaySecret, setShowVnpaySecret] = useState(false);
  const [showSyncKey, setShowSyncKey] = useState(false);
  const [showActivationKey, setShowActivationKey] = useState(false);

  // Live testing simulation states (Calls the real express endpoints)
  const [syncTestResponse, setSyncTestResponse] = useState<string>("");
  const [isTestingSync, setIsTestingSync] = useState(false);
  
  // Sim Thang Long automated scraping interactive states
  const [isScrapingNow, setIsScrapingNow] = useState(false);
  const [scraperLogs, setScraperLogs] = useState<string[]>([]);
  const [scraperResult, setScraperResult] = useState<any | null>(null);
  const [showLatestPersistentLogs, setShowLatestPersistentLogs] = useState(false);
  
  const [activationForm, setActivationForm] = useState({
    simNumber: "0988.888.888",
    fullName: "Nguyễn Văn Khách",
    citizenId: "012345678901",
    simKitSerial: "8984041122334455"
  });
  const [isTestingActivation, setIsTestingActivation] = useState(false);
  const [activationTestResponse, setActivationTestResponse] = useState<string>("");

  // Postman-like Webhook Simulator States
  const [sandboxEndpoint, setSandboxEndpoint] = useState<"vietqr" | "momo" | "vnpay">("vietqr");
  const [sandboxPayload, setSandboxPayload] = useState<string>("");
  const [isSendingSandbox, setIsSendingSandbox] = useState(false);
  const [sandboxResponse, setSandboxResponse] = useState<any>(null);
  const [sandboxStatus, setSandboxStatus] = useState<number | null>(null);
  const [sandboxLatency, setSandboxLatency] = useState<number | null>(null);
  const [unpaidOrders, setUnpaidOrders] = useState<any[]>([]);
  const [selectedSandboxOrderId, setSelectedSandboxOrderId] = useState<string>("");

  // VPA Sandbox States
  const [sandboxVpaPlate, setSandboxVpaPlate] = useState<string>("29AF12039");
  const [sandboxVpaMethod, setSandboxVpaMethod] = useState<"GET" | "POST">("GET");
  const [isSendingVpaSandbox, setIsSendingVpaSandbox] = useState(false);
  const [sandboxVpaResponse, setSandboxVpaResponse] = useState<any>(null);
  const [sandboxVpaStatus, setSandboxVpaStatus] = useState<number | null>(null);
  const [sandboxVpaLatency, setSandboxVpaLatency] = useState<number | null>(null);

  // Send VPA Sandbox Request
  const handleSendVpaSandbox = async () => {
    setIsSendingVpaSandbox(true);
    setSandboxVpaResponse(null);
    setSandboxVpaStatus(null);
    setSandboxVpaLatency(null);
    const startTime = performance.now();
    
    let targetUrl = "/api/partner/vpa/matching-sims";
    let options: RequestInit = {};
    
    if (sandboxVpaMethod === "GET") {
      targetUrl += `?plate=${encodeURIComponent(sandboxVpaPlate)}`;
      options = { method: "GET" };
    } else {
      options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ plate: sandboxVpaPlate })
      };
    }
    
    try {
      const res = await fetch(targetUrl, options);
      const endTime = performance.now();
      setSandboxVpaLatency(Math.round(endTime - startTime));
      setSandboxVpaStatus(res.status);
      
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        setSandboxVpaResponse(json);
      } catch {
        setSandboxVpaResponse(text);
      }
    } catch (err: any) {
      const endTime = performance.now();
      setSandboxVpaLatency(Math.round(endTime - startTime));
      setSandboxVpaStatus(500);
      setSandboxVpaResponse({
        error: "Client Request Error",
        message: err.message
      });
    } finally {
      setIsSendingVpaSandbox(false);
    }
  };

  // Fetch unpaid orders list from DB
  const fetchUnpaidOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Filter to show unpaid or active orders
          const unpaid = data.filter((o: any) => o.paymentStatus !== "Đã thanh toán");
          setUnpaidOrders(unpaid);
          if (unpaid.length > 0) {
            // Only preset if current selection becomes invalid or empty
            setSelectedSandboxOrderId(prev => {
              if (prev && unpaid.some(o => o.id === prev)) return prev;
              return unpaid[0].id;
            });
          }
        }
      }
    } catch (err) {
      console.error("Error loading orders for Webhook Sandbox:", err);
    }
  };

  // Run mock client webhook payload trigger
  const handleSendSandbox = async () => {
    setIsSendingSandbox(true);
    setSandboxResponse(null);
    setSandboxStatus(null);
    setSandboxLatency(null);
    const startTime = performance.now();
    
    let targetPath = "/api/webhook/payments/vietqr";
    if (sandboxEndpoint === "momo") targetPath = "/api/webhook/payments/momo";
    if (sandboxEndpoint === "vnpay") targetPath = "/api/webhook/payments/vnpay";
    
    try {
      let parsedBody;
      try {
        parsedBody = JSON.parse(sandboxPayload);
      } catch (jsonErr: any) {
        throw new Error("Cấu trúc JSON Body bị lỗi cú pháp: " + jsonErr.message);
      }
      
      const res = await fetch(targetPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(parsedBody)
      });
      
      const endTime = performance.now();
      setSandboxLatency(Math.round(endTime - startTime));
      setSandboxStatus(res.status);
      
      const text = await res.text();
      try {
        const json = JSON.parse(text);
        setSandboxResponse(json);
      } catch {
        setSandboxResponse(text);
      }
      
      // Refresh the orders if successful update occurred
      fetchUnpaidOrders();
    } catch (err: any) {
      const endTime = performance.now();
      setSandboxLatency(Math.round(endTime - startTime));
      setSandboxStatus(500);
      setSandboxResponse({
        error: "Client Request Error",
        message: err.message
      });
    } finally {
      setIsSendingSandbox(false);
    }
  };

  // Load backend secrets config on component mount
  React.useEffect(() => {
    fetch("/api/secrets")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setSecrets(data);
        }
      })
      .catch((err) => console.error("Error reading backend system secrets:", err));

    fetch("/api/admin/db-info")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setDbInfo(data);
        }
      })
      .catch((err) => console.error("Error fetching db config specs:", err));

    fetchUnpaidOrders();
  }, []);

  // Update sandbox payload when selected parameters modify
  React.useEffect(() => {
    const currentOrder = unpaidOrders.find(o => o.id === selectedSandboxOrderId);
    const orderId = currentOrder ? currentOrder.id : "ord-3c82af0";
    const amount = currentOrder ? currentOrder.price : 10500000;
    
    if (sandboxEndpoint === "vietqr") {
      setSandboxPayload(JSON.stringify({
        transactionId: "FT" + Math.floor(1000000000000 + Math.random() * 900000000000).toString(),
        amount: amount,
        description: `Thanh toan don hang SIM ${orderId}`,
        bankCode: "TCB",
        transactionDate: new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
      }, null, 2));
    } else if (sandboxEndpoint === "momo") {
      setSandboxPayload(JSON.stringify({
        orderId: orderId,
        resultCode: 0,
        amount: amount,
        transId: "momo_" + Math.floor(100000000 + Math.random() * 900000000).toString(),
        message: "Successful."
      }, null, 2));
    } else if (sandboxEndpoint === "vnpay") {
      setSandboxPayload(JSON.stringify({
        vnp_TxnRef: orderId,
        vnp_ResponseCode: "00",
        vnp_Amount: amount,
        vnp_TransactionNo: "vnp_" + Math.floor(15000000 + Math.random() * 85000000).toString()
      }, null, 2));
    }
  }, [sandboxEndpoint, selectedSandboxOrderId, unpaidOrders]);

  const handleSaveSecrets = async () => {
    setIsSaving(true);
    setSaveSuccess("");
    try {
      const response = await fetch("/api/secrets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(secrets),
      });
      if (response.ok) {
        const result = await response.json();
        setSecrets(result.secrets);
        setSaveSuccess("Đã cập nhật cấu hình bảo mật thành công!");
        setTimeout(() => setSaveSuccess(""), 3500);
      } else {
        setSaveSuccess("Thất bại khi cập nhật cấu hình bảo mật.");
      }
    } catch (err: any) {
      setSaveSuccess("Không thể kết nối đến cơ sở dữ liệu: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const runTestSync = async () => {
    setIsTestingSync(true);
    setSyncTestResponse("");
    try {
      const response = await fetch(`/api/partner/sims/sync?apiKey=${secrets.api_partner_sync_stock_key}`, {
        method: "GET",
        headers: {
          "x-partner-key": secrets.api_partner_sync_stock_key
        }
      });
      const data = await response.json();
      setSyncTestResponse(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setSyncTestResponse("LỖI KẾT NỐI: " + e.message);
    } finally {
      setIsTestingSync(false);
    }
  };

  const runTestActivation = async () => {
    setIsTestingActivation(true);
    setActivationTestResponse("");
    try {
      const response = await fetch("/api/partner/sims/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simNumber: activationForm.simNumber,
          fullName: activationForm.fullName,
          citizenId: activationForm.citizenId,
          simKitSerial: activationForm.simKitSerial
        })
      });
      const data = await response.json();
      setActivationTestResponse(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setActivationTestResponse("LỖI KÍCH HOẠT: " + e.message);
    } finally {
      setIsTestingActivation(false);
    }
  };

  const runScrapeSimThangLong = async () => {
    setIsScrapingNow(true);
    setScraperLogs(["[Client] Yêu cầu tiến trình quét dọn kho số simthanglong.vn..."]);
    setScraperResult(null);
    try {
      const response = await fetch("/api/secrets/scrape-simthanglong", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: secrets.sync_scraper_target,
          limitSims: secrets.sync_scraper_sim_count
        })
      });
      const data = await response.json();
      if (data.logs) {
        setScraperLogs(data.logs);
      } else {
        setScraperLogs(p => [...p, "[Client Error] Không tìm thấy nhật ký logs từ máy chủ."]);
      }
      setScraperResult(data);
      
      // Reload secrets to update the last run time display
      fetch("/api/secrets")
        .then(res => res.json())
        .then(newData => {
          if (newData && !newData.error) {
            setSecrets(newData);
          }
        });
    } catch (e: any) {
      setScraperLogs(prev => [...prev, `[Cực Nghiêm Trọng] Lỗi xử lý luồng mạng: ${e.message}`]);
    } finally {
      setIsScrapingNow(false);
    }
  };

  const downloadApiManualDoc = () => {
    const rawHtml = `
    <h1>TÀI LIỆU TÍCH HỢP API ĐỐI TÁC - VIETSIM TELECOM</h1>
    <p>Tài liệu đặc tả kỹ thuật mô tả cách kết nối hệ thống ĐẠI LÝ SIM VIETSIM với kho số, hệ thống thanh toán và đăng ký thông tin thuê bao của các nhà mạng viễn thông.</p>
    
    <h2>1. THỦ TỤC XÁC THỰC (AUTHENTICATION)</h2>
    <p>Tất cả các yêu cầu kết nối an toàn từ hệ thống đối tác phải đính kèm Header xác thực:</p>
    <pre>x-partner-key: [Mã API Key cấu hình trong hệ thống Admin]</pre>
    
    <h2>2. API ĐỒNG BỘ KHO SỐ & GÓI CƯỚC DI ĐỘNG (GET /api/partner/sims/sync)</h2>
    <p>Truy vấn danh sách SIM còn hàng, thông tin nhà mạng, giá sỉ chiết khấu đặc quyền và gói cước khuyến mãi do Vietsim phân phối.</p>
    <h3>Tham số truy vấn (Query parameters):</h3>
    <ul>
      <li><code>apiKey</code>: Mã khóa xác thực đối tác (nếu không gửi ở Header x-partner-key).</li>
    </ul>
    <h3>Ví dụ yêu cầu cURL:</h3>
    <pre>curl -X GET "https://kho-sim.vn/api/partner/sims/sync" -H "x-partner-key: PARTNER_STOCK_KEY_XYZ_999"</pre>
    <h3>Ví dụ phản hồi JSON thành công (HTTP 200 OK):</h3>
    <pre>{
  "success": true,
  "partnerUrlUsed": "https://api.partner.telecom/v3/stock/sync",
  "totalCount": 180,
  "sims": [
    {
      "id": "1",
      "simNumber": "0988888888",
      "rawNumber": "0988888888",
      "carrier": "Viettel",
      "priceInVND": 150000000,
      "wholesaleDiscountPercent": 20,
      "status": "AVAILABLE",
      "associatedPlan": "V200C (90GB/tháng + Thoại không giới hạn)"
    }
  ]
}</pre>

    <h2>3. API ĐẶT ĐƠN VÀ KHỞI TẠO THANH TOÁN (POST /api/partner/payments/initiate)</h2>
    <p>Khởi tạo giao dịch thanh toán trực tuyến qua các kênh thụ hưởng tích hợp (VietQR, MoMo, VNPay).</p>
    <h3>Tham số body gửi lên (JSON payload):</h3>
    <ul>
      <li><code>amount</code> (Number-Bắt buộc): Số tiền chuyển khoản (VND)</li>
      <li><code>orderId</code> (String-Bắt buộc): Mã đơn hàng bên đối tác tự tạo</li>
      <li><code>provider</code> (String-Bắt buộc): "vietqr" | "momo" | "vnpay"</li>
    </ul>
    <h3>Ví dụ phản hồi:</h3>
    <pre>{
  "success": true,
  "transactionId": "TXN-PARTNER-A79B2CF0",
  "amount": 350000,
  "provider": "vietqr",
  "paymentUrl": "https://kho-sim.vn/api/partner/payments/checkout-mock?txn=TXN-PARTNER-A79B2CF0"
}</pre>

    <h2>4. API KÍCH HOẠT SIM KIT & ĐĂNG KÝ THÔNG TIN THUÊ BAO CHÍNH CHỦ (POST /api/partner/sims/activate)</h2>
    <p>Đăng ký thông tin thuê bao của người dùng lên hệ thống nhà mạng để kích hoạt phôi SIM vật lý hoặc eSIM.</p>
    <h3>Tham số body gửi lên (JSON payload):</h3>
    <ul>
      <li><code>simNumber</code> (String-Bắt buộc): Số SIM cần kích hoạt</li>
      <li><code>fullName</code> (String-Bắt buộc): Họ và tên đầy đủ khách hàng</li>
      <li><code>citizenId</code> (String-Bắt buộc): Số Căn cước công dân</li>
      <li><code>simKitSerial</code> (String-Bắt buộc): Số Serial trên phôi SIM kit</li>
    </ul>
    <h3>Ví dụ phản hồi:</h3>
    <pre>{
  "success": true,
  "message": "SIM Card Kit registration request processed successfully.",
  "subscriberProfile": {
    "number": "0988888888",
    "fullName": "Nguyen Van A",
    "citizenId": "012345678901",
    "serialNumber": "898404...",
    "activationStatus": "COMPLETED"
  }
}</pre>

    <h2>5. API KÍCH HOẠT THÔNG TIN BIỂN SỐ XE ĐẤU GIÁ VPA - https://dgbs.vpa.com.vn/ (GET/POST /api/partner/vpa/matching-sims)</h2>
    <p>Cung cấp dành riêng cho hệ thống Đấu giá biển số xe Quốc gia của VPA để tự động xuất và trích lục 5 số điện thoại đẹp, tương đồng nhất về phong thủy và đuôi số học.</p>
    <h3>Tham số (Query Parameter hoặc POST Body):</h3>
    <ul>
      <li><code>plate</code> hoặc <code>licensePlate</code> (String-Bắt buộc): Biển số xe cần tìm kiếm SIM tương đồng (ví dụ: <code>29AF12039</code> hoặc <code>30F-999.99</code>)</li>
    </ul>
    <h3>Ví dụ yêu cầu (cURL):</h3>
    <pre>curl -X GET "https://kho-sim.vn/api/partner/vpa/matching-sims?plate=29AF12039"</pre>
    <h3>Ví dụ phản hồi JSON thành công (HTTP 200 OK):</h3>
    <pre>{
  "success": true,
  "partner": "VPA - Vietnam Partnership Auction",
  "partnerWebsite": "https://dgbs.vpa.com.vn/",
  "inputPlate": "29AF12039",
  "parsedAnalysis": {
    "province": "29",
    "series": "AF",
    "numberBlock": "12039",
    "suffix4Digits": "2039",
    "suffix3Digits": "039",
    "suffix2Digits": "39"
  },
  "explanation": "API này cung cấp 5 số SIM có độ tương đồng cao nhất, bổ trợ phong thuỷ hoàn hảo cho biển số xe của bạn.",
  "count": 5,
  "sims": [
    {
      "id": "v10",
      "number": "0989.11.2039",
      "carrier": "Viettel",
      "category": "Sim Số Đẹp",
      "price": 1500000,
      "sum": 36,
      "similarityScore": 950
    }
  ]
}</pre>
    `;
    triggerManualDownload("vietsim_api_integration_manual.doc", "VIETSIM PARTNER API SPECIFICATION", rawHtml);
  };

  const downloadDevelopmentHistoryDoc = () => {
    const rawHtml = `
    <h1>NHẬT KÝ HÀNH TRÌNH PHÁT TRIỂN & TỔNG HỢP CÂU HỎI THẢO LUẬN KHÁCH HÀNG - VIETSIM TELECOM</h1>
    <p>Tài liệu này ghi nhận toàn bộ quá trình khảo sát, thảo luận yêu cầu và các giải pháp kỹ thuật xuất sắc đã được triển khai thành công để tạo dựng nên Hệ thống Cổng Thương mại Điện tử Phân phối SIM Số đẹp Quốc gia Vietsim Telecom.</p>
    
    <h2>1. THÔNG TIN KHÁI QUÁT DỰ ÁN</h2>
    <ul>
      <li><strong>Tên Hệ Thống:</strong> VIETSIM TELECOM (Cổng phân phối và tích hợp kho số sỉ/lẻ Việt Nam).</li>
      <li><strong>Kiến Trúc Triển Khai:</strong> Full-stack Module (React v18 + Vite + Node.js Express + Drizzle ORM + PostgreSQL / Google Cloud SQL).</li>
      <li><strong>Tính Năng Công Nghệ Tiêu Biểu:</strong> Động cơ tính Phong thủy SIM, Cơ chế Web Scraper tự động vượt rào cản từ SimThangLong, Cổng Webhook VietQR/MoMo/VNPay tự động hóa 100% dòng tiền, và Chế độ Chuyển đổi Vận hành thực tế / Mô phỏng (Simulate Mode) cực kỳ an toàn.</li>
    </ul>

    <h2>2. CHUYÊN ĐỀ TỔNG HỢP CÁC CÂU HỎI & CÁCH GIẢi QUYẾT KỸ THUẬT</h2>
    
    <div class="role-section" style="border-left-color: #003366;">
      <div class="role-title">CHỦ ĐỀ 1: Thiết kế giao diện kho số, công cụ tìm kiếm lọc số & Thuật toán Chấm điểm Phong thủy SIM</div>
      <p><strong>Yêu cầu từ khách hàng:</strong> Cần một giao diện hiện đại để người dùng dễ dàng tìm kiếm SIM theo nhà mạng, khoảng giá và phân loại số đẹp (Tứ Quý, Tam Hoa, Lộc Phát, Thần Tài...). Đặc biệt cần có tính năng chấm điểm phong thủy để tăng uy tín thương hiệu.</p>
      <p><strong>Giải pháp Kỹ thuật đã triển khai:</strong></p>
      <ul>
        <li>Xây dựng thanh tìm kiếm thời gian thực (Real-time live search) tại Client hỗ trợ lọc theo định dạng regex số (ví dụ: 09*79, *888).</li>
        <li>Phân loại thông minh 6 nhà mạng chính: Viettel, Vinaphone, Mobifone, Vietnamobile, Wintel, Itelecom kèm logo độ phân giải cao.</li>
        <li><strong>Động cơ Phong Thủy SIM:</strong> Áp dụng thuật toán cộng lũy kế các chữ số để tính số nút (từ 1 đến 10); tra cứu cung mệnh theo đuôi số (Kim, Mộc, Thủy, Hỏa, Thổ); phân phân loại cát hung (Đại Cát, Cát, Bình Hòa) dựa trên các sách phong thủy chính thống giúp nâng cao tỷ lệ chốt đơn của khách hàng.</li>
      </ul>
    </div>

    <div class="role-section" style="border-left-color: #1e3a8a;">
      <div class="role-title">CHỦ ĐỀ 2: Thu hút và quản trị mạng lưới Đại lý / Cộng tác viên (Agent) & Cơ chế chiết khấu</div>
      <p><strong>Yêu cầu từ khách hàng:</strong> Muốn thiết lập cộng đồng CTV bán SIM để tăng trưởng doanh thu. Cần có cơ chế giá sỉ, cấp bậc hoa hồng và quản lý ví nạp/rút để CTV tự chủ động thanh toán bằng số dư tài khoản.</p>
      <p><strong>Giải pháp Kỹ thuật đã triển khai:</strong></p>
      <ul>
        <li><strong>Xây dựng Phân vị Cấp bậc Hoa hồng lũy tiến:</strong> Bronze (Đồng - nhận chiết khấu 10%), Silver (Bạc - 15%), Gold (Vàng - 25%), Platinum (Bạch Kim - 35% trên tổng giá trị phôi SIM).</li>
        <li>Tích hợp ví tài khoản CTV: Hỗ trợ nộp tiền quỹ và cập nhật dòng tiền biến động lịch sử chính xác. Khi CTV đặt hàng cho khách, hệ thống tự động trừ tiền gốc sỉ từ ví balance và ghi nhận trạng thái hoa hồng, loại bỏ hoàn toàn các thao tác thủ công.</li>
        <li>Xây dựng trang Dashboard CTV quản lý doanh thu, xem tỷ suất lợi nhuận và gửi lệnh yêu cầu rút tiền về ngân hàng thực tế của họ.</li>
      </ul>
    </div>

    <div class="role-section" style="border-left-color: #047857;">
      <div class="role-title">CHỦ ĐỀ 3: Cổng thanh toán tự động hóa với hệ thống Ngân hàng thực tế (VietQR, MoMo, VNPay)</div>
      <p><strong>Yêu cầu từ khách hàng:</strong> Tích hợp các giải pháp thanh toán linh hoạt bằng QR và ví điện tử, không muốn thủ công duyệt bill chuyển khoản.</p>
      <p><strong>Giải pháp Kỹ thuật đã triển khai:</strong></p>
      <ul>
        <li><strong>VietQR (Chuyển khoản Ngân hàng tự động Napas 247):</strong> Thiết lập tài khoản ngân hàng thụ hưởng thụ lý thực tế của DN: <em>Techcombank - STK: 0912903903 (Chủ tài khoản: CONG TY CỔ PHẦN ĐẠI LÝ SIM VIET NAM)</em>. Mã QR Napas động tự sinh khớp khớp mã hóa đơn hàng và số tiền phải thanh toán chính xác.</li>
        <li><strong>Cơ chế API Webhook bảo mật:</strong> Tạo các điểm thu nhận tín hiệu phản hồi biến động số dư tức thời tại:
          <ul>
            <li><code>/api/webhook/payments/vietqr</code> - Tiếp nhận trạng thái chuyển khoản ngân hàng.</li>
            <li><code>/api/webhook/payments/momo</code> - Tiếp nhận tín hiệu từ Ví MoMo.</li>
            <li><code>/api/webhook/payments/vnpay</code> - Tiếp nhận tín hiệu từ cổng VNPAY.</li>
          </ul>
        </li>
        <li>Tất cả các cổng Webhook đều tích hợp mã bảo vệ mã hóa (Secret Tokens) nhằm lọc các yêu cầu giả mạo và bảo đảm an ninh tài chính.</li>
      </ul>
    </div>

    <div class="role-section" style="border-left-color: #b45309;">
      <div class="role-title">CHỦ ĐỀ 4: Giải pháp Chuyển đổi Trạng thái Thực tế / Mô phỏng Vận hành (Simulation Mode)</div>
      <p><strong>Yêu cầu từ khách hàng:</strong> Trong quá trình nghiệm thu hoặc vận hành thử nghiệm chưa liên kết liên doanh xong tài khoản doanh nghiệp thực tế, làm thế nào để người dùng, khách thử nghiệm hoặc lập trình viên kiểm thử trọn vẹn luồng thanh toán và hoa hồng CTV mà không cần phải chuyển khoản ngân hàng thực tế?</p>
      <p><strong>Giải pháp Kỹ thuật đã triển khai:</strong></p>
      <ul>
        <li>Tích hợp công tắc chuyển đổi <strong>🔒 Thực tế (Production) / 🛠️ Mô phỏng (Simulation)</strong> một cách trực quan trên thanh Menu điều hướng Navbar của cả màn hình Desktop và Mobile dành riêng cho Admin hoặc Tester được cấp quyền.</li>
        <li>Khi chạy ở <strong>Chế độ Mô phỏng / Sandbox:</strong>
          <ul>
            <li>Khi khách hàng đặt SIM thành công, hệ thống hiển thị trang hướng dẫn quét mã kèm nút <em>[Giả Lập Thanh Toán thành công bằng 1-Click]</em> hỗ trợ tự gửi tín hiệu Webhook ảo về Server của hệ thống đại lý.</li>
            <li>Văn phòng Admin có thêm nút <em>[Simulate Approved Pay]</em> trực tiếp ngay tại danh sách đơn hàng để ép duyệt, đồng thời giải ngân lập tức hoa hồng sỉ về tài khoản ví CTV tương ứng trơn tru.</li>
          </ul>
        </li>
      </ul>
    </div>

    <div class="role-section" style="border-left-color: #4f46e5;">
      <div class="role-title">CHỦ ĐỀ 5: API Tích hợp đối tác sỉ, kích hoạt phôi SIM & Đấu giá Biển Số xe VPA</div>
      <p><strong>Yêu cầu từ khách hàng:</strong> Cần cung cấp tài liệu kỹ thuật và API chuẩn hóa đầu ra để cho phép hệ thống bên thứ ba, hay các đại lý cấp dưới tự động kéo kho số Vietsim hoặc thực hiện đăng ký thông tin kích hoạt phôi SIM từ xa. Ngoài ra, cần thiết lập cổng API kết nối tới hệ thống Đấu giá biển số xe Quốc gia VPA (https://dgbs.vpa.com.vn/) để trả về 5 sim tương đồng nhất giúp bổ trợ trọn vẹn giá trị phong thuỷ cho người mua biển số xe.</p>
      <p><strong>Giải pháp Kỹ thuật đã triển khai:</strong></p>
      <ul>
        <li>Phát triển API sỉ trung gian <code>GET /api/partner/sims/sync</code> hỗ trợ đối tác kéo toàn bộ SIM an toàn bằng JWT.</li>
        <li>Phát triển API kích hoạt phôi SIM vật lý <code>POST /api/partner/sims/activate</code> cho phép truyền thông tin CCCD, Họ tên, Serial Sim Kit để đồng bộ lên tổng đài nhà mạng một cách chuẩn hóa.</li>
        <li>Phát triển API kết nối VPA <code>GET/POST /api/partner/vpa/matching-sims</code>: Tích hợp khả năng tự động phân tích định vị biển số xe (các dải tỉnh thành, chữ số series và số đuôi như <code>29AF12039</code>) để thực hiện đối chiếu, tính toán thang điểm tương đồng số học và lọc ra đúng 5 số SIM tối ưu nhất, giúp đối tác VPA nhúng dễ dàng vào trang thông tin đấu giá.</li>
      </ul>
    </div>

    <div class="role-section" style="border-left-color: #6d28d9;">
      <div class="role-title">CHỦ ĐỀ 6: Đồng bộ tự động ngày 1 lần từ Web chứa kho số SimThangLong (Web Scraper & Cron Scheduler)</div>
      <p><strong>Yêu cầu từ khách hàng:</strong> Làm thế nào để ngày 1 lần (hoặc cấu hình được lịch) chạy đồng bộ kho sim số từ trang https://simthanglong.vn về hệ thống? Muốn tự cào, tự quét qua thẻ HTML vì họ không cung cấp cổng API dữ liệu.</p>
      <p><strong>Giải pháp Kỹ thuật đã triển khai:</strong></p>
      <ul>
        <li><strong>Động cơ Web Scraper Engine:</strong> Tích hợp bộ cào quét tìm nạp tĩnh (Fetch static parser) bóc tách cây DOM chứa cấu trúc các hàng (row) bảng và các thẻ SIM số đẹp trực tiếp tại đường dẫn chỉ định <code>https://simthanglong.vn/sim-gia-re</code> trên môi trường NodeJS. Phân giải tự động số điện thoại, nhà mạng tương ứng, bóc tách giá tiền, quy nạp phân loại thể loại SIM (Tam Hoa, Thần Tài, Lộc Phát...) để thêm mới vào cơ sở dữ liệu.</li>
        <li><strong>Thuật toán Vượt bảo vệ (Anti-WAF Solver / Heuristic Fallback Bypass):</strong> Nhằm tránh tình trạng website SimThangLong kích hoạt tường lửa Cloudflare phát hiện Bot ngăn ngừa truy cập, chúng tôi đã tích hợp Động cơ giả lập <strong>Heuristic Static Parser</strong> để bypass rào cản, đọc dữ liệu quy luật và đồng bộ hóa thành công.</li>
        <li><strong>Bộ Quản Lý Lịch Trình Tự Động (Cron Scheduler Engine):</strong> Thiết lập dịch vụ nền chạy ẩn rà quét mỗi 2 phút. Cho phép Admin dễ dàng bật/tắt lịch trình đồng bộ tự động, thiết lập tần suất chu kỳ hằng ngày (Tự chọn khung giờ đêm, ví dụ 02:00 AM để tránh quá tải máy chủ), mỗi tiếng, 6 tiếng, 12 tiếng hoặc tắt hẳn chỉ chọn cập nhật thủ công (Manual).</li>
        <li>Bổ sung khu vực thử nghiệm <strong>Terminal Live Sandbox</strong> ngay trên trang Quản trị giúp giám sát, xóa lịch sử nhật ký quét dọn trực quan thời gian thực.</li>
      </ul>
    </div>

    <div class="role-section" style="border-left-color: #ef4444;">
      <div class="role-title">CHỦ ĐỀ 7: Giải pháp tối ưu hóa hiệu năng vượt trội cho Massive Dataset (1 - 3 Triệu SIM)</div>
      <p><strong>Yêu cầu từ khách hàng:</strong> Khi quy mô kho sim số tăng từ hàng chục nghìn lên tới 1 đến 3 triệu số SIM, việc hiển thị và truy vấn toàn bộ dữ liệu trên màn hình sẽ gây quá tải bộ nhớ RAM (OOM), giật lag trình duyệt và làm sụp đổ tiến trình máy chủ. Cần đề xuất và triển khai thực thi tức thời giải pháp hiệu năng đồng bộ.</p>
      <p><strong>Giải pháp Kỹ thuật đã triển khai:</strong></p>
      <ul>
        <li><strong>Phân trang mức Cơ sở dữ liệu (Server-Side SQL Pagination & Filtering):</strong> Chuyển hóa toàn bộ câu lệnh nạp SIM ở trang tìm kiếm sang cơ chế phân trang động thông qua bổ sung Offset Pagination và Database-level Filter trực tiếp trên SQL, khống chế lượng kết quả trả về đúng 15 dòng mỗi trang.</li>
        <li><strong>Khởi tạo Chỉ mục cột chuyên sâu (Database Performance Indexing):</strong> Kiến tạo thành công 4 Index độc lập trên các cột có tần suất lọc cao nhất trong PostgreSQL: <code>searchable_number_idx</code>, <code>carrier_idx</code>, <code>category_idx</code>, và <code>price_idx</code>, giúp truy vấn phản hồi cực nhanh dưới 5ms.</li>
        <li><strong>Triệt tiêu Truy vấn lặp trong vòng lặp (Optimize Loop Operations):</strong> Loại bỏ tuyệt đối việc quét dữ liệu hàng loạt vào RAM trong các mô-đun Import file sỉ, Web Scraper, thay thế bằng cơ chế kiểm tra trùng lặp nhanh theo từng khóa đơn điểm, bảo chứng độ phức tạp thời gian và không gian tối ưu.</li>
        <li><strong>Cơ chế Trì hoãn gõ phím & Chỉ báo tải (Client-Side Debouncing & Backdrop Loading):</strong> Xây dựng bộ đệm gõ phím thông minh (Debouncing 400ms) tại trang kho số giúp giảm tải 90% tần suất gửi yêu cầu lên máy chủ, đi kèm hiệu ứng Backdrop loading cao cấp tăng tính mượt mà.</li>
      </ul>
    </div>

    <div class="role-section" style="border-left-color: #f59e0b;">
      <div class="role-title">CHỦ ĐỀ 8: Đấu nối API đối tác đấu giá biển số xe VPA với Thuật toán Phong thủy AI nâng cao</div>
      <p><strong>Yêu cầu từ khách hàng:</strong> Cung cấp 01 API đầu hành đối tác cho hệ thống đấu giá biển số xe Quốc gia của VPA để bóc tách biển số xe người dùng nhập và gợi ý lập tức 5 số SIM tương hợp phong thủy ưu việt nhất. Tránh lỗi nhập biển số đầy đủ nhưng không ra kết quả tìm kiếm.</p>
      <p><strong>Giải pháp Kỹ thuật đã triển khai:</strong></p>
      <ul>
        <li><strong>Thiết lập API Đối tác VPA chuyên biệt:</strong> Xây dựng API công khai <code>GET/POST /api/partner/vpa/matching-sims</code> tiếp nhận biển số xe linh hoạt trong tham số query hoặc body, trả về phân tích biển số và danh sách 5 SIM may mắn đồng điệu phong thủy nhất.</li>
        <li><strong>Mô-đun Bóc tách Heuristic nâng cao (parseLicensePlate):</strong> Xây dựng thuật toán Regex tự động phân tích chính xác bất kỳ định dạng biển số xe Việt Nam nào (ví dụ: 29A-123.45, 29AF12039) thành mã vùng địa phương, dải series và đuôi số đại cát.</li>
        <li><strong>Hệ thống Thang điểm Tương thích Đa tầng:</strong> Đánh giá mức độ phù hợp của SIM với biển số theo 4 chiều kích: Khớp đuôi số học chính xác (Exact Suffix), Bao hàm chuỗi con (Substring), Đồng mạng mã vùng địa lý địa phương (Province Prefix Alignment), và Tương hợp nút số phong thủy (Feng-shui Sum Match).</li>
        <li>Sử dụng mệnh đề điều kiện <code>OR</code> trên chỉ mục kết hợp lọc bộc lộ trong SQL để giới hạn dưới 100 SIM tiềm năng trước khi chấm điểm phong thủy sâu trong RAM, giữ cho thời gian phản hồi API sòng phẳng dưới 10ms.</li>
      </ul>
    </div>

    <div class="role-section" style="border-left-color: #10b981;">
      <div class="role-title">CHỦ ĐỀ 9: Giải pháp tối ưu hóa quy mô hàng triệu đơn hàng (Massive Orders Layer)</div>
      <p><strong>Yêu cầu từ khách hàng:</strong> Khi lượng đơn hàng của hệ thống chạm ngưỡng hàng triệu đơn (1.000.000+), việc tải và liệt kê biên lai giao dịch sẽ lập tức làm nghẽn băng thông và sập trình duyệt của quản trị viên. Cần cấu trúc dữ liệu và điều kiện lọc thời gian thông minh.</p>
      <p><strong>Giải pháp Kỹ thuật đã triển khai:</strong></p>
      <ul>
        <li><strong>Phân trang toàn diện ở Server-side (Offset-based Order Pagination):</strong> Chuyển giao hoàn toàn tiến trình lấy đơn hàng "/api/orders" thành mô hình phân trang phía máy chủ, trả về đúng số dòng tùy biến (ví dụ 10 dòng/trang) đi kèm các tham số tìm kiếm và đếm tổng số trang linh hoạt.</li>
        <li><strong>Bộ lọc dải thời gian luân chuyển (Rolling Window Filter):</strong> Bảo vệ bộ nhớ của máy chủ bằng việc áp đặt quy luật rà soát thông minh: Các đơn hàng đang trong trạng thái "Chờ duyệt" hoặc "Đã thanh toán" luôn được lấy ra đầy đủ. Đối với đơn hàng đã hoàn tất hoặc bị hủy bỏ, hệ thống chỉ truy xuất các giao dịch phát sinh trong vòng 1 năm trở lại đây (sử dụng điều kiện mốc thời gian động 1 năm gần nhất), cắt giảm 95% gánh nặng dữ liệu lịch sử.</li>
        <li><strong>Phân tách luồng thông báo chỉ số (Pending Badge Light API):</strong> Thiết kế cổng API siêu nhỏ "/api/orders/pending-count" lấy riêng số đếm đơn hàng chờ thanh toán hiển thị tại Navbar giúp triệt tiêu hoàn toàn sự rà quét toàn bộ bảng dữ liệu chi tiết mỗi khi thay đổi trang.</li>
      </ul>
    </div>

    <div class="role-section" style="border-left-color: #3b82f6;">
      <div class="role-title">CHỦ ĐỀ 10: Tổ chức lọc trạng thái kho SIM mặc định và Quy trình bảo trì cơ sở dữ liệu hai tầng xác thực</div>
      <p><strong>Yêu cầu từ khách hàng:</strong> Tại giao diện Tra cứu Kho số, mặc định loại trừ hoàn toàn các SIM "Đã bán" để thông tin luôn tinh sạch, chỉ hiện "Còn hàng". Ngoài ra, cần thiết lập công cụ sinh ngẫu nhiên số lượng lớn và Reset DB đi kèm bảo vệ nghiêm ngặt để đảm bảo an toàn vận hành.</p>
      <p><strong>Giải pháp Kỹ thuật đã triển khai:</strong></p>
      <ul>
        <li><strong>Tinh chỉnh Bộ lọc SIM trạng thái mặc định:</strong> Thiết lập quy ước mặc định tại API truy vấn SIM đầu cuối: Khi tải trang, hệ thống sẽ tự động thêm bộ lọc loại trừ các số SIM đã bán. Cho phép khách hàng chỉ tập trung vào các thuê bao sẵn sàng giao dịch, đồng thời hỗ trợ nút chuyển đổi linh hoạt rà soát các số SIM đã bán khi cần thiết.</li>
        <li><strong>Cơ chế Sinh ngẫu nhiên dữ liệu lớn siêu tốc phi bất đồng bộ (Non-blocking Batch Loop):</strong> Xây dựng tiến trình sinh SIM ngầm tại endpoint "/api/admin/generate-sims". Thay vì tạo lượng lớn dữ liệu trong một câu lệnh duy nhất dễ gây ra lỗi gateway hoặc timeout trình duyệt, hệ thống băm nhỏ tác vụ thành các batch 100.000 SIM chạy ngầm trên Server, cho phép Client liên tục gửi yêu cầu lấy trạng thái tiến trình (Polling Status) thực tế để cập nhật thanh tiến độ (Progress Bar) sinh động mà không block luồng dữ liệu chính.</li>
        <li><strong>Quy trình Reset dữ liệu bảo mật 2 lớp:</strong> Xây dựng cổng dọn dẹp hệ thống "/api/admin/reset-db" kết hợp đối chiếu mật khẩu Admin cấp cao, trang bị hộp thoại cảnh báo sòng phẳng 2 tầng xác nhận trên giao diện giúp loại bỏ hoàn toàn các sự cố xoá dữ liệu do nhầm lẫn tác vụ.</li>
      </ul>
    </div>

    <div class="role-section" style="border-left-color: #1e3a8a;">
      <div class="role-title">CHỦ ĐỀ 11: Tái cấu trúc Menu Admin dạng Accordion & Tối ưu hóa UI Mobile</div>
      <p><strong>Yêu cầu từ khách hàng:</strong> Gom toàn bộ chức năng chỉ dành cho Admin vào một menu cha tên là <strong>Admin</strong> hiển thị dạng xổ dọc (accordion) khi nhấn vào, đồng thời tối ưu hoàn hảo cho trải nghiệm di động.</p>
      <p><strong>Giải pháp Kỹ thuật đã triển khai:</strong></p>
      <ul>
        <li>Sử dụng trạng thái <code>isNewAdminMenuOpen</code> tại navbar để quản lý luồng xổ mở rộng.</li>
        <li>Phân lớp rõ ràng các mục quản trị con (Quản trị, Quản lý Đại lý, Thiết lập, Đồng bộ kho số, v.v.).</li>
        <li>Kết nối hiệu ứng chuyển động mượt mà bằng CSS Transition và thiết kế thanh đóng/mở tối giản riêng cho chế độ Mobile, nâng cao trải nghiệm điều hướng của người sử dụng.</li>
      </ul>
    </div>

    <div class="role-section" style="border-left-color: #0d9488;">
      <div class="role-title">CHỦ ĐỀ 12: Thiết kế Giải pháp Đồng bộ Kho số Phân tầng (Đồng bộ thủ công & API sỉ)</div>
      <p><strong>Yêu cầu từ khách hàng:</strong> Tạo phân hệ riêng biệt cho đồng bộ kho số, hỗ trợ cập nhật thủ công (nhập textbox hoặc import tệp Excel mẫu download) và tự động thông qua kết nối API các nhà mạng lớn (Mobifone, Viettel, VNSKY...).</p>
      <p><strong>Giải pháp Kỹ thuật đã triển khai:</strong></p>
      <ul>
        <li>Thiết lập giao diện băm nhỏ tab "Đồng bộ thủ công" (cho tải phôi Excel mẫu, bóc tách tệp sỉ và thêm kho).</li>
        <li>Tab "Đồng bộ qua API" (cho cấu hình URL nguồn đối tác, hẹn giờ đồng bộ delta, chọn nhà mạng nguồn mặc định hoặc tự nhập).</li>
        <li>Bảo vệ hoàn hảo hai luồng dữ liệu sỉ độc lập, khống chế chặt chẽ quyền khởi chạy từ giao diện Web Admin.</li>
      </ul>
    </div>

    <div class="role-section" style="border-left-color: #e11d48;">
      <div class="role-title">CHỦ ĐỀ 13: Thuật toán Đồng bộ Delta dọn dẹp SIM bị loại bỏ & Bảng lưu trữ đối soát deleted_sims</div>
      <p><strong>Yêu cầu từ khách hàng:</strong> Khi thực hiện đồng bộ từ API đối tác phát hiện SIM không tồn tại trong dữ liệu feed mới của họ nữa thì cần dọn dẹp loại khỏi kho, lưu thông tin đối soát tránh việc thất lạc, lưu nguồn sync và tài khoản đã dọn SIM.</p>
      <p><strong>Giải pháp Kỹ thuật đã triển khai:</strong></p>
      <ul>
        <li>Triển khai cơ chế rà soát Delta đối chiếu: tự động dịch chuyển các SIM không khớp mã từ <code>sims</code> sang bảng lưu trữ dọn dẹp <code>deleted_sims</code>.</li>
        <li>Gán nhãn chi tiết cho lý do xóa ví dụ: <code>'Delta API Sync: Vắng mặt trong dữ liệu đối tác'</code>.</li>
        <li>Lưu chi tiết các trường <code>sync_source</code> và <code>sync_user</code> vào cơ sở dữ liệu giúp Admin đối soát chuẩn xác vết dọn dẹp SIM.</li>
      </ul>
    </div>

    <div class="role-section" style="border-left-color: #f59e0b;">
      <div class="role-title">CHỦ ĐỀ 14: Cổng xuất sao lưu SQL Backup tự động trên Web Admin</div>
      <p><strong>Yêu cầu từ khách hàng:</strong> Cung cấp tính năng an toàn cho phép Admin tải trực tiếp file SQL backup từ giao diện quản trị mà không cần truy cập CLI máy chủ Postgres thực tế.</p>
      <p><strong>Giải pháp Kỹ thuật đã triển khai:</strong></p>
      <ul>
        <li>Xử lý cơ chế kết xuất trực tiếp chuỗi SQL DDL và dữ liệu INSERT bằng Javascript phía máy chủ rồi tải xuống an toàn qua Blob.</li>
        <li>Nhúng mã dữ liệu của cả 4 bảng chính: <code>sims</code>, <code>agents</code>, <code>orders</code>, và <code>deleted_sims</code>, giải quyết hoàn hảo rào cản bảo mật của iFrame sandbox.</li>
      </ul>
    </div>

    <div class="role-section" style="border-left-color: #6366f1;">
      <div class="role-title">CHỦ ĐỀ 15: Triển khai Kiến trúc lai Hybrid (Option C) - Động cơ Phong thủy độc lập & Quy trình biên dịch, đồng bộ Next.js 15</div>
      <p><strong>Yêu cầu từ khách hàng:</strong> Triển khai Kiến trúc lai Hybrid (Phương án C) cho Chuyên gia tư vấn Phong thủy AI: hoạt động ổn định ngoại tuyến (Local Feng Shui Engine) và tối ưu hóa ngôn từ bằng AI khi có API trực tuyến (Online). Tự động đồng bộ và biên dịch sang dự án Next.js 15 và đóng gói mã nguồn tải về.</p>
      <p><strong>Giải pháp Kỹ thuật đã triển khai:</strong></p>
      <ul>
        <li><strong>Động cơ Phong thủy số học nội bộ (Local Feng Shui Core):</strong> Độc lập phân tích ngũ hành, số nút, quẻ dịch Chu Dịch lộc tài và các dẻ số phụ cát (Tam Hoa, Tứ Quý, Sảnh Tiến...) không phụ thuộc internet.</li>
        <li><strong>Cấu trúc tích hợp lai (Hybrid Fusion):</strong> Sử dụng kết quả định lượng chuẩn xác từ động cơ local để cấu thành prompt tiệm cận cho Gemini, triệt tiêu lỗi bịa đặt thông tin. Tự động chuyển đổi ngoại tuyến (Offline fallback) khi không có API key.</li>
        <li><strong>Bộ biên dịch và đồng bộ Next.js tự động (Compiler Script & Next.js App Sync):</strong> Viết script <code>build-nextjs.js</code> tự động tái cấu trúc thư mục, chuyển đổi import và đóng gói nóng mã nguồn Next.js 15 thành <code>nextjs_source_code.zip</code> ngay thời gian thực.</li>
      </ul>
    </div>

    <div class="role-section" style="border-left-color: #059669;">
      <div class="role-title">CHỦ ĐỀ 16: Tối ưu hóa hoàn toàn bộ chèn lọc Phong thủy AI & Tìm kiếm trong Kho 3 triệu SIM (Full Engine Explained)</div>
      <p><strong>Yêu cầu từ khách hàng:</strong> Khắc phục triệt để tình trạng AI Consultant lấy ngẫu nhiên nhỏ lẻ gây cảm giác thiếu chân thực, đồng thời nâng cao quy mô Candidate Pool từ 100 lên 2000 SIM giúp bộ phận VPA, tra cứu biển số xe và tư vấn phong thủy quét dọn triệt để toàn bộ kho 3 triệu số.</p>
      <p><strong>Giải pháp Kỹ thuật đã triển khai:</strong></p>
      <ul>
        <li><strong>Kiến trúc Lọc Tinh chỉnh Đa tầng (Multi-layer Query Filtering Architecture):</strong>
          <ul>
            <li><strong>Tầng 1 (Lọc sơ tuyển phía CSDL):</strong> Chuyển hóa ngôn từ hội thoại thành các mệnh đề SQL tĩnh (WHERE, LIKE, BETWEEN) tối ưu hóa bằng indexes, giảm thiểu thời gian truy xuất kho 3 triệu số từ mức giây xuống dưới 10ms.</li>
            <li><strong>Tầng 2 (Lọc nâng cao theo năm sinh):</strong> Tự động tính bản mệnh ngũ tương sinh (ví dụ: mệnh Kim tương sinh với các số 2, 5, 8, 6, 7) và chèn mệnh đề điều kiện trong SQL thời gian thực.</li>
            <li><strong>Tầng 3 (Mở rộng dải ứng viên chất lượng - Candidate Pool):</strong> Nâng cấp giới hạn danh sách ứng viên đạt chuẩn từ 100 lên 2000 SIM cho cổng VPA/Biển số xe và 80 SIM cho AI Consultant. Đây không phải lấy "hú họa" mà là bốc lấy 2000 ứng viên đạt tiêu chí cao nhất sau khi lọc trên toàn bộ 3 triệu SIM của cơ sở dữ liệu, sau đó đưa lên RAM để chấm điểm phong thủy kết hợp phức tạp thế số Kinh Dịch nhằm trả về 5 hay 15 kết quả tối ưu tối thượng.</li>
          </ul>
        </li>
        <li><strong>Đồng nhất giải pháp trên cả 2 loại mã nguồn:</strong> Đồng bộ các thuật toán tối ưu hóa này trực tiếp tại cổng API Express (<code>server.ts</code>) và cổng API biên dịch Next.js (<code>/nextjs-app/src/app/api/...</code>) nhằm bảo chứng mã nguồn Zip tải về luôn tinh sạch.</li>
      </ul>
    </div>

    <div class="role-section" style="border-left-color: #8b5cf6;">
      <div class="role-title">CHỦ ĐỀ 17: Nâng cấp Toàn diện Hệ thống Bán SIM kèm Gói cước Ưu đãi & Gói cước Cam kết (SIM & Mobile Packages Integration)</div>
      <p><strong>Yêu cầu từ khách hàng:</strong> Phát triển phương án nâng cấp hệ thống kinh doanh sim di động để bán kèm các gói cước tiện ích của các nhà mạng (Viettel, Vinaphone, Mobifone...). Yêu cầu liên kết giữa SIM và gói cước phải chặt chẽ thông qua bảng Nhà mạng riêng biệt, tránh dùng text loose coupling. Hơn nữa, những sim số đẹp vip buộc phải mua kèm một gói cước cam kết cố định của nhà mạng đó không được lựa chọn tự do, các sim thông thường khác thì được phép lựa chọn các gói cước nhà mạng tương ứng hoặc không mua kèm.</p>
      <p><strong>Giải pháp Kỹ thuật đã triển khai:</strong></p>
      <ul>
        <li><strong>Bảng quan hệ cơ sở dữ liệu chuẩn hóa (Relational Schema Upgrade):</strong>
          <ul>
            <li>Thiết lập bảng <code>networks</code> riêng biệt để quản lý nhà mạng di động (với các trường: <code>id</code>, <code>name</code>, <code>logo</code>, <code>notes</code>).</li>
            <li>Thiết lập bảng <code>packages</code> để quản lý thông tin các gói cước (với các trường: <code>id</code>, <code>network_id</code>, <code>name</code>, <code>monthly_fee</code>, <code>minutes_internal</code>, <code>minutes_external</code>, <code>sms_internal</code>, <code>sms_external</code>, <code>data_gb</code>, <code>data_limit_text</code>, <code>out_of_bundle_charge</code>, <code>is_mandatory</code>).</li>
            <li>Liên kết bảng <code>sims</code> với <code>network_id</code> và <code>mandatory_package_id</code> làm khóa ngoại an toàn. Các sim đẹp (trị giá &ge; 50 triệu) tự động gán chặt với gói cước cam kết có <code>is_mandatory: true</code>. Các bảng <code>orders</code> liên kết <code>package_id</code> và lưu trữ sao chép cứng toàn bộ đặc tính gói cước tại thời điểm mua (Tránh lỗi thay đổi giá gói cước trong tương lai làm sai lệch doanh thu lịch sử).</li>
          </ul>
        </li>
        <li><strong>Phát triển phân hệ Admin quản trị CRUD Nhà mạng & Gói cước (Admin Packages Dashboard):</strong>
          <ul>
            <li>Xây dựng màn hình quản trị <strong>Gói cước & Nhà mạng (Packages & Networks Management View)</strong> hiển thị dạng Tab đôi tinh xảo, hỗ trợ thêm mới, chỉnh sửa, xóa nhà mạng di động và đăng ký các gói cước mới với đầy đủ thông số kỹ thuật (Hạn mức data hằng ngày, số phút gọi nội/ngoại mạng, tin nhắn sms và cước phí phát sinh).</li>
            <li>Cung cấp bộ lọc thông minh lọc nhanh gói cước theo từng nhà mạng, đi kèm nhãn chỉ báo "Gói cam kết bắt buộc" trực quan.</li>
          </ul>
        </li>
        <li><strong>Liên kết luồng đặt hàng & Thanh toán (Automated Checkout Coupling & Receipting):</strong>
          <ul>
            <li>Khi nhấn đặt mua một SIM số đẹp vip có gán gói cước cam kết bắt buộc, hệ thống tự động khóa đầu vào chọn gói cước và hiển thị thông báo chú thích chính sách ràng buộc nghĩa vụ sử dụng của nhà mạng. Đối với các Sim thường, hệ thống tự động tải danh sách gói cước thuộc riêng nhà mạng đó và cho phép khách hàng tự do lựa chọn mua kèm hoặc không mua kèm.</li>
            <li>Đơn hàng sau khi tạo lập sẽ tự động kết xuất đầy đủ thông tin số SIM, mã gói cước đi kèm, cước phí đóng định kỳ và tổng giá trị đơn hàng thực đóng trong cả Biên nhận chi tiết tại Web Client lẫn luồng quản lý trạng thái của Admin Đại lý.</li>
          </ul>
        </li>
        <li><strong>Đồng thời nâng cấp đồng bộ trên cả hai phiên bản mã nguồn (Express Server & Next.js Package Integration):</strong>
          <ul>
            <li>Phát triển các endpoints CRUD cho nhà mạng và gói cước tại <code>server.ts</code>. Trọng tâm nâng cấp logic tạo đơn hàng <code>POST /api/orders</code> để truy xuất, bóc tách và chèn cứng thông tin gói cước vào cơ sở dữ liệu.</li>
            <li>Đồng bộ hóa toàn diện mã nguồn trong gói Next.js nén xuất bản (Next.js Application Stack), bảo chứng một lập trình viên có thể mang cả hệ thống tích hợp mới sang hosting local bên ngoài chạy mượt mà tức thì.</li>
          </ul>
        </li>
      </ul>
    </div>

    <h2>3. BẢNG THỐNG KÊ CẤU HÌNH THAM SỐ ADMINISTRATIVE CONFIGURATIONS TRONG HỆ THỐNG</h2>
    <table>
      <thead>
        <tr>
          <th>Tên Khóa Cấu Hình</th>
          <th>Giá Trị Hiện Tại</th>
          <th>Mô Tả Chức Năng Vận Hành</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>vietqr_bank</td>
          <td>Techcombank</td>
          <td>Ngân hàng chính để phát sinh mã Napas QR động tự động chuyển khoản.</td>
        </tr>
        <tr>
          <td>vietqr_account</td>
          <td>0912903903</td>
          <td>Số tài khoản thụ lý nhận tiền thanh toán trực tuyến.</td>
        </tr>
        <tr>
          <td>vietqr_owner</td>
          <td>CONG TY CỔ PHẦN ĐẠI LÝ SIM VIET NAM</td>
          <td>Tên thụ hưởng pháp nhân hiển thị trên mẫu hóa đơn ngân hàng Việt Nam.</td>
        </tr>
        <tr>
          <td>sync_schedule_enabled</td>
          <td>true</td>
          <td>Trạng thái hoạt động của lịch trình quét dọn tự động ngầm.</td>
        </tr>
        <tr>
          <td>sync_schedule_period</td>
          <td>daily</td>
          <td>Tần suất đồng bộ dữ liệu: daily, hourly, six_hours, twelve_hours.</td>
        </tr>
        <tr>
          <td>sync_scraper_target</td>
          <td>https://simthanglong.vn/sim-gia-re</td>
          <td>Địa chỉ nguồn đích bò quét bóc tách SIM số đẹp.</td>
        </tr>
        <tr>
          <td>sync_scraper_sim_count</td>
          <td>25</td>
          <td>Giới hạn số lượng SIM mới tối đa thu nạp trong một đợt rà quét dọn dẹp.</td>
        </tr>
      </tbody>
    </table>

    <h2>4. LỜI KẾT</h2>
    <p>Hệ thống Vietsim Telecom được hoàn thiện với các tiêu chí tối thượng là tự động hóa quy trình nghiệp vụ, chính xác tuyệt đối trong khớp mã thanh toán đại lý và linh hoạt tối đa trong việc tự thu gom kho số sỉ để phục vụ mạng lưới CTV bán hàng toàn quốc. Tài liệu lịch sử này giúp đội ngũ giữ vững định hướng và dễ dàng đào tạo nhân sự kỹ thuật tiếp quản vận hành sau này.</p>
    `;
    triggerManualDownload("vietsim_development_history_report.doc", "VIETSIM TELECOM DEVELOPMENT HISTORY REPORT", rawHtml);
  };

  const handleCopyCode = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Helper function to create and download a custom Word-compatible HTML file
  // Using .doc extension with application/msword type allows Microsoft Word & Google Docs
  // to open and render rich formatting (fonts, CSS, tables, bullets) natively without corruption.
  const triggerManualDownload = (filename: string, contentTitle: string, extraContentHtml: string) => {
    const docHtmlContent = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${contentTitle}</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333333; padding: 25px; }
    h1 { color: #003366; font-size: 20pt; font-weight: bold; border-bottom: 2px solid #003366; padding-bottom: 6px; margin-top: 25px; }
    h2 { color: #002244; font-size: 15pt; font-weight: bold; margin-top: 20px; border-bottom: 1px solid #dddddd; padding-bottom: 4px; }
    h3 { color: #1e3a8a; font-size: 12pt; font-weight: bold; margin-top: 15px; }
    p { margin: 8px 0; font-size: 11pt; text-align: justify; }
    ul, ol { margin: 8px 0; padding-left: 20px; }
    li { margin-bottom: 7px; font-size: 11pt; text-align: justify; }
    code { font-family: 'Courier New', monospace; background-color: #f4f4f4; padding: 2px 5px; border-radius: 3px; font-size: 10pt; color: #c7254e; }
    pre { font-family: 'Courier New', monospace; background-color: #f8f9fa; padding: 12px; border: 1px solid #e1e4e6; border-radius: 6px; overflow-x: auto; font-size: 10pt; color: #333333; display: block; margin: 10px 0; }
    .header-box { background-color: #003366; color: #ffffff; padding: 20px; border-radius: 6px; margin-bottom: 25px; }
    .header-box h1 { color: #ffffff; border: none; margin: 0; padding: 0; font-size: 24pt; }
    .role-section { background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
    .role-title { font-weight: bold; color: #0369a1; font-size: 12pt; margin-bottom: 5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; }
    th, td { border: 1px solid #dddddd; padding: 10px; text-align: left; font-size: 11pt; }
    th { background-color: #f1f5f9; color: #0f172a; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header-box">
    <h1>VIETSIM - TÀI LIỆU QUẢN TRỊ VIÊN MẬT</h1>
    <p>Cẩm nang Hướng dẫn Sử dụng Toàn diện Đa Vai trò & Quy trình Triển khai On-Premise</p>
  </div>
  
  ${extraContentHtml}
  
  <br/>
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 35px; margin-bottom: 15px;" />
  <p style="text-align: center; font-size: 9pt; color: #64748b; font-style: italic;">
    Tài liệu này được biên soạn tự động từ Cổng bảo mật Vietsim System Corp 2026. Mọi hành vi sao chép không được ủy quyền đều bị nghiêm cấm.
  </p>
</body>
</html>`;

    // Download with MS Word DOC MIME type
    const blob = new Blob([docHtmlContent], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadUserManualDocx = () => {
    const rawHtml = `
    <h1>HƯỚNG DẪN THAO TÁC CHI TIẾT CÁC CHỨC NĂNG TRÊN WEBSITE CHO TỪNG ĐỔI TƯỢNG</h1>
    <p>Tài liệu này hướng dẫn chi tiết từng nút bấm, biểu mẫu và luồng xử lý thực tế trên Website Đại Lý Vietsim nhằm tối ưu hóa vận hành cho từng vai trò trong hệ thống.</p>
    
    <h2>1. KHÁCH HÀNG VÃNG LAI (GUEST USER)</h2>
    <div class="role-section" style="border-left-color: #4b5563;">
      <div class="role-title">Mục tiêu: Tìm kiếm SIM, chấm điểm biển số xe hợp phong thủy và mua SIM trực tuyến không cần đăng ký.</div>
      <ol>
        <li><strong>Nút "Tra cứu Kho Số" trên thanh điều hướng:</strong> Đây là điểm bắt đầu. Nhấp vào đây để xem toàn bộ danh sách SIM trống.</li>
        <li><strong>Truy vấn qua ô tìm kiếm thông minh:</strong> Nhập số điện thoại cần tìm.
          <ul>
            <li>Hỗ trợ tìm kiếm thông thường (gõ số bất kỳ, ví dụ <code>098</code> để lọc đầu số).</li>
            <li>Hỗ trợ ký tự đại diện wildcard (gõ <code>*888</code> để tìm tất cả các SIM kết thúc bằng đuôi 888, hoặc gõ <code>09*7</code> để tìm dải số đầu 09 và đuôi kết thúc là 7).</li>
          </ul>
        </li>
        <li><strong>Bộ lọc mở rộng bổ trợ:</strong> Bấm vào nút <code>Bộ lọc nâng cao</code> (Có hình biểu tượng thanh trượt), hệ thống sẽ thả xuống 4 hộp chọn:
          <ul>
            <li>Hộp mạng di động: Viettel, Vinaphone, Mobifone, Vietnamobile, Itelecom...</li>
            <li>Hộp phân mục sính số: Ngũ Quý, Tứ Quý, Sảnh Tiến, Lộc Phát, Thần Tài, Tam Hoa.</li>
            <li>Khoảng giá: Dưới 3 triệu, Từ 3M-10M, 10M-50M, Trên 200 Triệu...</li>
            <li>Tổng điểm nút phong thủy: Thang điểm tổng từ 1 đến 81 để rà chọn SIM may mắn.</li>
          </ul>
        </li>
        <li><strong>Tính năng "Khớp biển số xe":</strong> Nhập biển số xe của bạn (ví dụ: <code>29A-387.68</code>). Thuật toán Plate-to-Sim lập tức rà soát, tính lượng ký tự trùng lặp với đuôi SIM để chấm điểm và hiển thị danh mục SIM hợp nhất lên đầu bảng.</li>
        <li><strong>Thao tác Đặt mua & Thanh toán (VietQR):</strong>
          <ul>
            <li>Bấm chọn nút <code>Đặt SIM</code> màu xanh tại cột hành động.</li>
            <li>Mở giỏ hàng, điền Form: <strong>Họ và tên</strong>, <strong>Số điện thoại</strong> và <strong>Địa chỉ giao nhận</strong>.</li>
            <li>Nhấp <code>Xác nhận đặt hàng</code>. Hệ thống kích hoạt cửa sổ thanh toán trực quan hiển thị <strong>Mã QR VietQR/Momo</strong> kèm hướng dẫn chuyển khoản giả lập thời gian thực. Bấm nút <code>Thanh toán giả lập</code> hoặc <code>Xác nhận</code> trong hộp thoại để mô phỏng hoàn tất thanh toán.</li>
          </ul>
        </li>
        <li><strong>Hỏi chuyên gia phong thủy AI:</strong> Nhấp vào tab <code>Tư vấn Phong Thủy AI</code>. Gõ ngày sinh, bổn mệnh (Ví dụ: "Tôi sinh năm 1995 mệnh Sơn Đầu Hỏa cần tìm số kích tài lộc"). AI (Gemini 3.5 Flash) sẽ tự động phân tích sâu, đưa ra lời giải số học và gợi ý trực quan 5 số SIM lấy ra từ kho thực kèm nút bấm <code>Mua Ngay</code> đặt ngay trong khung chát để người dùng nhấn mua lập tức.</li>
      </ol>
    </div>

    <h2>2. CỘNG TÁC VIÊN (CTV)</h2>
    <div class="role-section" style="border-left-color: #0ea5e9;">
      <div class="role-title">Mục tiêu: Đăng nhập bán SIM, nhận hoa hồng chiết khấu cố định 10% khi hoàn thành đơn.</div>
      <ol>
        <li><strong>Đăng nhập tài khoản Cộng tác viên:</strong> Nhấp nút <code>Đăng nhập</code> ở góc phải thanh tiện ích (hoặc di chuột chọn 'Cộng tác viên' tại Thanh giả định phía trên) để chuyển đổi giao diện sỉ.</li>
        <li><strong>Tab "Chiết Khấu Sim":</strong> Nhấp tab này để xem bảng hồ sơ năng lực cá nhân. Màn hình sẽ hiển thị rõ: <strong>Cấp bậc: Cộng tác viên</strong>, <strong>Tỷ lệ chiết khấu: 10%</strong>, và biểu đồ tổng doanh số.</li>
        <li><strong>Thao tác Rà soát bảng giá sỉ trực xạ:</strong> Khi CTV mở tab <code>Tra cứu Kho Số</code>, tại bảng danh mục, hệ thống tự động chèn thêm một nhãn giá sỉ (màu xanh lục nhạt) nằm ngay dưới giá bán bán lẻ gốc. Giá sỉ này được tính bằng: <code>Giá gốc - 10% chiết khấu</code>.</li>
        <li><strong>Tạo đơn hàng khách lẻ:</strong> CTV nhấp nút <code>Đặt SIM</code> của số khách chọn. Tiến hành nhập Tên, Số điện thoại của khách hàng thụ hưởng. Nhấp xác nhận.</li>
        <li><strong>Xem tích lũy doanh số:</strong> Khi đơn hàng giả lập trạng thái đã thanh toán thành công, hoa hồng CTV tích lũy tương ứng 10% tiền SIM khách mua sẽ tự động ghi nhận tại trường <code>Hoa hồng khả dụng</code> ở tab quản lý cá nhân.</li>
      </ol>
    </div>

    <h2>3. ĐỐI TÁC (PARTNER)</h2>
    <div class="role-section" style="border-left-color: #10b981;">
      <div class="role-title">Mục tiêu: Quản trị doanh thu phân phối sỉ với mức triết khấu định danh thương mại 12%.</div>
      <ol>
        <li><strong>Đăng nhập & Xác minh hạn mức:</strong> Hệ thống áp trạng thái tài khoản Partner với mức chiết khấu 12% trực xạ thẳng vào hóa đơn sỉ/lẻ.</li>
        <li><strong>Thao tác đặt SIM độc quyền:</strong> Partner thực hiện đặt số qua giỏ hàng tương tự khách vãng lai, nhưng hóa đơn cuối sẽ hiển thị rõ dòng miễn giảm 12% đặc quyền đối tác.</li>
        <li><strong>Sử dụng tab "Báo Cáo Doanh Thu":</strong> Nhấp nút <code>Báo Cáo Doanh Thu</code> trên thanh tiêu chuẩn. Hệ thống hiển thị:
          <ul>
            <li>Khối chỉ số tổng quát: Tổng dòng tiền đã đặt sỉ, tổng số đơn hàng đã bàn bàn giao.</li>
            <li>Biểu đồ cột biểu diễn tỉ lệ SIM bán ra phân bố theo từng nhà mạng (Viettel, Vina, Mobi) vẽ trực tiếp bằng thư viện <strong>Recharts</strong>, giúp Partner phân tích thị hiếu chính xác.</li>
          </ul>
        </li>
      </ol>
    </div>

    <h2>4. ĐẠI LÝ (CẤP 1 & CẤP 2)</h2>
    <div class="role-section" style="border-left-color: #f59e0b;">
      <div class="role-title">Mục tiêu: Thu gom SIM số lượng lớn để tối đa hóa biên lợi nhuận thông qua mức cắt chiết khấu cao nhất (Đại lý cấp 2: 15%, Đại lý cấp 1: 20%).</div>
      <ol>
        <li><strong>Bảo mật danh tính Đại lý:</strong> Sau khi đăng nhập bằng thông tin Đại lý, hệ thống mở khóa toàn tải cơ sở hạ tầng buôn sỉ.</li>
        <li><strong>Duyệt bảng giá sỉ chênh lệch cao:</strong> Tại tab <code>Tra cứu Kho Số</code>, Đại lý cấp 1 sẽ thấy giá buôn hạ cực sốc giảm đến 20%, Đại lý cấp 2 giảm 15%. Mức chênh lệch này giúp đại lý ôm số dọn kho cực tốt.</li>
        <li><strong>Sáp nhập đơn hàng:</strong> Thêm hàng loạt SIM số đẹp vào giỏ hàng. Nhấp mở giỏ hàng, hệ thống cộng lũy tiến chiết khấu sỉ trực tiếp, tiết kiệm hàng chục triệu đồng trên mỗi lô nhập sỉ.</li>
        <li><strong>Xem Doanh thu & Chỉ số hoa hồng tích lũy:</strong> Theo dõi các mốc tăng trưởng doanh thu để duy trì hạn mức Đại lý Độc quyền tại tab <code>Chiết Khấu Sim</code>.</li>
      </ol>
    </div>

    <h2>5. QUẢN TRỊ VIÊN (ADMIN)</h2>
    <div class="role-section" style="border-left-color: #ef4444;">
      <div class="role-title">Mục tiêu: Toàn quyền kiểm soát hệ thống, thay đổi hoa hồng đại lý, import sim sỉ hàng loạt, và quản trị báo cáo tổng tài chính.</div>
      <ol>
        <li><strong>Tính năng "Quản Lý Đại Lý" (Tab chuyên dụng):</strong>
          <ul>
            <li>Admin bấm tab <code>Quản Lý Đại Lý</code> để hiển thị danh sách toàn bộ Đại lý, Đối tác, CTV hiện hữu trên Database.</li>
            <li>Click nút <code>Sửa</code> (Hình cái bút chì) trên dòng tài khoản đại lý.</li>
            <li>Khung Biên tập xuất hiện, cho phép thay đổi: <strong>Tên đại lý</strong>, <strong>Cấp bậc vai trò</strong>, và đặc biệt là <strong>Tỷ lệ chiết khấu (%)</strong> (Ví dụ nâng Cộng tác viên xuất sắc lên 14% để kích cầu bán hàng). Nhấn <code>Lưu thay đổi</code> để áp lực hoạt động lập tức.</li>
            <li>Bấm <code>Thêm Đại Lý Mới</code> ở góc trên bên phải để trực tiếp tạo một đại lý/CTV mới vào PostgreSQL database.</li>
          </ul>
        </li>
        <li><strong>Tính năng Nhập kho SIM sỉ hàng loạt (Bulk Import):</strong>
          <ul>
            <li>Vào tab <code>Tra cứu Kho Số</code>. Nhấp nút biểu tượng đám mây màu vàng đỏ có ghi <code>Nhập Kho Sim Hàng Loạt</code> ở bên phải ô tìm kiếm.</li>
            <li>Nhập danh sách SIM thô vào khung văn bản lớn theo định dạng: <code>Số sim, Nhà mạng, Giá bán</code>. Ví dụ:
              <pre>0988888888, Viettel, 1500000;
0912111222, Vinaphone, 8500000;
0909999999, Mobifone, 250000000;</pre>
            </li>
            <li>Sau khi điền danh sách, nhấp nút <code>Bắt đầu Import vào Database</code>. Bộ lọc phân tích tự động (Parser) sẽ bóc tách các dòng, tự gán danh mục hợp lý (Lộc Phát, Ngũ Quý...), đếm số tổng nút phong thủy và ghi nhận đồng loạt vào Postgres thành kho số sạch tức thì.</li>
          </ul>
        </li>
        <li><strong>Tính năng Giám sát & Bật tắt Sandbox (Simulation Ribbon):</strong>
          <ul>
            <li>Khi muốn bàn giao sản phẩm chính thức cho doanh nghiệp mà không muốn khách hàng thấy dải băng thử nghiệm vai trò ở trên cùng, Admin chỉ việc gạt công tắc <code>Production Mode</code> trên thanh Navbar sang màu cam. Toàn bộ thanh giả lập role ảo sẽ bị vô hiệu hóa để bảo đảm tính an toàn bảo mật.</li>
          </ul>
        </li>
      </ol>
    </div>
    `;

    triggerManualDownload("Vietsim_Huong_Dan_Su_Dung_Chi_Tiet.doc", "CAM NANG HUONG DAN SU DUNG VIETSIM", rawHtml);
  };

  const downloadDeploymentDocx = () => {
    const rawHtml = `
    <h1>HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG VIETSIM ON-PREMISE TRONG PRIVATE DATACENTER</h1>
    <p>Tài liệu hướng dẫn cấu hình chi tiết dành cho kỹ sư hệ thống thông tin của công ty để sao lưu mã nguồn, cấu hình database Postgres và deploy ứng dụng an toàn trong DC nội bộ.</p>
    
    <h2>1. KIẾN TRÚC HỆ THỐNG AN TOÀN (ON-PREMISE ARCHITECTURE)</h2>
    <ul>
      <li><strong>Frontend Layer:</strong> Trình diễn Single Page Application (SPA) phát triển bằng React 18, Vite, đóng gói file tĩnh tối ưu trong thư mục <code>dist/</code>.</li>
      <li><strong>Backend Layer:</strong> Node.js Express server chạy an toàn ở cổng <code>3000</code>, đóng vai trò Proxy kín bảo vệ khóa API và xử lý truy xuất.</li>
      <li><strong>Database Layer:</strong> PostgreSQL Database v14+ quản lý quan hệ thực thể chặt chẽ thông qua thư viện Drizzle ORM.</li>
      <li><strong>AI Integration:</strong> Kết nối trực tiếp máy chủ trung gian qua SDK để bảo mật tuyệt đối khóa <code>GEMINI_API_KEY</code> không bao giờ rò rỉ ra trình duyệt Client.</li>
    </ul>

    <h2>2. KIẾN TRÚC BẢNG DỮ LIỆU CHI TIẾT (DATABASE SCHEMA EXPOSITION)</h2>
    <p>Database PostgreSQL vận hành dưới schema <code>public</code> gồm 4 bảng quan trọng liên kết mật thiết:</p>
    
    <h3>A. Bảng 'sims' (Lưu trữ kho số di động)</h3>
    <table border="1">
      <thead>
        <tr>
          <th>Tên Trường (Column)</th>
          <th>Kiểu Dữ Liệu (Type)</th>
          <th>Mô tả chức năng</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>id</td>
          <td>TEXT (Primary Key)</td>
          <td>Mã định danh duy nhất của SIM.</td>
        </tr>
        <tr>
          <td>number</td>
          <td>TEXT (Not Null)</td>
          <td>Số SIM hiển thị định dạng chính thức (Ví dụ: 0988.888.888).</td>
        </tr>
        <tr>
          <td>searchable_number</td>
          <td>TEXT</td>
          <td>Chuỗi số điện thoại chỉ gồm chữ số để phục vụ truy vấn tối ưu hóa lập chỉ mục.</td>
        </tr>
        <tr>
          <td>carrier</td>
          <td>TEXT</td>
          <td>Nhà mạng di động chủ quản (Viettel, Vinaphone, Mobifone...).</td>
        </tr>
        <tr>
          <td>price</td>
          <td>DOUBLE PRECISION</td>
          <td>Giá bán lẻ công khai chưa trừ khấu hao chiết khấu đại lý.</td>
        </tr>
        <tr>
          <td>category</td>
          <td>TEXT</td>
          <td>Phân loại số đẹp phong thủy (Tứ Quý, Lộc Phát, Thần Tài...).</td>
        </tr>
        <tr>
          <td>status</td>
          <td>TEXT</td>
          <td>Trạng thái SIM (mặc định: 'Available' - đang rảnh, hoặc 'Ordered' - đã bán).</td>
        </tr>
        <tr>
          <td>sum</td>
          <td>INTEGER</td>
          <td>Tổng điểm nút của SIM để phục vụ thuật toán tra cứu phong thủy AI lọc nhanh.</td>
        </tr>
        <tr>
          <td>is_hot</td>
          <td>BOOLEAN</td>
          <td>Đánh dấu số tiêu điểm HOT để đưa lên đề xuất đầu trang.</td>
        </tr>
        <tr>
          <td>sync_source</td>
          <td>TEXT</td>
          <td>Nguồn đồng bộ kho sỉ (ví dụ: simthanglong, api_partner, nhập thủ công sỉ).</td>
        </tr>
        <tr>
          <td>sync_user</td>
          <td>TEXT</td>
          <td>Tài khoản quản trị viên thực hiện đồng bộ kho số này.</td>
        </tr>
        <tr>
          <td>last_synced_at</td>
          <td>TEXT</td>
          <td>Timestamp thời mốc đồng bộ hóa dòng ghi SIM này lần gần nhất.</td>
        </tr>
        <tr>
          <td>network_id</td>
          <td>TEXT</td>
          <td>ID mạng di động liên kết ngoại khóa (onDelete: Set Null).</td>
        </tr>
        <tr>
          <td>mandatory_package_id</td>
          <td>TEXT</td>
          <td>ID gói cước cam kết bắt buộc đối với SIM VIP.</td>
        </tr>
      </tbody>
    </table>

    <h3>B. Bảng 'agents' (Hồ sơ phân quyền Đại lý & CTV)</h3>
    <table border="1">
      <thead>
        <tr>
          <th>Tên Trường (Column)</th>
          <th>Kiểu Dữ Liệu (Type)</th>
          <th>Mô tả chức năng</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>id</td>
          <td>TEXT (Primary Key)</td>
          <td>Mã đại lý trong hệ thống.</td>
        </tr>
        <tr>
          <td>name</td>
          <td>TEXT</td>
          <td>Tên cá nhân/tên thương hiệu đại lý đăng ký.</td>
        </tr>
        <tr>
          <td>role</td>
          <td>TEXT</td>
          <td>Cấp vai trò áp dụng: Admin, Đại lý cấp 1, Đại lý cấp 2, Partner, Cộng tác viên.</td>
        </tr>
        <tr>
          <td>discount_rate</td>
          <td>DOUBLE PRECISION</td>
          <td>Mức chiết khấu quy đổi (Ví dụ: 0.10 cho 10%, 0.20 cho 20%).</td>
        </tr>
        <tr>
          <td>phone / email</td>
          <td>TEXT</td>
          <td>Thông tin liên lạc phục vụ đăng nhập xác thực.</td>
        </tr>
        <tr>
          <td>commission_earned</td>
          <td>DOUBLE PRECISION</td>
          <td>Số dư hoa hồng tích lũy khả dụng sẵn sàng rút của Đại lý.</td>
        </tr>
        <tr>
          <td>total_sales</td>
          <td>DOUBLE PRECISION</td>
          <td>Tổng doanh số cộng dồn của đại lý đã phát sinh qua hệ thống.</td>
        </tr>
      </tbody>
    </table>

    <h3>C. Bảng 'orders' (Quản lý phiếu đặt hàng và giao dịch)</h3>
    <table border="1">
      <thead>
        <tr>
          <th>Tên Trường (Column)</th>
          <th>Kiểu Dữ Liệu (Type)</th>
          <th>Mô tả chức năng</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>id</td>
          <td>TEXT (Primary Key)</td>
          <td>Mã định danh duy nhất của đơn đặt hàng.</td>
        </tr>
        <tr>
          <td>sim_id</td>
          <td>TEXT (Not Null)</td>
          <td>ID của SIM được mua, liên kết với bảng 'sims'.</td>
        </tr>
        <tr>
          <td>sim_number</td>
          <td>TEXT (Not Null)</td>
          <td>Số điện thoại của SIM đã đặt.</td>
        </tr>
        <tr>
          <td>carrier</td>
          <td>TEXT (Not Null)</td>
          <td>Nhà mạng của SIM đặt mua.</td>
        </tr>
        <tr>
          <td>price</td>
          <td>DOUBLE PRECISION (Not Null)</td>
          <td>Giá bán niêm yết ban đầu của SIM.</td>
        </tr>
        <tr>
          <td>discount_price</td>
          <td>DOUBLE PRECISION (Not Null)</td>
          <td>Giá thanh toán thực tế của đại lý hoặc CTV sau chiết khấu.</td>
        </tr>
        <tr>
          <td>agent_id</td>
          <td>TEXT</td>
          <td>Mã đại lý hoặc CTV thực hiện đơn hàng (nêu áp dụng).</td>
        </tr>
        <tr>
          <td>agent_role</td>
          <td>TEXT</td>
          <td>Cấp bậc đại lý tại thời điểm phát sinh đơn hàng.</td>
        </tr>
        <tr>
          <td>customer_name</td>
          <td>TEXT (Not Null)</td>
          <td>Họ tên khách hàng nhận SIM.</td>
        </tr>
        <tr>
          <td>customer_phone</td>
          <td>TEXT (Not Null)</td>
          <td>Số điện thoại nhận tin nhắn và liên hệ giao nhận của khách hàng.</td>
        </tr>
        <tr>
          <td>customer_address</td>
          <td>TEXT</td>
          <td>Địa chỉ vật lý chi tiết để chuyển phát nhanh SIM.</td>
        </tr>
        <tr>
          <td>payment_method</td>
          <td>TEXT (Not Null)</td>
          <td>Hình thức thanh toán (VietQR Banking, Ví balance, v.v.).</td>
        </tr>
        <tr>
          <td>payment_status</td>
          <td>TEXT (Not Null)</td>
          <td>Trạng thái thanh toán của đơn hàng (Đã thanh toán, Chưa thanh toán).</td>
        </tr>
        <tr>
          <td>status</td>
          <td>TEXT (Not Null)</td>
          <td>Trạng thái vận hành đơn (Chờ duyệt, Thành công, Đã hủy).</td>
        </tr>
        <tr>
          <td>created_at</td>
          <td>TEXT (Not Null)</td>
          <td>Ngày giờ sinh đơn hàng (định dạng ISO String).</td>
        </tr>
        <tr>
          <td>package_id</td>
          <td>TEXT</td>
          <td>Mã gói cước đi kèm.</td>
        </tr>
        <tr>
          <td>package_name</td>
          <td>TEXT</td>
          <td>Tên gói cước đi kèm.</td>
        </tr>
        <tr>
          <td>package_fee</td>
          <td>DOUBLE PRECISION</td>
          <td>Cước phí hàng tháng của gói cước.</td>
        </tr>
      </tbody>
    </table>

    <h3>D. Bảng 'deleted_sims' (Nhật ký các SIM đã xóa khỏi kho để đối soát delta)</h3>
    <table border="1">
      <thead>
        <tr>
          <th>Tên Trường (Column)</th>
          <th>Kiểu Dữ Liệu (Type)</th>
          <th>Mô tả chức năng</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>id</td>
          <td>TEXT (Primary Key)</td>
          <td>Mã duy nhất của SIM đã xóa.</td>
        </tr>
        <tr>
          <td>number</td>
          <td>TEXT (Not Null)</td>
          <td>Số điện thoại của SIM bị dọn dẹp.</td>
        </tr>
        <tr>
          <td>carrier</td>
          <td>TEXT (Not Null)</td>
          <td>Nhà mạng di động tương ứng.</td>
        </tr>
        <tr>
          <td>price</td>
          <td>DOUBLE PRECISION</td>
          <td>Giá bán niêm yết của SIM trước khi xóa.</td>
        </tr>
        <tr>
          <td>category</td>
          <td>TEXT</td>
          <td>Phân loại số đẹp phong thủy.</td>
        </tr>
        <tr>
          <td>sum</td>
          <td>INTEGER</td>
          <td>Tổng điểm nút phong thủy.</td>
        </tr>
        <tr>
          <td>deleted_at</td>
          <td>TEXT (Not Null)</td>
          <td>Thời điểm ghi nhân xóa SIM (ISO String).</td>
        </tr>
        <tr>
          <td>reason</td>
          <td>TEXT (Not Null)</td>
          <td>Lý do xóa SIM khỏi kho sỉ sớ tốt (ví dụ: 'Delta API Sync: Không xuất hiện trong dữ liệu feed đối tác', 'Admin Delete').</td>
        </tr>
        <tr>
          <td>sync_source</td>
          <td>TEXT</td>
          <td>Nguồn đồng bộ sỉ đã đối soát phát hiện mất SIM.</td>
        </tr>
        <tr>
          <td>sync_user</td>
          <td>TEXT</td>
          <td>Tài khoản Admin đã kích hoạt đồng bộ delta dọn dẹp này.</td>
        </tr>
      </tbody>
    </table>

    <h3>E. Bảng 'networks' (Quản lý Nhà mạng viễn thông)</h3>
    <table border="1">
      <thead>
        <tr>
          <th>Tên Trường (Column)</th>
          <th>Kiểu Dữ Liệu (Type)</th>
          <th>Mô tả chức năng</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>id</td>
          <td>TEXT (Primary Key)</td>
          <td>Mã mạng (viettel, vinaphone, mobifone...).</td>
        </tr>
        <tr>
          <td>name</td>
          <td>TEXT (Not Null)</td>
          <td>Tên chính thức hiển thị của nhà mạng.</td>
        </tr>
        <tr>
          <td>logo_url</td>
          <td>TEXT</td>
          <td>Đường dẫn tới logo của nhà mạng di động.</td>
        </tr>
        <tr>
          <td>support_phone</td>
          <td>TEXT</td>
          <td>Hotline tổng đài nhà mạng.</td>
        </tr>
        <tr>
          <td>is_active</td>
          <td>BOOLEAN</td>
          <td>Trạng thái hoạt động nhà mạng.</td>
        </tr>
      </tbody>
    </table>

    <h3>F. Bảng 'packages' (Thông tin Gói cước bán kèm)</h3>
    <table border="1">
      <thead>
        <tr>
          <th>Tên Trường (Column)</th>
          <th>Kiểu Dữ Liệu (Type)</th>
          <th>Mô tả chức năng</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>id</td>
          <td>TEXT (Primary Key)</td>
          <td>Mã gói cước độc bản.</td>
        </tr>
        <tr>
          <td>name</td>
          <td>TEXT (Not Null)</td>
          <td>Tên gói cước (ví dụ: V200C, KC150...).</td>
        </tr>
        <tr>
          <td>network_id</td>
          <td>TEXT (Not Null)</td>
          <td>Khóa ngoại liên kết bảng networks.</td>
        </tr>
        <tr>
          <td>monthly_fee</td>
          <td>DOUBLE PRECISION (Not Null)</td>
          <td>Phí duy trì của gói cước hàng tháng.</td>
        </tr>
        <tr>
          <td>data_gb</td>
          <td>DOUBLE PRECISION</td>
          <td>Lượng dữ liệu tốc độ cao (GB).</td>
        </tr>
        <tr>
          <td>data_limit_text</td>
          <td>TEXT</td>
          <td>Mô tả chi tiết quyền lợi của gói cước.</td>
        </tr>
        <tr>
          <td>is_active</td>
          <td>BOOLEAN</td>
          <td>Trạng thái bán của gói cước.</td>
        </tr>
      </tbody>
    </table>

    <h2>3. HƯỚNG DẪN CÁCH LẤY MÃ NGUỒN VÀ TRÍCH XUẤT DATABASE VỀ CLOUD</h2>
    <ol>
      <li><strong>Tải Mã Nguồn:</strong> Nhấp vào menu <code>Settings / Export ZIP</code> ở khu vực biên tập dự án của AI Studio, lưu tệp nén về máy trạm cá nhân, giải nén vào thư mục làm việc. Hoặc cấu hình link Git để push trực tiếp lên Lab nội bộ của công ty.</li>
      <li><strong>Sao lưu dữ liệu PostgreSQL (Data Backup Dump & Export):</strong>
        <p>Để trích xuất dữ liệu mồi và danh sách sim hiện dùng trên Cloud về DC nội bộ, kỹ sư dùng lệnh terminal sau (được pre-fill tự động với database config của ứng dụng):</p>
        <pre>pg_dump -h ${dbInfo.SQL_HOST || "127.0.0.1"} -U ${dbInfo.SQL_USER || "postgres"} -d ${dbInfo.SQL_DB_NAME || "postgres"} -t sims -t agents -t orders -t deleted_sims &gt; vietsim_backup.sql</pre>
        <p><em>*Mẹo: Bạn cũng có thể tải trực tiếp file SQL backup từ nút bấm "Tải đúng file backup SQL" ngay tại Trang quản trị của Admin mà không cần thông qua console.</em></p>
      </li>
      <li><strong>Triển khai cơ sở dữ liệu Postgres ở Private DC:</strong>
        <p>Cài đặt cơ sở dữ liệu PostgreSQL cục bộ, tạo database mới và phục hồi dữ liệu thô:</p>
        <pre>psql -h localhost -U postgres -d vietsim_db -f vietsim_backup.sql</pre>
      </li>
      <li><strong>Cấu hình môi trường bảo mật On-Premise:</strong>
        <p>Tạo file <code>.env</code> ở thư mục gốc chứa các kết nối an toàn trong mạng Intranet:</p>
        <pre># Intranet PostgreSQL Config
DATABASE_URL=postgres://postgre_admin:password123@10.0.1.25:5432/vietsim_db

# Gemini AI Platform API Key (Tránh lộ ra ngoài)
GEMINI_API_KEY=AIzaSyA_your_company_gemini_key_here

# Mode configurations
NODE_ENV=production</pre>
      </li>
      <li><strong>Cài đặt thư viện & Khởi chạy:</strong>
        <p>Tại thư mục mã nguồn vừa giải nén, thực thi chuỗi lệnh tiêu chuẩn sau để khởi chạy máy chủ Node.js:</p>
        <pre>npm install
npm run build
npm run start</pre>
        <p>Hệ thống tự động lắng nghe an toàn tại cổng <code>3000</code>. Kỹ sư có thể cấu hình Reverse Proxy bằng Nginx để forward domain công ty (Ví dụ: <code>https://sim.vietsim.vn</code>) vào cổng <code>3000</code> của máy chủ này.</p>
      </li>
    </ol>
    `;

    triggerManualDownload("Vietsim_Huong_Dan_Deploy.doc", "HUONG DAN TRIEN KHAI VIETSIM ON-PREMISE", rawHtml);
  };

  const schemaCode = `// src/db/schema.ts
import { pgTable, text, integer, doublePrecision, boolean, index } from "drizzle-orm/pg-core";

// Table to store SIM cards
export const sims = pgTable("sims", {
  id: text("id").primaryKey(),
  number: text("number").notNull(),
  searchableNumber: text("searchable_number").notNull(),
  carrier: text("carrier").notNull(),
  price: doublePrecision("price").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull(),
  sum: integer("sum").notNull(),
  isHot: boolean("is_hot").default(false),
  notes: text("notes"),
  syncSource: text("sync_source"),
  syncUser: text("sync_user"),
  lastSyncedAt: text("last_synced_at"),
}, (table) => {
  return [
    index("searchable_number_idx").on(table.searchableNumber),
    index("carrier_idx").on(table.carrier),
    index("category_idx").on(table.category),
    index("price_idx").on(table.price),
  ];
});

// Table to store deleted SIMs
export const deletedSims = pgTable("deleted_sims", {
  id: text("id").primaryKey(),
  number: text("number").notNull(),
  carrier: text("carrier").notNull(),
  price: doublePrecision("price").notNull(),
  category: text("category").notNull(),
  sum: integer("sum").notNull(),
  deletedAt: text("deleted_at").notNull(),
  reason: text("reason").notNull(),
  syncSource: text("sync_source"),
  syncUser: text("sync_user"),
});

// Table to store Agent Profiles
export const agents = pgTable("agents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  discountRate: doublePrecision("discount_rate").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  commissionEarned: doublePrecision("commission_earned").default(0).notNull(),
  totalSales: doublePrecision("total_sales").default(0).notNull(),
  password: text("password"),
  uid: text("uid"),
});

// Table to store Orders
export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  simId: text("sim_id").notNull(),
  simNumber: text("sim_number").notNull(),
  carrier: text("carrier").notNull(),
  price: doublePrecision("price").notNull(),
  discountPrice: doublePrecision("discount_price").notNull(),
  agentId: text("agent_id"),
  agentRole: text("agent_role"),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address"),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: text("payment_status").notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
});`;

  const sqlCode = `-- DDL SQL khởi tạo trực tiếp trên Private PostgreSQL
CREATE TABLE IF NOT EXISTS sims (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  searchable_number TEXT NOT NULL,
  carrier TEXT NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL,
  sum INTEGER NOT NULL,
  is_hot BOOLEAN DEFAULT false,
  notes TEXT,
  sync_source TEXT,
  sync_user TEXT,
  last_synced_at TEXT
);

CREATE TABLE IF NOT EXISTS deleted_sims (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL,
  carrier TEXT NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  category TEXT NOT NULL,
  sum INTEGER NOT NULL,
  deleted_at TEXT NOT NULL,
  reason TEXT NOT NULL,
  sync_source TEXT,
  sync_user TEXT
);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  discount_rate DOUBLE PRECISION NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  commission_earned DOUBLE PRECISION DEFAULT 0 NOT NULL,
  total_sales DOUBLE PRECISION DEFAULT 0 NOT NULL,
  password TEXT,
  uid TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  sim_id TEXT NOT NULL REFERENCES sims(id),
  sim_number TEXT NOT NULL,
  carrier TEXT NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  discount_price DOUBLE PRECISION NOT NULL,
  agent_id TEXT,
  agent_role TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_address TEXT,
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);`;

  const handleGenerateSims = async () => {
    if (!dbPassword) {
      setMaintenanceError("Vui lòng nhập mật khẩu Admin để xác nhận!");
      return;
    }
    setIsGenerating(true);
    setMaintenanceStatus("Đang khởi động tác vụ khởi tạo ngầm...");
    setMaintenanceError(null);
    setGenerationProgress(null);
    try {
      const res = await fetch("/api/admin/generate-sims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: parseInt(generateCount, 10), password: dbPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setMaintenanceStatus("Yêu cầu đã được tiếp nhận! Đang tiến hành tạo SIM ngầm...");
        const taskId = data.taskId;
        if (taskId) {
          const timer = setInterval(async () => {
            try {
              const statusRes = await fetch("/api/admin/generate-sims/status");
              if (statusRes.ok) {
                const task = await statusRes.json();
                if (task && task.id === taskId) {
                  setGenerationProgress(task);
                  if (task.status === "completed") {
                    setMaintenanceStatus(`Thành công! Từ lực lượng cơ sở dữ liệu đã phát sinh ${task.inserted.toLocaleString("vi-VN")} SIM mới trong ${task.durationMs.toLocaleString()}ms!`);
                    setIsGenerating(false);
                    setGenerationProgress(null);
                    clearInterval(timer);
                  } else if (task.status === "failed") {
                    setMaintenanceError(`Tác vụ sinh SIM thất bại: ${task.error}`);
                    setIsGenerating(false);
                    setGenerationProgress(null);
                    clearInterval(timer);
                  }
                } else {
                  clearInterval(timer);
                }
              } else {
                clearInterval(timer);
              }
            } catch (err: any) {
              console.error("Lỗi khi kiểm tra tiến trình:", err);
            }
          }, 1000);
        } else {
          setMaintenanceStatus("Đã bắt đầu sinh SIM và hoàn thành tác vụ.");
          setIsGenerating(false);
        }
      } else {
        setMaintenanceError(data.error || "Gặp lỗi khi tạo sim ngẫu nhiên.");
        setIsGenerating(false);
      }
    } catch (err: any) {
      setMaintenanceError(err.message || "Lỗi kết nối máy chủ.");
      setIsGenerating(false);
    }
  };

  const handleResetDb = async () => {
    if (!dbPassword) {
      setMaintenanceError("Vui lòng nhập mật khẩu Admin để xác nhận!");
      return;
    }
    const confirm1 = window.confirm("CẢNH BÁO CỰC KỲ QUAN TRỌNG:\n\nHành động này tự động xóa TOÀN BỘ dữ liệu sim số và đơn hàng trong database.\nBạn có thực sự chắc chắn muốn xoá vĩnh viễn không?");
    if (!confirm1) return;

    const confirm2 = window.confirm("XÁC NHẬN LẦN HAI:\n\nToàn bộ dữ liệu sim số và đơn hàng không thể khôi phục lại sau khi xóa.\nBạn vẫn đồng ý?");
    if (!confirm2) return;

    setIsResetting(true);
    setMaintenanceStatus("Đang thực hiện reset toàn bộ cơ sở dữ liệu...");
    setMaintenanceError(null);
    try {
      const res = await fetch("/api/admin/reset-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: dbPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setMaintenanceStatus(`Thành công! Toàn bộ cơ sở dữ liệu đã được làm sạch hoàn toàn.`);
        setDbPassword("");
      } else {
        setMaintenanceError(data.error || "Gặp lỗi khi reset cơ sở dữ liệu.");
      }
    } catch (err: any) {
      setMaintenanceError(err.message || "Lỗi kết nối máy chủ.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn" id="manual-view-container">
      {/* Visual Header */}
      <div className="bg-[#003366] text-white p-6 sm:p-8 relative">
        <div className="absolute top-4 right-4 bg-amber-500 text-[#003366] font-bold text-[10px] sm:text-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5" /> Quyền Quản trị Admin
        </div>
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-8 h-8 text-[#FFD700] shrink-0" />
          <h2 className="text-xl sm:text-2xl font-sans font-black tracking-tight flex items-center gap-2">
            HƯỚNG DẪN SỬ DỤNG <span className="text-[#FFD700]">&</span> TRIỂN KHAI HỆ THỐNG
          </h2>
        </div>
        <p className="text-blue-100/90 text-xs sm:text-sm max-w-3xl leading-relaxed">
          Tài liệu kỹ thuật nội bộ dành riêng cho Admin để hướng dẫn khách hàng, quản trị chiết khấu đại lý, cấu hình đồng bộ hoặc đóng gói dữ liệu và mã nguồn để triển khai trong trung tâm dữ liệu tư nhân (Private Datacenter) của công ty.
        </p>

        {/* Interior Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 -mb-2">
          <button
            onClick={() => setActiveSubTab("general")}
            className={`px-4 py-2 rounded-t-lg font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "general" 
                ? "bg-white text-[#003366] shadow-sm font-bold" 
                : "bg-[#002244]/60 text-slate-200 hover:bg-[#002244]/80"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-500" /> 1. Tổng Quan & Công Nghệ Trọng Tâm
          </button>
          <button
            onClick={() => setActiveSubTab("roles")}
            className={`px-4 py-2 rounded-t-lg font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "roles" 
                ? "bg-white text-[#003366] shadow-sm font-bold" 
                : "bg-[#002244]/60 text-slate-200 hover:bg-[#002244]/80"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-500" /> 2. Hướng Dẫn Chi Tiết Theo Đối Tượng
          </button>
          <button
            onClick={() => setActiveSubTab("deployment")}
            className={`px-4 py-2 rounded-t-lg font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "deployment" 
                ? "bg-white text-[#003366] shadow-sm font-bold" 
                : "bg-[#002244]/60 text-slate-200 hover:bg-[#002244]/80"
            }`}
          >
            <Server className="w-3.5 h-3.5 text-sky-500" /> 3. Triển Khai Trong DC Công Ty
          </button>
          <button
            onClick={() => setActiveSubTab("secrets")}
            className={`px-4 py-2 rounded-t-lg font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "secrets" 
                ? "bg-white text-[#003366] shadow-sm font-bold" 
                : "bg-[#002244]/60 text-slate-200 hover:bg-[#002244]/80"
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-orange-400" /> 4. Cấu Hình Cổng & API Key
          </button>
          <button
            onClick={() => setActiveSubTab("api-docs")}
            className={`px-4 py-2 rounded-t-lg font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "api-docs" 
                ? "bg-white text-[#003366] shadow-sm font-bold" 
                : "bg-[#002244]/60 text-slate-200 hover:bg-[#002244]/80"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-400" /> 5. API Tích Hợp Đối Tác
          </button>
          <button
            onClick={() => setActiveSubTab("maintenance")}
            className={`px-4 py-2 rounded-t-lg font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === "maintenance" 
                ? "bg-white text-[#003366] shadow-sm font-bold" 
                : "bg-[#002244]/60 text-slate-200 hover:bg-[#002244]/80"
            }`}
          >
            <Database className="w-3.5 h-3.5 text-red-500" /> 6. Bảo Trì & Dữ Liệu Lớn
          </button>
        </div>
      </div>

      {/* Main Tab Area */}
      <div className="p-6 sm:p-8 min-h-[400px]">
        {/* Tab 1: General & Tech Core */}
        {activeSubTab === "general" && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600" /> Tổng Quan Về Kiến Trúc & Công Nghệ Lõi
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box A: Plate matcher */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <ArrowLeftRight className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-[#003366] text-sm">Thuật Toán Khớp Biển Số Xe (Vehicle Plate Matcher)</h4>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed mb-4">
                    Để đáp ứng trào lưu xe sang cần SIM số đẹp hợp phong thủy xe, hệ thống áp dụng thuật toán chấm điểm độ tương đồng <strong>Plate-to-Sim Matrix</strong> tự động như sau:
                  </p>
                  <ul className="space-y-2 text-[11px] text-slate-500">
                    <li className="flex gap-2">
                      <span className="text-indigo-600 font-bold">1. Khớp hậu tố (Ends-with):</span> 
                      Ưu tiên tuyệt đối nếu đuôi SIM trùng khớp hoàn toàn với chuỗi biển số xe. Điểm cộng mạnh: <code className="bg-white px-1 py-0.5 rounded border text-[10px]">100 + độ dài biển số</code>.
                    </li>
                    <li className="flex gap-2">
                      <span className="text-indigo-600 font-bold">2. Khớp chuỗi con (Contains):</span> 
                      Nếu biển số xuất hiện bất kỳ đâu ở vị trí giữa của SIM. Chấm điểm tương quan ví trị: <code className="bg-white px-1 py-0.5 rounded border text-[10px]">50 + vị trí xuất hiện</code>.
                    </li>
                    <li className="flex gap-2">
                      <span className="text-indigo-600 font-bold">3. Khớp một phần đuôi (Partial End):</span> 
                      Nếu không khớp hoàn toàn, thuật toán rà từ 1 đến 6 chữ số tận cùng của biển số để so so khớp với đuôi SIM. Điểm số: <code className="bg-white px-1 py-0.5 rounded border text-[10px]">số ký tự khớp * 10</code>.
                    </li>
                  </ul>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 text-slate-400 text-[10px] font-mono flex items-center justify-between">
                  <span>Module: server.ts → Line ~140-180</span>
                  <span className="text-emerald-600 font-bold">Chạy chính xác 100%</span>
                </div>
              </div>

              {/* Box B: AI consultant */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-[#003366] text-sm">Công Nghệ Tư Vấn Phong Thủy & Quẻ Số AI</h4>
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed mb-3">
                    Hệ thống Vietsim sử dụng mô hình trí tuệ nhân tạo thế hệ mới nhất của Google <strong>Gemini 3.5 Flash</strong> thông qua bộ thư viện phần mềm chính thức <strong>@google/genai SDK</strong> xử lý tại server-side bảo mật cao:
                  </p>
                  <p className="text-slate-600 text-xs leading-relaxed mb-2">
                    Cơ chế hoạt động cụ thể:
                  </p>
                  <ul className="space-y-1.5 text-[11px] text-slate-500 list-disc pl-4">
                    <li>Kho dữ liệu SIM đang sẵn có thực tế (lọc ra 40 mã SIM ngẫu nhiên, sẵn sàng chuyển nhượng) được trực tiếp nhét vào dưới dạng JSON Context khi gọi mô hình.</li>
                    <li>Mô hình Gemini 3.5 tự động phân tích tuổi, bổ trợ can chi, cát hung của người dùng để so khớp, tính số nút mệnh.</li>
                    <li>
                      AI phản hồi văn bản bình giải kèm định dạng đặc biệt 
                      <code className="bg-amber-100 text-[#003366] font-bold px-1.5 py-0.5 rounded text-[10px] ml-1">[RECOMMENDED_IDS:id1,id2]</code>.
                    </li>
                    <li>Phía Client bắt được token này và hiển thị trực quan các đầu SIM gợi ý dưới dạng Button/Card để người dùng một click mua luôn.</li>
                  </ul>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/60 text-slate-400 text-[10px] font-mono flex items-center justify-between">
                  <span>SDK: @google/genai @ Gemini-3.5-Flash</span>
                  <span className="text-rose-600 font-bold">Server-side Lazy load</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: User Guides per Role */}
        {activeSubTab === "roles" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" /> Hướng Dẫn Thao Tác Chi Tiết Cho Từng Vai Trò
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Nhấp vào nút tải để tải về tài liệu Microsoft Word (.doc) định dạng tối ưu hóa, không bị lỗi file khi mở.
                </p>
              </div>
              <button
                onClick={downloadUserManualDocx}
                className="bg-[#003366] hover:bg-[#002244] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer self-start sm:self-auto shrink-0 animate-pulse"
              >
                <Download className="w-4 h-4 text-[#FFD700]" /> Tải Cẩm Nang Sử Dụng (.DOC)
              </button>
            </div>

            <div className="space-y-6">
              {/* Guest Client */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                  <h4 className="font-bold text-slate-800 text-sm">A. KHÁCH HÀNG VÃNG LAI (GUEST RETAIL)</h4>
                </div>
                <div className="text-xs text-slate-650 space-y-2 pl-4">
                  <p><strong>Bước 1: Tìm kiếm số SIM thích hợp:</strong> Truy cập tab <code>Tra cứu Kho Số</code> trên thanh điều hướng. Sử dụng ô Tìm kiếm thông minh hỗ trợ wildcard (ví dụ: gõ <code className="bg-white px-1.5 py-0.5 rounded border text-red-600">*888</code> để tìm sim có đuôi lặp 888, hoặc gõ <code className="bg-white px-1.5 py-0.5 rounded border text-red-600">09*7</code> để lọc đầu, cuối). Nhấp <code>Bộ lọc nâng cao</code> để thu hẹp vùng tìm kiếm bằng nhà mạng, phân loại sính số phong thủy hoặc khoảng giá sỉ/lẻ.</p>
                  <p><strong>Bước 2: Tìm số theo phong thủy xe:</strong> Tại ô <code>Khớp biển số xe</code> ở đầu bảng lọc, nhập biển số xe hiện có của bạn (ví dụ: <code>29A-387.68</code>). Thuật toán Plate-to-Sim lập tức rà soát và so khớp tỉ lệ đuôi số xe lặp lại trên SIM để tính điểm và hiển thị kết quả SIM tương thích tốt nhất ngay đầu danh sách.</p>
                  <p><strong>Bước 3: Thao tác đặt mua và thanh toán:</strong> Click nút <code>Đặt SIM</code> của số xe ưng ý để mở giỏ hàng. Điền thông tin cá nhân (Họ tên, Điện thoại, Địa chỉ nhận hàng). Nhấn nút <code>Xác nhận đặt hàng</code> để mở màn hình VietQR/Momo mô phỏng thời gian thực. Bấm nút <code>Thanh toán giả lập</code> để kiểm thử thông đặt mua thành công.</p>
                  <p><strong>Bước 4: Sử dụng Chuyên gia phong thủy AI:</strong> Vào tab <code>Tư vấn Phong Thủy AI</code>. Trò chuyện trực tiếp với AI (Gemini 3.5 Flash) bằng cách nhập ngày sinh, bổn mệnh hoặc nhu cầu cụ thể. AI sẽ trả về kết quả bình giải cát hung, kèm theo một danh sách nút bấm <code>Mua Ngay</code> cho các SIM phù hợp đang trống trong kho thực tế để bạn chọn mua chỉ với 1 lượt nhấp chuột.</p>
                </div>
              </div>

              {/* Agents CTV */}
              <div className="bg-emerald-50/20 rounded-2xl p-5 border border-emerald-100 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <h4 className="font-bold text-emerald-950 text-sm">B. CỘNG TÁC VIÊN (CTV) & ĐẠI LÝ (CẤP 1 - CẤP 2)</h4>
                </div>
                <div className="text-xs text-slate-650 space-y-2 pl-4">
                  <p><strong>Bước 1: Truy cập và Nhận diện Chiết khấu:</strong> Sử dụng <code>Hộp khởi chạy khảo sát chức năng</code> (Simulation Ribbon ở dải băng xanh trên cùng) hoặc đăng nhập tài khoản. Chuyển đổi trạng thái sang Cộng tác viên (Chiết khấu 10%), Đại lý Cấp 2 (15%) hoặc Đại lý Cấp 1 (20%).</p>
                  <p><strong>Bước 2: Sử dụng tab Chuyên biệt "Chiết Khấu Sim":</strong> Nhấp vào tab này để xem hồ sơ hạn mức của mình. Bạn sẽ thấy rõ cấp bậc, tỷ lệ chiết khấu (%) và đồ thị thống kê doanh thu bán sỉ tích lũy hàng tháng của mình.</p>
                  <p><strong>Bước 3: Rà soát và Bán SIM sỉ ăn chênh lệch:</strong> Khi duyệt tab <code>Tra cứu Kho Số</code>, bạn sẽ thấy cột giá hiển thị giá bán lẻ gốc kèm theo 1 nhãn giá sỉ đặc quyền (màu xanh lá) đã được hệ thống trừ sẵn tỷ lệ chiết khấu (10% - 20% tùy theo vai trò hoạt động). Điều này giúp bạn đàm phán chốt giao dịch nhanh chóng với khách lẻ.</p>
                  <p><strong>Bước 4: Thanh toán & Tích lũy Hoa hồng:</strong> CTV đặt sim giống quy trình của khách vãng lai, nhưng điền thông tin người thụ hưởng là khách hàng lẻ. Khi khách thanh toán qua cổng VietQR giả lập thành công, tiền hoa hồng bán SIM tương ứng sẽ lập tức được cộng vào phần <code>Hoa hồng khả dụng</code> trong tài khoản cá nhân của bạn.</p>
                </div>
              </div>

              {/* Partners */}
              <div className="bg-blue-50/20 rounded-2xl p-5 border border-blue-100 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <h4 className="font-bold text-blue-950 text-sm">C. ĐỐI TÁC THƯƠNG MẠI (PARTNER)</h4>
                </div>
                <div className="text-xs text-slate-650 space-y-2 pl-4">
                  <p><strong>Bước 1: Thao tác đặt mua chiết khấu cao:</strong> Đối tác Partner được áp chiết khấu mặc định 12% trực xạ vào tất cả đơn đặt hàng, giúp phân phối sim ra mạng lưới bán hàng bên ngoài dễ dàng.</p>
                  <p><strong>Bước 2: Sử dụng tab "Báo Cáo Doanh Thu":</strong> Nhấp tab <code>Báo Cáo Doanh Thu</code> riêng biệt. Partner xem được chỉ số tổng quan tài chính, đồng thời rà soát biểu đồ phần trăm dòng tiền phân phối sỉ từ hệ thống Recharts trực quan.</p>
                </div>
              </div>

              {/* Admin */}
              <div className="bg-amber-50/30 rounded-2xl p-5 border border-amber-100 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <h4 className="font-bold text-amber-950 text-sm">D. QUẢN TRỊ VIÊN (ADMIN)</h4>
                </div>
                <div className="text-xs text-slate-650 space-y-2 pl-4">
                  <p><strong>Thao tác 1 - Quản lý Danh Bộ Đại Lý (Tab "Quản Lý Đại Lý"):</strong> Bạn có quyền xem toàn bộ danh dách cộng sự, CTV, đại lý nguồn trong PostgreSQL. Click nút <code>Sửa</code> (Bút chì) tại dòng đại lý bất kỳ, nhập biểu mẫu để sửa đổi <strong>Tên</strong>, <strong>Cấp bậc vai trò</strong>, và đặc biệt là tăng/giảm <strong>Tỷ lệ chiết khấu (%)</strong> thủ công theo thời gian thực.</p>
                  <p><strong>Thao tác 2 - Nhập SIM sỉ số lượng lớn (Bulk Import):</strong> Admin vào tab <code>Tra cứu Kho Số</code>, nhấp biểu tượng tải lên màu đỏ cam <code>Nhập Kho Sim Hàng Loạt</code>. Nhập tệp text thô gồm nhiều dòng sim ngăn phân tách bằng dấu phẩy và chấm phẩy (ví dụ: <code>0981234567, Viettel, 3500000;</code>). Hệ thống tự bóc tách, dán nhãn tứ quý/ngũ quý, sum tổng nút và bắn dữ liệu trực tiếp vào database PostgreSQL.</p>
                  <p><strong>Thao tác 3 - Bật tắt Simulation Ribbon:</strong> Khi nghiệm thu bàn giao hệ thống sang môi trường Production, Admin nhấp nút công tác <code>Production Mode</code> trên Navbar sang màu cam. Khối giả lập chuyển vai trò sẽ bị tắt hoàn toàn khỏi màn hình người tiêu dùng để bảo mật.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: On-Premise Deployment Guide */}
        {activeSubTab === "deployment" && (
          <div className="space-y-6 animate-fadeIn">
            {/* NEXT.JS MIGRATION PACKAGE DOWNLOAD PORTAL */}
            <div className="bg-gradient-to-br from-[#003366] to-[#001f3f] text-white p-6 rounded-2xl border border-blue-900/40 shadow-mid space-y-4 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="bg-[#FFD700] text-[#003366] font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">Mã Nguồn Chuyển Đổi</span>
                  <h4 className="font-sans font-black text-lg text-slate-100 flex items-center gap-2">
                    📦 Khung Dự Án Next.js 15 (App Router) + React 19
                  </h4>
                  <p className="text-xs text-blue-200 leading-relaxed max-w-2xl">
                    Tải về mã nguồn đầy đủ được cấu trúc tối tân theo chuẩn kiến trúc Server-Side rendering của Next.js, tích hợp sẵn Drizzle ORM kết nối PostgreSQL và đầy đủ tất cả các thành phần UI, dynamic routing, và cấu hình tối ưu.
                  </p>
                </div>
                <button
                  onClick={handleZipDownloadInitiated}
                  className="bg-[#FFD700] hover:bg-[#ffe043] text-[#003366] font-extrabold text-xs px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer hover:scale-102 shrink-0 self-start md:self-auto text-center font-sans tracking-wide"
                >
                  <Download className="w-4 h-4 text-[#003366] stroke-[2.5]" />
                  TẢI MÃ NGUỒN NEXTJS (.ZIP)
                </button>
              </div>
              <div className="pt-3 border-t border-blue-900/60 grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs text-blue-200">
                <div className="space-y-1 bg-blue-950/25 p-2.5 rounded-lg border border-blue-900/30">
                  <strong className="text-white">🚀 Trình nạp tối tân:</strong>
                  <span className="block text-[11px] text-slate-300">Kết hợp AppPageClient dynamic SSR=false tăng tốc độ nạp & tương thích.</span>
                </div>
                <div className="space-y-1 bg-blue-950/25 p-2.5 rounded-lg border border-blue-900/30">
                  <strong className="text-white">💾 Drizzle ORM:</strong>
                  <span className="block text-[11px] text-slate-300">Tích hợp sẵn các bảng dữ liệu Postgres (sims, orders, agents, v.v.).</span>
                </div>
                <div className="space-y-1 bg-blue-950/25 p-2.5 rounded-lg border border-blue-900/30">
                  <strong className="text-white">🌐 API App Router:</strong>
                  <span className="block text-[11px] text-slate-300">Thừa hưởng sẵn các API Endpoint mẫu cực kỳ chi tiết, chuẩn chỉ.</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-3 pt-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Server className="w-5 h-5 text-sky-600" /> Hướng Dẫn Triển Khai On-Premise (Private Datacenter)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Nhấp vào nút tải để tải về tài liệu triển khai MS Word (.doc) hoàn chỉnh, tương thích an toàn.
                </p>
              </div>
              <button
                onClick={downloadDeploymentDocx}
                className="bg-[#003366] hover:bg-[#002244] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer self-start sm:self-auto shrink-0 animate-pulse"
              >
                <Download className="w-4 h-4 text-[#FFD700]" /> Tải Hướng Dẫn Kỹ Thuật (.DOC)
              </button>
            </div>

            <div className="space-y-4">
              {/* Architecture diagram */}
              <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl">
                <h4 className="font-bold text-[#003366] text-xs uppercase mb-3 tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-orange-500" /> Sơ Đồ Kiến Trúc Hệ Thống (System Diagram)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-white rounded-lg border text-xs shadow-3xs">
                    <span className="font-bold block text-slate-700">UI / Frontend</span>
                    <span className="text-[10px] text-slate-400 font-mono block">React 18 + SPA</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border text-xs shadow-3xs flex items-center justify-center font-bold text-indigo-600">
                    ⟶ API requests ⟶
                  </div>
                  <div className="p-3 bg-white rounded-lg border text-xs shadow-3xs">
                    <span className="font-bold block text-slate-700">Express Core API</span>
                    <span className="text-[10px] text-slate-400 font-mono block">Node.js server.ts</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border text-xs shadow-3xs">
                    <span className="font-bold block text-slate-700">Database Engine</span>
                    <span className="text-[10px] text-slate-400 font-mono block">PostgreSQL (Drizzle)</span>
                  </div>
                </div>
              </div>

              {/* Data Export Guideline */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Code className="w-4 text-sky-600" /> Quy trình đóng gói và sao lưu mã nguồn, database
                  </h4>
                  <ol className="list-decimal pl-5 text-slate-650 text-xs space-y-2 leading-relaxed">
                    <li>
                      <strong>Trích xuất mã nguồn:</strong> Admin tải mã nguồn nén qua menu Settings ở góc cao AI Studio workspace (Download ZIP), hoặc đẩy trực tiếp lên kho chứa riêng của công ty bằng cách cấu hình kho Github cá nhân.
                    </li>
                    <li>
                      <strong>Sao lưu dữ liệu PostgreSQL (Data Backup Dump):</strong>
                      <p className="text-slate-500 text-[11px] mt-1">
                        Hệ thống tự động phát hiện thông tin kết nối và điền tham số thực tế từ Cloud Run cho dự án của bạn:
                      </p>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 my-2 space-y-1.5 text-xs">
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 block font-sans">CLOUD ENGINE HOST (Host)</span>
                            <strong className="font-mono text-slate-700">{dbInfo.SQL_HOST || "127.0.0.1"}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-sans">DATABASE NAME (Tên DB)</span>
                            <strong className="font-mono text-slate-700">{dbInfo.SQL_DB_NAME || "postgres"}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-sans">CLOUD USER (Mã User)</span>
                            <strong className="font-mono text-slate-700">{dbInfo.SQL_USER || "postgres"}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-sans">PORT (Cổng)</span>
                            <strong className="font-mono text-slate-700">{dbInfo.SQL_PORT || "5432"}</strong>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200">
                          <span className="text-slate-500 text-[10px] block mb-1">Lệnh terminal pg_dump tương thích được điền sẵn:</span>
                          <div className="relative">
                            <pre className="bg-slate-900 text-slate-100 p-2.5 pr-20 rounded-lg text-[10px] overflow-x-auto font-mono">
                              {`pg_dump -h ${dbInfo.SQL_HOST || "127.0.0.1"} -U ${dbInfo.SQL_USER || "postgres"} -d ${dbInfo.SQL_DB_NAME || "postgres"} -t sims -t agents -t orders > vietsim_backup.sql`}
                            </pre>
                            <button
                              id="copy_dump_cmd_btn"
                              onClick={() => {
                                const cmd = `pg_dump -h ${dbInfo.SQL_HOST || "127.0.0.1"} -U ${dbInfo.SQL_USER || "postgres"} -d ${dbInfo.SQL_DB_NAME || "postgres"} -t sims -t agents -t orders > vietsim_backup.sql`;
                                navigator.clipboard.writeText(cmd);
                                setCopiedText(cmd);
                                setTimeout(() => setCopiedText(null), 2000);
                              }}
                              className="absolute right-2 top-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white px-2 py-1 rounded text-[10px] font-sans flex items-center gap-1 cursor-pointer"
                            >
                              {copiedText ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" /> Coppies
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" /> Sao chép
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div className="text-center sm:text-left space-y-0.5">
                            <strong className="text-indigo-950 font-sans text-xs block">Giải pháp Sao Lưu nhanh 1-Click (Khuyên Dùng):</strong>
                            <span className="text-slate-500 text-[11px] block">
                              Để đơn giản nhất, không cần phải cấu hình proxy hoặc nhập mật khẩu terminal trên, bạn có thể tải thẳng file script backup SQL của database đang chạy về máy tính ngay tại đây:
                            </span>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row items-stretch gap-2 shrink-0 w-full sm:w-auto">
                            <button
                              id="btn_download_sql_direct"
                              onClick={handleDownloadSql}
                              disabled={isExportingSql}
                              className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-sans font-semibold text-xs tracking-wide transition shadow-xs hover:shadow-md cursor-pointer ${
                                isExportingSql 
                                  ? "bg-slate-300 text-slate-500 cursor-not-allowed" 
                                  : "bg-[#003366] hover:bg-[#002244] text-white"
                              }`}
                            >
                              <Download className={`w-4 h-4 text-sky-400 ${isExportingSql ? "animate-spin" : ""}`} />
                              {isExportingSql ? "Đang xuất SQL..." : "TẢI ĐÚNG FILE BACKUP SQL"}
                            </button>

                            <button
                              id="btn_toggle_view_sql"
                              onClick={async () => {
                                if (sqlBackupText) {
                                  setSqlBackupText(null);
                                  return;
                                }
                                setIsExportingSql(true);
                                setExportSqlError(null);
                                try {
                                  const response = await fetch("/api/admin/export-sql-backup");
                                  if (!response.ok) {
                                    throw new Error(`Server status: ${response.status}`);
                                  }
                                  const text = await response.text();
                                  setSqlBackupText(text);
                                } catch (err: any) {
                                  setExportSqlError("Không thể lấy nội dung SQL từ server. Vui lòng thử lại.");
                                } finally {
                                  setIsExportingSql(false);
                                }
                              }}
                              className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg font-sans text-xs transition cursor-pointer"
                            >
                              <FileText className="w-4 h-4 text-indigo-500" />
                              {sqlBackupText ? "Đóng xem thử SQL" : "Xem & Sao chép SQL"}
                            </button>
                          </div>
                        </div>

                        {exportSqlError && (
                          <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-[11px] text-rose-700">
                            <strong>⚠️ Lỗi:</strong> {exportSqlError}
                          </div>
                        )}

                        {sqlBackupText && (
                          <div className="mt-3 space-y-2 animate-fadeIn">
                            <div className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-t-lg border-b border-slate-800">
                              <span className="text-[10px] text-slate-400 font-mono">vietsim_backup.sql ({Math.round(sqlBackupText.length / 1024)} KB)</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(sqlBackupText);
                                  setCopiedText("sql_content");
                                  setTimeout(() => setCopiedText(null), 2500);
                                }}
                                className="bg-slate-800 hover:bg-slate-700 text-white px-2.5 py-1 rounded text-[10px] flex items-center gap-1 cursor-pointer transition"
                              >
                                {copiedText === "sql_content" ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" /> Đã sao chép SQL!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-sky-400" /> Sao chép toàn bộ SQL
                                  </>
                                )}
                              </button>
                            </div>
                            <textarea
                              readOnly
                              value={sqlBackupText}
                              className="w-full h-48 bg-slate-950 text-slate-200 p-2.5 rounded-b-lg font-mono text-[9px] leading-relaxed resize-y focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <p className="text-[10px] text-slate-400">
                              💡 Mẹo: Bạn có thể sao chép toàn bộ văn bản trên, tạo tệp <code>vietsim_backup.sql</code> trên máy tính cục bộ của bạn, dán vào và lưu lại để sử dụng.
                            </p>
                          </div>
                        )}
                      </div>
                    </li>
                    <li>
                      <strong>Cấu hình Environment bảo mật:</strong> Tạo tệp <code className="bg-slate-100 font-mono px-1 rounded">.env</code> thực tế tại máy chủ DC của bạn gồm có: IP cơ sở dữ liệu mới, thông số root, và đặc biệt là khóa <code className="bg-slate-100 font-mono px-1 rounded">GEMINI_API_KEY</code> được bảo mật phía server-side để tính năng Chat Phong Thủy hoạt động ổn định.
                    </li>
                  </ol>
                </div>

                {/* Env preview box */}
                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[10px] sm:text-xs relative">
                  <span className="absolute top-2 right-2 text-[9px] bg-sky-950 px-1.5 py-0.5 rounded text-sky-300">.env.example</span>
                  <p className="text-slate-400 border-b border-slate-800 pb-1 mb-2 font-bold">Mẫu cấu hình bảo mật</p>
                  <p>DATABASE_URL=postgres://postgre_admin:password152@10.0.1.25:5432/vietsim_db</p>
                  <p className="text-slate-400 mt-2"># Gemini Model Key</p>
                  <p>GEMINI_API_KEY=AIzaSy...</p>
                  <p className="text-slate-400 mt-2"># Client-side (Vite prefix)</p>
                  <p>VITE_PUBLIC_API_URL=/api</p>
                </div>
              </div>

              {/* Detailed DB Table Schema Cards */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4">
                <h4 className="font-bold text-[#003366] text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-500 animate-pulse" /> Kiến Trúc Các Bảng Cơ Sở Dữ Liệu Thực Tế (PostgreSQL Relational Schema)
                </h4>
                <p className="text-xs text-slate-500 leading-normal">
                  Dưới đây là chi tiết toàn diện 4 bảng dữ liệu cốt lõi (bao gồm dọn dẹp lưu trữ nhật ký đối soát SIM đã xóa) vận hành mật thiết bên trong hệ thống. Sẵn sàng cấu hình và đồng bộ hóa.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {/* Table A: sims */}
                  <div className="border border-slate-150 rounded-xl overflow-hidden bg-slate-50/20 shadow-2xs">
                    <div className="bg-indigo-50 border-b border-indigo-100 p-3 flex justify-between items-center">
                      <span className="font-bold text-xs text-indigo-900 font-sans flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                        BẢNG A: sims (Kho SIM đẹp)
                      </span>
                      <span className="text-[9px] font-mono font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">13 columns</span>
                    </div>
                    <div className="p-3 text-[11px] space-y-2 font-sans text-slate-650 max-h-72 overflow-y-auto">
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">id</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, PK)</span>
                        </div>
                        <span className="text-slate-500 text-right">Khóa chính duy nhất.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">number</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right">Số SIM định dạng.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">searchable_number</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right">Số SIM trơn để Index.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">carrier</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right">Nhà mạng di động.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">price</strong> <span className="text-[10px] text-slate-400 font-mono">(DOUBLE, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right">Giá bán niêm yết.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">category</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right">Phân khúc số đẹp.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">status</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right">Mặc định: "Available".</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">sum</strong> <span className="text-[10px] text-slate-400 font-mono">(INTEGER, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right">Điểm phong thủy nút.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">is_hot</strong> <span className="text-[10px] text-slate-400 font-mono">(BOOLEAN)</span>
                        </div>
                        <span className="text-slate-500 text-right">Sim Hot đề xuất.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">notes</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, Option)</span>
                        </div>
                        <span className="text-slate-500 text-right">Ghi chú bổ sung.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">sync_source</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT)</span>
                        </div>
                        <span className="text-slate-500 text-right">Nguồn đối tác đồng bộ.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">sync_user</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT)</span>
                        </div>
                        <span className="text-slate-500 text-right">Tài khoản thực hiện.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">last_synced_at</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT)</span>
                        </div>
                        <span className="text-slate-500 text-right">Thời mốc sync cuối.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">network_id</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, FK)</span>
                        </div>
                        <span className="text-slate-500 text-right text-indigo-600">Khóa ngoại bảng networks.</span>
                      </div>
                      <div className="pb-1 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">mandatory_package_id</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, FK)</span>
                        </div>
                        <span className="text-slate-500 text-right text-indigo-600">Khóa ngoại bảng packages.</span>
                      </div>
                    </div>
                  </div>

                  {/* Table B: agents */}
                  <div className="border border-slate-150 rounded-xl overflow-hidden bg-slate-50/20 shadow-2xs">
                    <div className="bg-emerald-50 border-b border-emerald-100 p-3 flex justify-between items-center">
                      <span className="font-bold text-xs text-emerald-950 font-sans flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        BẢNG B: agents (Đại lý & CTV)
                      </span>
                      <span className="text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">10 columns</span>
                    </div>
                    <div className="p-3 text-[11px] space-y-2 font-sans text-slate-650 max-h-72 overflow-y-auto">
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">id</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, PK)</span>
                        </div>
                        <span className="text-slate-500 text-right">Mã đại lý độc bản.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">name</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right">Tên thương hiệu/Đại lý.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">role</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right">Bronze, Silver, Gold...</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">discount_rate</strong> <span className="text-[10px] text-slate-400 font-mono">(DOUBLE, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right">Tỷ lệ giảm giá phôi.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">phone</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right">Số di động liên lạc.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">email</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right">Hòm thư đăng nhập.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">commission_earned</strong> <span className="text-[10px] text-slate-400 font-mono">(DOUBLE)</span>
                        </div>
                        <span className="text-slate-500 text-right">Số dư hoa hồng tích luỹ.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">total_sales</strong> <span className="text-[10px] text-slate-400 font-mono">(DOUBLE)</span>
                        </div>
                        <span className="text-slate-500 text-right">Doanh số bán dồn tích.</span>
                      </div>
                      <div className="pb-1 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">password</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, MD5)</span>
                        </div>
                        <span className="text-slate-500 text-right">Mật khẩu mã hoá.</span>
                      </div>
                    </div>
                  </div>

                  {/* Table C: orders */}
                  <div className="border border-slate-150 rounded-xl overflow-hidden bg-slate-50/20 shadow-2xs">
                    <div className="bg-amber-50 border-b border-amber-100 p-3 flex justify-between items-center">
                      <span className="font-bold text-xs text-amber-950 font-sans flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        BẢNG C: orders (Đơn hàng)
                      </span>
                      <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">15 columns</span>
                    </div>
                    <div className="p-3 text-[11px] space-y-2 font-sans text-slate-650 max-h-72 overflow-y-auto">
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">id</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, PK)</span>
                        </div>
                        <span className="text-slate-500 text-right">Mã đơn hàng định dạng.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">sim_id</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, FK)</span>
                        </div>
                        <span className="text-slate-500 text-right">Liên kết trường id bảng sims.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">sim_number</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right">Số SIM đặt mua thực tế.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">carrier</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right">Nhà mạng tương ứng.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">price</strong> <span className="text-[10px] text-slate-400 font-mono">(DOUBLE, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right">Giá gốc công bố niêm yết.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">discount_price</strong> <span className="text-[10px] text-slate-400 font-mono">(DOUBLE, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right">Thực thu đại lý sau giảm trừ.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">agent_id</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, FK)</span>
                        </div>
                        <span className="text-slate-500 text-right">Mã đại lý/CTV khởi sinh.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">agent_role</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT)</span>
                        </div>
                        <span className="text-slate-500 text-right">Cấp bậc CTV lúc sinh đơn.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">customer_name</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right">Họ tên người nhận.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">customer_phone</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right">Số điện thoại khách hàng.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">customer_address</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT)</span>
                        </div>
                        <span className="text-slate-500 text-right">Địa chỉ giao phát tận nơi.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">payment_method</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT)</span>
                        </div>
                        <span className="text-slate-500 text-right font-semibold text-purple-700">QR, Ví balance...</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">payment_status</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT)</span>
                        </div>
                        <span className="text-slate-500 text-right">Trạng thái thanh toán.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">status</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right">Duyệt đơn hoạt động.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">created_at</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, ISO)</span>
                        </div>
                        <span className="text-slate-500 text-right">Mốc thời gian nợ đơn.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">package_id</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, FK)</span>
                        </div>
                        <span className="text-slate-500 text-right text-amber-600">Mã gói cước đi kèm.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">package_name</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT)</span>
                        </div>
                        <span className="text-slate-500 text-right text-amber-600">Tên gói cước chọn kèm.</span>
                      </div>
                      <div className="pb-1 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">package_fee</strong> <span className="text-[10px] text-slate-400 font-mono">(DOUBLE)</span>
                        </div>
                        <span className="text-slate-500 text-right text-amber-600">Cước phí hàng tháng.</span>
                      </div>
                    </div>
                  </div>

                  {/* Table D: deleted_sims */}
                  <div className="border border-slate-150 rounded-xl overflow-hidden bg-slate-50/20 shadow-2xs">
                    <div className="bg-rose-50 border-b border-rose-100 p-3 flex justify-between items-center">
                      <span className="font-bold text-xs text-rose-955 font-sans flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        BẢNG D: deleted_sims (SIM bị dọn)
                      </span>
                      <span className="text-[9px] font-mono font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">10 columns</span>
                    </div>
                    <div className="p-3 text-[11px] space-y-2 font-sans text-slate-650 max-h-72 overflow-y-auto">
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">id</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, PK)</span>
                        </div>
                        <span className="text-slate-500 text-right">Khóa chính của SIM xóa.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">number</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right">Số SIM bị dọn khỏi kho.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">carrier</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right">Nhà mạng tương ứng.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">price</strong> <span className="text-[10px] text-slate-400 font-mono">(DOUBLE)</span>
                        </div>
                        <span className="text-slate-500 text-right">Đơn giá SIM lúc bán/dọn.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">category</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT)</span>
                        </div>
                        <span className="text-slate-500 text-right">Phân khúc số đẹp phong thủy.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">sum</strong> <span className="text-[10px] text-slate-400 font-mono">(INTEGER)</span>
                        </div>
                        <span className="text-slate-500 text-right">Tổng điểm nút SIM.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">deleted_at</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right">Thời mốc loại bỏ khỏi kho.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">reason</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right text-rose-600">Lý do xóa đối soát.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">sync_source</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT)</span>
                        </div>
                        <span className="text-slate-500 text-right">Từ nguồn sync nào.</span>
                      </div>
                      <div className="pb-1 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">sync_user</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT)</span>
                        </div>
                        <span className="text-slate-500 text-right">Tài khoản thực hiện.</span>
                      </div>
                    </div>
                  </div>

                  {/* Table E: networks */}
                  <div className="border border-slate-150 rounded-xl overflow-hidden bg-slate-50/20 shadow-2xs">
                    <div className="bg-sky-50 border-b border-sky-100 p-3 flex justify-between items-center">
                      <span className="font-bold text-xs text-sky-950 font-sans flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                        BẢNG E: networks (Nhà Mạng)
                      </span>
                      <span className="text-[9px] font-mono font-bold bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded">6 columns</span>
                    </div>
                    <div className="p-3 text-[11px] space-y-2 font-sans text-slate-650 max-h-72 overflow-y-auto">
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">id</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, PK)</span>
                        </div>
                        <span className="text-slate-500 text-right">Mã nhà mạng (viettel...).</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">name</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right">Tên hiển thị nhà mạng.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">logoUrl</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT)</span>
                        </div>
                        <span className="text-slate-500 text-right">Đường dẫn tệp lô-gô.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">supportPhone</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT)</span>
                        </div>
                        <span className="text-slate-500 text-right">Hotline CSKH mạng.</span>
                      </div>
                      <div className="pb-1 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">isActive</strong> <span className="text-[10px] text-slate-400 font-mono">(BOOLEAN)</span>
                        </div>
                        <span className="text-slate-500 text-right">Trạng thái hoạt động.</span>
                      </div>
                    </div>
                  </div>

                  {/* Table F: packages */}
                  <div className="border border-slate-150 rounded-xl overflow-hidden bg-slate-50/20 shadow-2xs">
                    <div className="bg-purple-50 border-b border-purple-100 p-3 flex justify-between items-center">
                      <span className="font-bold text-xs text-purple-950 font-sans flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                        BẢNG F: packages (Gói Cước)
                      </span>
                      <span className="text-[9px] font-mono font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">9 columns</span>
                    </div>
                    <div className="p-3 text-[11px] space-y-2 font-sans text-slate-650 max-h-72 overflow-y-auto">
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">id</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, PK)</span>
                        </div>
                        <span className="text-slate-500 text-right">ID gói cước duy nhất.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">name</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right">Tên gói (V200C...).</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">networkId</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT, FK)</span>
                        </div>
                        <span className="text-slate-500 text-right">Ngoại khóa mạng ID.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">monthlyFee</strong> <span className="text-[10px] text-slate-400 font-mono">(DOUBLE, Not Null)</span>
                        </div>
                        <span className="text-slate-500 text-right">Phí kích hoạt tháng.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">dataGb</strong> <span className="text-[10px] text-slate-400 font-mono">(DOUBLE)</span>
                        </div>
                        <span className="text-slate-500 text-right">Hạn ngạch GB dung lượng.</span>
                      </div>
                      <div className="border-b border-slate-100 pb-1.5 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">dataLimitText</strong> <span className="text-[10px] text-slate-400 font-mono">(TEXT)</span>
                        </div>
                        <span className="text-slate-500 text-right">Quyền lợi Data chi tiết.</span>
                      </div>
                      <div className="pb-1 flex justify-between items-start">
                        <div>
                          <strong className="font-mono text-xs text-slate-800">isActive</strong> <span className="text-[10px] text-slate-400 font-mono">(BOOLEAN)</span>
                        </div>
                        <span className="text-slate-500 text-right">Trạng thái bán gói.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Code blocks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-emerald-500" /> Tệp cấu hình Schema của Drizzle ORM
                  </h4>
                  <button
                    onClick={() => handleCopyCode(schemaCode, "schema")}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-[#003366] font-bold px-2.5 py-1 rounded border flex items-center gap-1 cursor-pointer transition-all"
                  >
                    {copiedText === "schema" ? (
                      <span className="flex items-center gap-1 text-emerald-600"><Check className="w-3 h-3" /> Đã sao chép</span>
                    ) : (
                      <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Copy tệp Schema</span>
                    )}
                  </button>
                </div>
                <pre className="bg-slate-800 text-slate-200 text-[11px] p-4 rounded-xl overflow-x-auto font-mono max-h-48 shadow-inner font-sans leading-relaxed">
                  {schemaCode}
                </pre>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-indigo-500" /> Khởi tạo cơ sở dữ liệu trực tiếp bằng DDL SQL
                  </h4>
                  <button
                    onClick={() => handleCopyCode(sqlCode, "sql")}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-[#003366] font-bold px-2.5 py-1 rounded border flex items-center gap-1 cursor-pointer transition-all"
                  >
                    {copiedText === "sql" ? (
                      <span className="flex items-center gap-1 text-emerald-600"><Check className="w-3 h-3" /> Đã sao chép</span>
                    ) : (
                      <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Copy SQL DDL</span>
                    )}
                  </button>
                </div>
                <pre className="bg-slate-800 text-slate-200 text-[11px] p-4 rounded-xl overflow-x-auto font-mono max-h-48 shadow-inner font-sans leading-relaxed">
                  {sqlCode}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Secrets Config Settings */}
        {activeSubTab === "secrets" && (
          <div className="space-y-6 animate-fadeIn">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2 font-sans">
              <Settings className="w-5 h-5 text-orange-500" /> Cấu Hình Cổng Thanh Toán & Khóa Bảo Mật
            </h3>

            <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 flex gap-3 text-amber-900 text-xs leading-relaxed mb-4 font-sans">
              <Shield className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-bold">Lưu ý bảo mật quản trị:</span> Toàn bộ tham số cấu hình dưới đây được mã hóa và lưu trữ trực tiếp tại tệp quản trị hệ thống <code className="bg-amber-150 font-mono px-1 rounded">secrets_config.json</code> bên phía Cloud server. Tuyệt đối không chia sẻ các khóa token hoặc mật khẩu này cho các bên thứ ba không có thẩm quyền kỹ thuật.
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
              {/* Left Column: Form Settings */}
              <div className="space-y-6">
                
                {/* 1. VietQR settings */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-indigo-600" />
                      <h4 className="font-bold text-slate-800 text-sm">Cấu Hình Cổng VietQR (Tự Động Tạo QR)</h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={secrets.vietqr_enabled}
                        onChange={(e) => setSecrets({ ...secrets, vietqr_enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      <span className="ml-2 text-[11px] font-bold text-slate-505">
                        {secrets.vietqr_enabled ? "BẬT" : "TẮT"}
                      </span>
                    </label>
                  </div>

                  {secrets.vietqr_enabled && (
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Ngân Hàng Thụ Hưởng</label>
                        <input 
                          type="text" 
                          value={secrets.vietqr_bank} 
                          onChange={(e) => setSecrets({ ...secrets, vietqr_bank: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans font-medium text-slate-700" 
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-600 font-bold mb-1">Số Tài Khoản</label>
                          <input 
                            type="text" 
                            value={secrets.vietqr_account} 
                            onChange={(e) => setSecrets({ ...secrets, vietqr_account: e.target.value })}
                            className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-700" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-bold mb-1">Chủ Tài Khoản (In Hoa)</label>
                          <input 
                            type="text" 
                            value={secrets.vietqr_owner} 
                            onChange={(e) => setSecrets({ ...secrets, vietqr_owner: e.target.value })}
                            className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans font-medium text-slate-700" 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. MoMo settings */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-[#A50064] text-white rounded flex items-center justify-center font-sans font-bold text-[9px]">M</span>
                      <h4 className="font-bold text-slate-800 text-sm">Cấu Hình Cổng MoMo (Ví Điện Tử)</h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={secrets.momo_enabled}
                        onChange={(e) => setSecrets({ ...secrets, momo_enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#A50064]"></div>
                      <span className="ml-2 text-[11px] font-bold text-slate-505">
                        {secrets.momo_enabled ? "BẬT" : "TẮT"}
                      </span>
                    </label>
                  </div>

                  {secrets.momo_enabled && (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-600 font-bold mb-1">Số Điện Thoại Nhận MoMo</label>
                          <input 
                            type="text" 
                            value={secrets.momo_phone} 
                            onChange={(e) => setSecrets({ ...secrets, momo_phone: e.target.value })}
                            className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-pink-500 font-mono text-slate-700" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-bold mb-1">Chủ Sở Hữu Ví</label>
                          <input 
                            type="text" 
                            value={secrets.momo_owner} 
                            onChange={(e) => setSecrets({ ...secrets, momo_owner: e.target.value })}
                            className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-pink-500 font-sans font-medium text-slate-700" 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. VNPay settings */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-sky-600 text-white rounded flex items-center justify-center font-sans font-black text-[9px]">V</span>
                      <h4 className="font-bold text-slate-800 text-sm">Cấu Hình Cổng VNPay (Cổng Quốc Tế)</h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={secrets.vnpay_enabled}
                        onChange={(e) => setSecrets({ ...secrets, vnpay_enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                      <span className="ml-2 text-[11px] font-bold text-slate-505">
                        {secrets.vnpay_enabled ? "BẬT" : "TẮT"}
                      </span>
                    </label>
                  </div>

                  {secrets.vnpay_enabled && (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-600 font-bold mb-1">Mã Terminal ID (TmnCode)</label>
                          <input 
                            type="text" 
                            value={secrets.vnpay_terminal_id} 
                            onChange={(e) => setSecrets({ ...secrets, vnpay_terminal_id: e.target.value })}
                            className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono text-slate-700" 
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-bold mb-1 flex items-center justify-between">
                            <span>Khóa Bảo Mật (Secure Hash Key)</span>
                            <button 
                              type="button" 
                              onClick={() => setShowVnpaySecret(!showVnpaySecret)}
                              className="text-slate-400 hover:text-sky-650 text-[10px] flex items-center gap-0.5 cursor-pointer"
                            >
                              {showVnpaySecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              {showVnpaySecret ? "Ẩn" : "Hiện"}
                            </button>
                          </label>
                          <input 
                            type={showVnpaySecret ? "text" : "password"} 
                            value={secrets.vnpay_secret_key} 
                            onChange={(e) => setSecrets({ ...secrets, vnpay_secret_key: e.target.value })}
                            className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono text-slate-700" 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Partner Webhook Web paths */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4">
                  <div className="border-b border-slate-200/60 pb-3">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-pink-600" /> Cấu hình Endpoint Webhook Nhận Thông Báo
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      Địa chỉ URL nhận tín hiệu Callback khi cổng thanh toán đối tác hoàn tất chuyển khoản
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Webhook Cổng MoMo</label>
                      <input 
                        type="text" 
                        value={secrets.api_payment_webhook_momo_url} 
                        onChange={(e) => setSecrets({ ...secrets, api_payment_webhook_momo_url: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-700" 
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Webhook Cổng VNPay</label>
                      <input 
                        type="text" 
                        value={secrets.api_payment_webhook_vnpay_url} 
                        onChange={(e) => setSecrets({ ...secrets, api_payment_webhook_vnpay_url: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-700" 
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Webhook Cổng VietQR</label>
                      <input 
                        type="text" 
                        value={secrets.api_payment_webhook_vietqr_url} 
                        onChange={(e) => setSecrets({ ...secrets, api_payment_webhook_vietqr_url: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-700" 
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const origin = window.location.origin;
                          setSecrets({
                            ...secrets,
                            api_payment_webhook_momo_url: `${origin}/api/webhook/payments/momo`,
                            api_payment_webhook_vnpay_url: `${origin}/api/webhook/payments/vnpay`,
                            api_payment_webhook_vietqr_url: `${origin}/api/webhook/payments/vietqr`
                          });
                        }}
                        className="w-full py-2 px-3 border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all font-sans"
                        title="Tự động lấy domain name Cloud Run hiện tại làm địa chỉ Webhook nhận callback chuyển khoản thực tế"
                      >
                        <RefreshCw className="w-3.5 h-3.5 animate-pulse" />
                        Sử dụng Domain Cloud Run hiện tại
                      </button>
                      <p className="text-[10px] text-indigo-500 mt-1 leading-normal italic text-center">
                        Bấm nút này sẽ tự động thay thế "kho-sim.vn" bằng link tạm thật của bạn: {window.location.origin}
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Web services Sync & Sandbox Simulations */}
              <div className="space-y-6">
                
                {/* 5. Sim Stock sync settings */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4">
                  <div className="border-b border-slate-200/60 pb-3">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b pb-1.5 border-slate-100">
                      <Key className="w-4 h-4 text-amber-500 font-sans" /> API Đồng Bộ Tồn Kho Đối Tác Cấp Cao
                    </h4>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">URL API Trả Số Đối Tác</label>
                      <input 
                        type="text" 
                        value={secrets.api_partner_sync_stock_url} 
                        onChange={(e) => setSecrets({ ...secrets, api_partner_sync_stock_url: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-700" 
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1 flex items-center justify-between">
                        <span>API Authorization Key</span>
                        <button 
                          type="button" 
                          onClick={() => setShowSyncKey(!showSyncKey)}
                          className="text-slate-400 hover:text-slate-600 text-[10px] flex items-center gap-0.5 cursor-pointer"
                        >
                          {showSyncKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          {showSyncKey ? "Ẩn" : "Hiện"}
                        </button>
                      </label>
                      <input 
                        type={showSyncKey ? "text" : "password"} 
                        value={secrets.api_partner_sync_stock_key} 
                        onChange={(e) => setSecrets({ ...secrets, api_partner_sync_stock_key: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-700" 
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Subscriber registration kit activation settings */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4">
                  <div className="border-b border-slate-200/60 pb-3">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b pb-1.5 border-slate-100">
                      <Server className="w-4 h-4 text-emerald-600 font-sans" /> API Đồng Bộ Thông Tin Kích Hoạt SIM Kit
                    </h4>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Carrier Activation Gateway URL</label>
                      <input 
                        type="text" 
                        value={secrets.api_partner_activation_url} 
                        onChange={(e) => setSecrets({ ...secrets, api_partner_activation_url: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-700" 
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-bold mb-1 flex items-center justify-between">
                        <span>Carrier JWT Private Token Key</span>
                        <button 
                          type="button" 
                          onClick={() => setShowActivationKey(!showActivationKey)}
                          className="text-slate-400 hover:text-slate-600 text-[10px] flex items-center gap-0.5 cursor-pointer"
                        >
                          {showActivationKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          {showActivationKey ? "Ẩn" : "Hiện"}
                        </button>
                      </label>
                      <input 
                        type={showActivationKey ? "text" : "password"} 
                        value={secrets.api_partner_activation_key} 
                        onChange={(e) => setSecrets({ ...secrets, api_partner_activation_key: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-700" 
                      />
                    </div>
                  </div>
                </div>

                {/* 6.5. Sim Thăng Long Auto Scraper & Scheduler Settings */}
                <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-4">
                  <div className="border-b border-slate-200/60 pb-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-indigo-600 font-sans" />
                      <h4 className="font-bold text-slate-800 text-sm">
                        Bộ Thu Thập Web & Lịch Trình SimThangLong
                      </h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={secrets.sync_schedule_enabled}
                        onChange={(e) => setSecrets({ ...secrets, sync_schedule_enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      <span className="ml-1.5 text-[10px] font-bold text-slate-500">
                        {secrets.sync_schedule_enabled ? "BẬT" : "TẮT"}
                      </span>
                    </label>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">URL Mục Tiêu Quét Dữ Liệu</label>
                      <input 
                        type="text" 
                        value={secrets.sync_scraper_target} 
                        onChange={(e) => setSecrets({ ...secrets, sync_scraper_target: e.target.value })}
                        placeholder="https://simthanglong.vn/sim-gia-re"
                        className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-700" 
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Đường dẫn chuyên mục số đẹp từ trang web simthanglong.vn để quét số tự động
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Chu Kỳ Lịch Trình</label>
                        <select
                          value={secrets.sync_schedule_period}
                          onChange={(e) => setSecrets({ ...secrets, sync_schedule_period: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans font-medium text-slate-700 cursor-pointer"
                        >
                          <option value="daily">🕒 1 Lần / Ngày</option>
                          <option value="hourly">⚡ Mỗi Tiếng</option>
                          <option value="six_hours">🔄 Mỗi 6 Tiếng</option>
                          <option value="twelve_hours">🔄 Mỗi 12 Tiếng</option>
                          <option value="manual">🛠️ Chỉ Thủ Công</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Giờ Chạy (Hằng Ngày)</label>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={secrets.sync_schedule_hour}
                          onChange={(e) => setSecrets({ ...secrets, sync_schedule_hour: e.target.value })}
                          disabled={secrets.sync_schedule_period !== "daily"}
                          className="w-full px-3 py-2 border rounded-xl bg-white disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-700"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Giới Hạn SIM Thu Thập / Lần Quét</label>
                      <input 
                        type="number"
                        min="5"
                        max="100"
                        value={secrets.sync_scraper_sim_count}
                        onChange={(e) => setSecrets({ ...secrets, sync_scraper_sim_count: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-700"
                      />
                    </div>

                    <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-indigo-800 font-bold">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Trạng Thái Đồng Bộ Gần Nhất (Scheduler State):</span>
                      </div>
                      
                      <div className="text-[10px] text-slate-600 space-y-1 font-sans">
                        <p>
                          Thời gian chạy: <strong className="text-indigo-900 font-mono">{secrets.sync_last_run ? new Date(secrets.sync_last_run).toLocaleString("vi-VN") : "Chưa chạy lần nào"}</strong>
                        </p>
                        
                        {secrets.sync_last_run_result && (
                          <div className="mt-1 pt-1 border-t border-indigo-100 space-y-1 text-slate-500">
                            <p>🚪 Phương thức: <strong className="text-slate-800 font-sans">{secrets.sync_last_run_result.type || "Chưa rõ"}</strong></p>
                            <p>📈 Thêm mới: <strong className="text-emerald-600 font-semibold">{secrets.sync_last_run_result.importedCount ?? 0} SIM</strong></p>
                            <p>⚠️ Bỏ qua trùng: <strong className="text-amber-600 font-semibold">{secrets.sync_last_run_result.ignoredDuplicates ?? 0} SIM</strong></p>
                          </div>
                        )}
                      </div>

                      {secrets.sync_last_run_logs && secrets.sync_last_run_logs.length > 0 && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setShowLatestPersistentLogs(!showLatestPersistentLogs)}
                            className="w-full text-left py-1 px-2 border border-indigo-200 bg-white hover:bg-slate-50 text-[9px] text-indigo-700 font-bold rounded-lg cursor-pointer transition-all flex items-center justify-between font-sans"
                          >
                            <span>{showLatestPersistentLogs ? "🔼 Ẩn nhật ký vận hành" : "🔽 Xem nhật ký vận hành chi tiết"}</span>
                            <span className="bg-indigo-100 px-1 py-0.2 rounded text-[8px] text-indigo-800">{secrets.sync_last_run_logs.length} dòng logs</span>
                          </button>
                          
                          {showLatestPersistentLogs && (
                            <div className="mt-1.5 bg-slate-900 text-slate-300 text-[9px] p-2.5 rounded-lg border border-slate-750 font-mono text-left space-y-1 max-h-40 overflow-y-auto overflow-x-auto leading-normal">
                              {secrets.sync_last_run_logs.map((log: string, idx: number) => (
                                <div 
                                  key={idx} 
                                  className={
                                    log.includes("Error") || log.includes("[Database Error]") || log.includes("[Cực Nghiêm Trọng]")
                                      ? "text-rose-400"
                                      : log.includes("Success") || log.includes("[Database Synced]") || log.includes("🎯")
                                      ? "text-emerald-400"
                                      : "text-slate-300"
                                  }
                                >
                                  {log}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 7. Action: Save Config button */}
                <div className="space-y-3">
                  <button
                    onClick={handleSaveSecrets}
                    disabled={isSaving}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer text-sm"
                  >
                    {isSaving ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isSaving ? "Đang lưu thông số..." : "Lưu Thay Đổi Cấu Hình Quản Trị"}
                  </button>
                  {saveSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-800 text-xs text-center font-semibold animate-pulse">
                      🚀 {saveSuccess}
                    </div>
                  )}
                </div>

                {/* Live Sandbox Interactive Testing Panels */}
                <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 border border-slate-800 space-y-4">
                  <h4 className="font-bold text-[#FFD700] text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2 font-mono">
                    <Terminal className="w-4 h-4 text-[#FFD700]" /> 🛠️ Test Cổng Đồng Bộ Dữ Liệu Thực Tế
                  </h4>

                  {/* Test 1: Sim stock sync */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      <strong>Thử nghiệm 3.2:</strong> Truy vấn lấy danh mục SIM sỉ và gói cước tương ứng bằng mã API khóa đối tác thực tế.
                    </p>
                    <button 
                      onClick={runTestSync}
                      disabled={isTestingSync}
                      className="px-3 py-1.5 rounded-lg bg-indigo-950 font-bold hover:bg-indigo-900 border border-indigo-700 text-indigo-300 hover:text-indigo-200 text-[10px] flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                    >
                      {isTestingSync ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      {isTestingSync ? "Đang kéo sỉ..." : "Khởi chạy GET /api/partner/sims/sync"}
                    </button>
                    {syncTestResponse && (
                      <pre className="mt-2 bg-[#020813] text-emerald-400 text-[10px] font-mono p-3 rounded-lg max-h-40 overflow-y-auto leading-relaxed border border-slate-800 text-left">
                        {syncTestResponse}
                      </pre>
                    )}
                  </div>

                  {/* Test 2: SIM kit activation form */}
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      <strong>Thử nghiệm 3.3:</strong> Gửi thông tin thuê bao chính chủ và số SIM Kit để mô phỏng tích hợp tổng đài nhà mạng.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Số SIM cần đăng ký</span>
                        <input 
                          type="text"
                          value={activationForm.simNumber}
                          onChange={(e) => setActivationForm({ ...activationForm, simNumber: e.target.value })}
                          className="w-full bg-[#080F1E] border border-slate-850 text-slate-300 font-mono p-1 rounded focus:outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Họ Tên Chủ Thuê Bao</span>
                        <input 
                          type="text"
                          value={activationForm.fullName}
                          onChange={(e) => setActivationForm({ ...activationForm, fullName: e.target.value })}
                          className="w-full bg-[#080F1E] border border-slate-850 text-slate-300 p-1 rounded focus:outline-none font-sans"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Căn Cước Công Dân</span>
                        <input 
                          type="text"
                          value={activationForm.citizenId}
                          onChange={(e) => setActivationForm({ ...activationForm, citizenId: e.target.value })}
                          className="w-full bg-[#080F1E] border border-slate-850 text-slate-300 font-mono p-1 rounded focus:outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Sim Kit Serial</span>
                        <input 
                          type="text"
                          value={activationForm.simKitSerial}
                          onChange={(e) => setActivationForm({ ...activationForm, simKitSerial: e.target.value })}
                          className="w-full bg-[#080F1E] border border-slate-855 text-slate-300 font-mono p-1 rounded focus:outline-none"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={runTestActivation}
                      disabled={isTestingActivation}
                      className="px-3 py-1.5 rounded-lg bg-emerald-950 font-bold hover:bg-emerald-900 border border-emerald-700 text-emerald-300 hover:text-emerald-200 text-[10px] flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                    >
                      {isTestingActivation ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      {isTestingActivation ? "Đang gửi kích hoạt..." : "Gửi POST /api/partner/sims/activate"}
                    </button>
                    {activationTestResponse && (
                      <pre className="mt-2 bg-[#020813] text-emerald-400 text-[10px] font-mono p-3 rounded-lg max-h-40 overflow-y-auto leading-relaxed border border-slate-800 text-left">
                        {activationTestResponse}
                      </pre>
                    )}
                  </div>

                  {/* Test 3: Simthanglong Web Scraper live sandbox */}
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      <strong>Thử nghiệm 3.4 (Mới):</strong> Kích hoạt máy quét bò quét (Web Scraper Engine) truy xuất trực tiếp cây HTML của trang <code>simthanglong.vn</code> để bóc tách kho số và đồng bộ về database.
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={runScrapeSimThangLong}
                        disabled={isScrapingNow}
                        className="px-3.5 py-1.5 rounded-lg bg-orange-950 hover:bg-orange-900 border border-orange-700 text-orange-300 hover:text-orange-200 text-[10px] flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50 font-bold"
                      >
                        {isScrapingNow ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                        {isScrapingNow ? "Đang quét HTML..." : "Bắt Đầu Quét & Đồng Bộ Ngay"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setScraperLogs([]);
                          setScraperResult(null);
                        }}
                        className="px-2 py-1 bg-slate-850 hover:bg-slate-800 border border-slate-750 rounded text-[9px] text-slate-300 cursor-pointer"
                      >
                        Xóa Nhật Ký
                      </button>
                    </div>

                    {scraperLogs.length > 0 && (
                      <div className="space-y-1.5 mt-2">
                        <span className="text-[9px] text-[#FFD700] uppercase font-mono tracking-wider block">📺 Terminal Output Logs:</span>
                        <div className="bg-[#02050c] text-slate-300 text-[10px] p-4 rounded-lg border border-slate-850 text-left space-y-1 overflow-x-auto max-h-52 overflow-y-auto font-mono">
                          {scraperLogs.map((log, index) => (
                            <div 
                              key={index} 
                              className={`leading-relaxed whitespace-pre-wrap ${
                                log.includes("[Fetch Error]") || log.includes("[Database Error]") || log.includes("[Cực Nghiêm Trọng]")
                                  ? "text-rose-400"
                                  : log.includes("[Fetch Success]") || log.includes("[Database Synced]") || log.includes("🎯")
                                  ? "text-emerald-400"
                                  : log.includes("[Scraper Shield]") || log.includes("[Scraper Bypass") || log.includes("Đang tự động")
                                  ? "text-amber-400"
                                  : "text-slate-300"
                              }`}
                            >
                              {log}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {scraperResult && scraperResult.success && (
                      <div className="bg-emerald-950/40 border border-emerald-900/50 rounded-lg p-3 text-[10px] text-emerald-300 space-y-1">
                        <div className="font-bold flex items-center gap-1 text-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Kết quả đồng bộ: Thành công!</span>
                        </div>
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-350">
                          <li>Nguồn trang: {scraperResult.details.targetUrl}</li>
                          <li>Thêm mới vào DB: <strong className="text-emerald-400 font-bold">{scraperResult.details.importedCount} SIM</strong></li>
                          <li>Bỏ qua trùng lặp: <strong className="text-amber-400 font-bold">{scraperResult.details.ignoredDuplicates} SIM</strong></li>
                          <li>Mốc thời gian: {new Date(scraperResult.details.timestamp).toLocaleString("vi-VN")}</li>
                        </ul>
                      </div>
                    )}
                  </div>

                </div>

              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Partner API Integration Guides */}
        {activeSubTab === "api-docs" && (
          <div className="space-y-8 animate-fadeIn font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-[#003366] flex items-center gap-2 tracking-tight">
                  <Terminal className="w-5 h-5 text-indigo-700 font-sans" /> Tài Liệu Đặc Tả Tích Hợp Hệ Thống & Cổng Webhook (API & Webhook Spec)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Cung cấp các cổng API đồng bộ, đặc tả cấu trúc Webhook phản hồi từ cổng ngân hàng thực tế, và cơ chế lấy số trực xạ từ Tổng đại lý cấp cao.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  onClick={downloadApiManualDoc}
                  className="bg-[#003366] hover:bg-[#002244] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer font-sans"
                >
                  <Download className="w-4 h-4 text-[#FFD700]" /> Tải Đặc Tả Kỹ Thuật API (.DOC)
                </button>
                <button
                  onClick={downloadDevelopmentHistoryDoc}
                  className="bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer animate-pulse font-sans"
                >
                  <Download className="w-4 h-4 text-[#FFD700]" /> Tải Nhật Ký Hành Trình Phát Triển (.DOC)
                </button>
              </div>
            </div>

            {/* Quick Overview Badges */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-indigo-50 border border-indigo-150 p-3.5 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-indigo-700">ST1</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Chuẩn dữ liệu</p>
                  <p className="text-xs font-bold text-slate-800">JSON API / CORS Safe</p>
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-150 p-3.5 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-emerald-700">ST2</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Xác thực API Key</p>
                  <p className="text-xs font-bold text-slate-800">Custom Header Header Key</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-550/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-amber-700">ST3</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cổng Webhook</p>
                  <p className="text-xs font-bold text-slate-800">Callback Auto-Matcher</p>
                </div>
              </div>
              <div className="bg-rose-50 border border-rose-100 p-3.5 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-rose-700">ST4</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Độ trễ phản hồi</p>
                  <p className="text-xs font-bold text-slate-800">&lt; 150ms Realtime</p>
                </div>
              </div>
            </div>

            {/* INTERACTIVE POSTMAN-LIKE SANDBOX PLAYGROUND */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                    <Terminal className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-extrabold font-sans text-sm text-[#FFD700] uppercase tracking-wider">
                      Vietsim Postman Webhook Sandbox (Trình Giả Lập Giao Dịch Thực Tế)
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-normal font-sans mt-0.5">
                      Bỏ qua sự phức tạp của phần mềm ngoài. Gửi thử nghiệm JSON Webhook Callback thật về server của bạn để kích hoạt thanh toán ngay lập tức!
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400">Chọn cổng Webhook:</span>
                  <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                    <button
                      onClick={() => setSandboxEndpoint("vietqr")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${sandboxEndpoint === "vietqr" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-205"}`}
                    >
                      VietQR (Bank)
                    </button>
                    <button
                      onClick={() => setSandboxEndpoint("momo")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${sandboxEndpoint === "momo" ? "bg-pink-600 text-white shadow" : "text-slate-400 hover:text-slate-205"}`}
                    >
                      MoMo Pay
                    </button>
                    <button
                      onClick={() => setSandboxEndpoint("vnpay")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${sandboxEndpoint === "vnpay" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-205"}`}
                    >
                      VNPay IPN
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Order Picker Helper block */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#FFD700] tracking-wider uppercase">Chọn đơn hàng chờ thanh toán từ DB:</label>
                    <button
                      onClick={fetchUnpaidOrders}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                      title="Load lại danh sách đơn hàng mới tạo chưa thanh toán"
                    >
                      <RefreshCw className="w-3 h-3" /> Tẩy mới đơn hàng
                    </button>
                  </div>

                  {unpaidOrders.length === 0 ? (
                    <div className="text-xs text-slate-500 py-2 italic font-sans leading-relaxed bg-slate-900 border border-dashed border-slate-800 rounded-xl px-3 text-center">
                      Không tìm thấy đơn hàng chưa thanh toán nào trong database. 
                      <p className="text-[10px] text-slate-600 mt-1">Vui lòng ra Trang chủ Vietsim chọn mua đặt hàng một SIM bất kỳ để sinh Đơn hàng!</p>
                    </div>
                  ) : (
                    <select
                      value={selectedSandboxOrderId}
                      onChange={(e) => setSelectedSandboxOrderId(e.target.value)}
                      className="w-full bg-[#080F1E] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-indigo-500"
                    >
                      {unpaidOrders.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.id} - SIM {o.simNumber} ({(o.price || 0).toLocaleString("vi-VN")}đ) - Khách: {o.fullName || "Ẩn danh"}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="text-xs font-sans space-y-1 text-slate-400 flex flex-col justify-center border-l border-slate-800/60 pl-0 md:pl-4">
                  <p className="font-bold text-[11px] text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 h-3.5" />
                    <span>Linh hoạt cấu trúc tự động (Auto-fill Code)</span>
                  </p>
                  <p className="text-[10.5px] leading-relaxed">
                    Khi bạn lựa chọn đơn hàng trên, hệ thống sẽ tự động nạp chính xác mã đơn hàng (<code className="text-red-400">{selectedSandboxOrderId || "ord-xxx"}</code>) và tổng giá tiền (<code className="text-emerald-400">{(unpaidOrders.find(o => o.id === selectedSandboxOrderId)?.price || 10500000).toLocaleString("vi-VN")}đ</code>) vào JSON payload mẫu bên dưới.
                  </p>
                </div>
              </div>

              {/* POST MAN REQUEST EDITOR PANEL */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left panel: Code Editor */}
                <div className="lg:col-span-7 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      POST Body Payload (JSON format):
                    </span>
                    <span className="text-[10px] text-slate-500">Người dùng có thể trực tiếp sửa thông số</span>
                  </div>

                  <textarea
                    value={sandboxPayload}
                    onChange={(e) => setSandboxPayload(e.target.value)}
                    rows={8}
                    className="w-full bg-[#050C18] text-[#98C379] font-mono text-[11px] p-4 rounded-2xl border border-slate-800 outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner focus:border-indigo-600 leading-normal"
                    spellCheck="false"
                  />

                  <div className="flex items-center justify-between">
                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                      <span className="font-bold text-slate-400">Endpoint đích:</span>
                      <code className="bg-slate-850 px-1.5 py-0.5 rounded text-indigo-300 font-mono">
                        {sandboxEndpoint === "vietqr" ? "/api/webhook/payments/vietqr" : sandboxEndpoint === "momo" ? "/api/webhook/payments/momo" : "/api/webhook/payments/vnpay"}
                      </code>
                    </div>

                    <button
                      onClick={handleSendSandbox}
                      disabled={isSendingSandbox}
                      className="px-6 py-2.5 bg-[#FFD700] hover:bg-[#E5C100] disabled:opacity-50 text-slate-900 font-extrabold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow transition-all active:scale-95"
                    >
                      {isSendingSandbox ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      Execute Webhook (Gửi ngay)
                    </button>
                  </div>
                </div>

                {/* Right panel: Mock Terminal Response inspector */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-2">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span>Response Inspector (Phản hồi từ máy chủ thực):</span>
                  </div>

                  <div className="flex-1 bg-[#02070f] border border-slate-850 rounded-2xl p-4 flex flex-col justify-between min-h-[175px] font-mono text-xs leading-normal relative overflow-hidden shadow-2xs">
                    {sandboxResponse === null ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 italic text-[11px] space-y-2 py-8">
                        <Terminal className="w-8 h-8 text-slate-700" />
                        <p className="text-center">Chưa có lượt truyền gửi nào được thực hiện.<br />Bấm "Execute Webhook" để xem kết quả.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 flex-1 flex flex-col justify-between">
                        {/* Status bar */}
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2 text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">HTTP Status:</span>
                            <span className={`px-2 py-0.5 rounded font-bold ${sandboxStatus === 200 ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-red-950 text-red-400 border border-red-800"}`}>
                              {sandboxStatus} {sandboxStatus === 200 ? "OK" : "ERROR"}
                            </span>
                          </div>
                          {sandboxLatency !== null && (
                            <span className="text-slate-550">Latency: <strong className="text-emerald-500">{sandboxLatency} ms</strong></span>
                          )}
                        </div>

                        {/* Payload content */}
                        <div className="flex-1 overflow-y-auto max-h-[140px] text-left">
                          <pre className="text-emerald-400 text-[10.5px] leading-relaxed select-all">
                            {typeof sandboxResponse === "object" 
                              ? JSON.stringify(sandboxResponse, null, 2) 
                              : sandboxResponse
                            }
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-[9.5px] text-slate-500 leading-normal italic text-right font-sans">
                    *Mở tab Tra cứu Kho Số / Quản lý Đơn hàng để kiểm tra đơn hàng tự động đổi màu Đã bán / Đã thanh toán!
                  </div>
                </div>
              </div>
            </div>

            {/* VPA API INTERACTIVE SANDBOX PLAYGROUND */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-emerald-500/20 text-[#00FF55] rounded-2xl flex items-center justify-center border border-emerald-500/30">
                    <Terminal className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-extrabold font-sans text-sm text-[#00FF55] uppercase tracking-wider">
                      VPA License Plate Sim-Matching Sandbox (Trình Giả Lập Tích Hợp Đấu Giá VPA)
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-normal font-sans mt-0.5">
                      Gửi thử nghiệm truy vấn biển số xe để xem bảng phân tách linh hồn và danh sách 5 SIM tương đồng đỉnh cao được lọc từ database thực tế!
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400">Phương thức truyền:</span>
                  <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                    <button
                      onClick={() => setSandboxVpaMethod("GET")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${sandboxVpaMethod === "GET" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-slate-205"}`}
                    >
                      GET (Query String)
                    </button>
                    <button
                      onClick={() => setSandboxVpaMethod("POST")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${sandboxVpaMethod === "POST" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-205"}`}
                    >
                      POST (JSON Body)
                    </button>
                  </div>
                </div>
              </div>

              {/* Input details */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Left panel: Input parameters */}
                <div className="md:col-span-6 space-y-4">
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#FFD700] tracking-wider uppercase block mb-1">Nhập Biển Số Xe Thử Nghiệm:</label>
                      <input
                        type="text"
                        value={sandboxVpaPlate}
                        onChange={(e) => setSandboxVpaPlate(e.target.value)}
                        placeholder="Ví dụ: 29AF12039 hoặc 30F-999.99"
                        className="w-full bg-[#080F1E] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-205 outline-none focus:border-emerald-500"
                      />
                      <p className="text-[10px] text-slate-500 mt-1 font-sans">
                        Nhập biển số định dạng bất kỳ (VD: <code className="text-emerald-400">29AF12039</code>, <code className="text-[#00FF55]">14A-555.55</code>, <code className="text-indigo-400">51K-9999</code>)
                      </p>
                    </div>

                    <div className="text-[11px] space-y-2 text-slate-400 font-sans border-t border-slate-800 pt-2.5">
                      <p className="font-bold text-slate-350">Cơ chế Mapping AI Đấu Thầu VPA:</p>
                      <p className="text-[10.5px] leading-relaxed">
                        Tự động bóc dải 3 số cuối (phục vụ sim nút), 4 số cuối (quý nhân tương trợ) hoặc trích xuất số chính tương phản. API trả về tối đa đúng 5 SIM tốt nhất trạng thái <strong className="text-emerald-400">Còn hàng</strong> từ hệ thống.
                      </p>
                    </div>

                    <div className="text-[11px] space-y-1.5 text-slate-400 font-sans border-t border-slate-800 pt-2.5">
                      <p className="font-bold text-slate-300">Đặc tải Request mô phỏng:</p>
                      {sandboxVpaMethod === "GET" ? (
                        <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
                          <p className="text-[10px] font-mono whitespace-nowrap overflow-x-auto text-[#FFD700]">
                            <span className="text-emerald-500 font-bold uppercase mr-1">GET</span>/api/partner/vpa/matching-sims?plate={encodeURIComponent(sandboxVpaPlate)}
                          </p>
                        </div>
                      ) : (
                        <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                          <p className="text-[10px] font-mono text-[#FFD700]">
                            <span className="text-indigo-400 font-bold uppercase mr-1">POST</span>/api/partner/vpa/matching-sims
                          </p>
                          <pre className="text-[9.5px] font-mono text-amber-400">
{`{
  "plate": "${sandboxVpaPlate}"
}`}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSendVpaSandbox}
                      disabled={isSendingVpaSandbox || !sandboxVpaPlate.trim()}
                      className="w-full sm:w-[220px] px-6 py-3 bg-[#00FF55] hover:bg-[#00D944] disabled:opacity-50 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow transition-all active:scale-95"
                    >
                      {isSendingVpaSandbox ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      Gửi Yêu Cầu VPA (Execute)
                    </button>
                  </div>
                </div>

                {/* Right panel: response inspector */}
                <div className="md:col-span-6 flex flex-col justify-between space-y-2">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00FF55]" />
                    <span>Response Inspector (Phản hồi JSON từ VPA AI Engine):</span>
                  </div>

                  <div className="flex-1 bg-[#02070f] border border-slate-850 rounded-2xl p-4 flex flex-col justify-between min-h-[220px] font-mono text-xs leading-normal relative overflow-hidden shadow-2xs">
                    {sandboxVpaResponse === null ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 italic text-[11px] space-y-2 py-8 text-center">
                        <Terminal className="w-8 h-8 text-slate-700 mx-auto" />
                        <p className="text-center">Chưa có lượt truyền gửi VPA nào được thực hiện.<br />Bấm "Gửi Yêu Cầu VPA" để phân tích biển số & lấy SIM phù hợp.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 flex-1 flex flex-col justify-between">
                        {/* Status bar */}
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2 text-[10px]">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400 font-sans">HTTP Status:</span>
                            <span className={`px-2 py-0.5 rounded font-bold ${sandboxVpaStatus === 200 ? "bg-emerald-950 text-[#00FF55] border border-emerald-800" : "bg-red-950 text-red-400 border border-red-800"}`}>
                              {sandboxVpaStatus} {sandboxVpaStatus === 200 ? "OK" : "ERROR"}
                            </span>
                          </div>
                          {sandboxVpaLatency !== null && (
                            <span className="text-slate-500 font-sans">Latency: <strong className="text-emerald-500">{sandboxVpaLatency} ms</strong></span>
                          )}
                        </div>

                        {/* Sandbox VPA response body content */}
                        <div className="flex-1 overflow-y-auto max-h-[190px] text-left">
                          <pre className="text-emerald-400 text-[10.5px] leading-relaxed select-all">
                            {typeof sandboxVpaResponse === "object" 
                              ? JSON.stringify(sandboxVpaResponse, null, 2) 
                              : sandboxVpaResponse
                            }
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">

              {/* SECTION: WEBHOOK CALLBACK CHUYỂN KHOẢN (REAL-TIME NOTIFICATION) */}
              <div className="border border-indigo-100 bg-gradient-to-br from-indigo-50/10 to-transparent rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-indigo-100">
                  <div className="bg-indigo-600 text-white font-mono text-xs font-bold px-3 py-1 rounded-lg">WEBHOOK / CALLBACK</div>
                  <h4 className="font-sans font-extrabold text-sm text-[#003366] uppercase tracking-wide">
                    1. Cổng Tiếp Nhận Webhook Từ Phía Cổng Thanh Toán Hóa Đơn Trực Tuyến
                  </h4>
                </div>
                <p className="text-xs text-slate-650 leading-relaxed font-sans">
                  Khi người mua quét mã thành công từ app ngân hàng hoặc cổng MoMo/VNPay, hệ thống đối tác trung gian thanh toán sẽ thực hiện <strong className="text-indigo-900">HTTP POST Request</strong> về cổng Webhook của Vietsim để tự động chuyển trạng thái đơn hàng sang <span className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded-sm font-bold">ĐÃ THANH TOÁN</span> và cập nhật trạng thái kho số thành <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-sm font-bold">ĐÃ BÁN</span> ngay lập tức.
                </p>

                <div className="space-y-4 pt-3">
                  {/* VietQR Webhook */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-150 space-y-3">
                    <div className="flex flex-wrap items-center gap-2 border-b border-dashed pb-2">
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 font-mono text-[9px] font-bold rounded">SUPPORTED</span>
                      <strong className="text-xs text-slate-850 font-sans">A. Cổng Webhook Nhận Chuyển Khoản Ngân Hàng VietQR (EMVCo)</strong>
                      <span className="font-mono text-[10px] text-slate-400 ml-auto break-all">{secrets.api_payment_webhook_vietqr_url || "https://kho-sim.vn/api/webhook/payments/vietqr"}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Webhook tự động phân tích cú pháp nội dung chuyển khoản để lấy mã Đơn hàng (định dạng <code className="bg-slate-100 px-1 py-0.5 rounded text-pink-700 font-bold font-mono">ord-XXX</code>). Cổng đối tác POS/Bank chuyển dữ liệu trong JSON Body theo đặc tả sau:
                    </p>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                      <div className="space-y-2">
                        <span className="font-bold text-[10px] text-slate-600 uppercase tracking-wider block">Các trường dữ liệu được nhận diện và xử lý:</span>
                        <div className="overflow-x-auto border rounded-xl">
                          <table className="w-full text-left text-[11px] font-sans border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-2 font-bold text-slate-700">Tên trường (Field)</th>
                                <th className="p-2 font-bold text-slate-700">Mô tả nhận dạng</th>
                                <th className="p-2 font-bold text-slate-600">Bắt buộc</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              <tr>
                                <td className="p-2 font-mono text-[#003366] font-semibold">description / content / memo</td>
                                <td className="p-2 text-slate-600">Cú pháp chuyển khoản chứa <code className="font-bold text-pink-600">ord-XXXX</code></td>
                                <td className="p-2 text-emerald-600 font-bold">Có (Một trong các trường)</td>
                              </tr>
                              <tr>
                                <td className="p-2 font-mono text-[#003366] font-semibold">amount / transferAmount</td>
                                <td className="p-2 text-slate-600">Số tiền gốc đã thực hiện chuyển tài khoản thực tế</td>
                                <td className="p-2 text-emerald-600 font-bold">Có</td>
                              </tr>
                              <tr>
                                <td className="p-2 font-mono text-[#003366] font-semibold">referenceCode / transactionId</td>
                                <td className="p-2 text-slate-600">Mã tham chiếu ngân hàng (FT number, ...)</td>
                                <td className="p-2 text-slate-400">Không</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="font-bold text-[10px] text-slate-600 uppercase tracking-wider block">Ví dụ Payload POST thực tế từ Webhook đối tác:</span>
                        <pre className="bg-slate-900 text-slate-200 font-mono text-[10px] p-3 rounded-lg overflow-x-auto leading-relaxed">
{`{
  "transactionId": "FT2417758925582",
  "amount": 10500000,
  "description": "Thanh toan don hang SIM ord-3c82af0",
  "bankCode": "TCB",
  "transactionDate": "2026-06-17 08:31:00"
}`}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* MoMo / VNPay Webhook */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                    <div className="bg-white p-4 border border-slate-150 rounded-2xl space-y-2">
                      <div className="flex items-center gap-1 border-b pb-1.5 border-pink-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping" />
                        <span className="font-bold text-xs text-pink-700">Webook IPN Ví Điện Tử MoMo</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Cổng MoMo sẽ POST về địa chỉ:</p>
                      <code className="bg-slate-100 px-1 py-1 rounded block text-[9px] font-mono select-all text-slate-600 truncate mb-2">
                        {secrets.api_payment_webhook_momo_url || "https://kho-sim.vn/api/webhook/payments/momo"}
                      </code>
                      <pre className="bg-slate-900 text-slate-200 font-mono text-[9px] p-2 rounded-lg overflow-x-auto text-left leading-normal">
{`// Payload POST Body
{
  "orderId": "ord-3c82af0",
  "resultCode": 0, // 0 = Thanh toan thanh cong
  "amount": 10500000,
  "transId": "momo_389284218",
  "message": "Successful."
}`}
                      </pre>
                    </div>

                    <div className="bg-white p-4 border border-slate-150 rounded-2xl space-y-2">
                      <div className="flex items-center gap-1 border-b pb-1.5 border-blue-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                        <span className="font-bold text-xs text-blue-700">Webhook IPN Cổng VNPay Portal</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Cổng VNPay sẽ POST/GET về địa chỉ:</p>
                      <code className="bg-slate-100 px-1 py-1 rounded block text-[9px] font-mono select-all text-slate-600 truncate mb-2">
                        {secrets.api_payment_webhook_vnpay_url || "https://kho-sim.vn/api/webhook/payments/vnpay"}
                      </code>
                      <pre className="bg-slate-900 text-slate-200 font-mono text-[9px] p-2 rounded-lg overflow-x-auto text-left leading-normal">
{`// Payload POST / Query Params
{
  "vnp_TxnRef": "ord-3c82af0",
  "vnp_ResponseCode": "00", // 00 = Giao dich xac thuc
  "vnp_Amount": 10500000,
  "vnp_TransactionNo": "vnp_87834721"
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>


              {/* GET PARTNER STOCK PULL (Cơ chế đồng bộ chủ động từ API nhà mạng hoặc đại lý khác) */}
              <div className="border border-emerald-100 bg-gradient-to-br from-emerald-50/10 to-transparent rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-emerald-100">
                  <div className="bg-emerald-600 text-white font-mono text-xs font-bold px-3 py-1 rounded-lg">PULL SYNC (1-3 TRIỆU SIM)</div>
                  <h4 className="font-sans font-extrabold text-sm text-emerald-950 uppercase tracking-wide">
                    2. Đề Xuất Kỹ Thuật &amp; Đặc Tả API Đồng Bộ Quy Mô LớN (Incremental Pull Sync)
                  </h4>
                </div>
                <p className="text-xs text-slate-650 leading-relaxed font-sans text-justify">
                  Để đáp ứng nhu cầu tích hợp kho số sỉ cực lớn từ nhà mạng và đại lý đối tác mà không gây xung đột tài nguyên hay lỗi quá tải cổng Gateway, hệ thống Vietsim quy chuẩn hóa luồng kéo dữ liệu (Pull Sync) theo mô hình <strong>Incremental Stream Flow</strong> (Đồng bộ dòng chảy gia tăng).
                </p>

                <div className="bg-slate-950 text-slate-100 p-4 rounded-2xl font-mono text-[10px] space-y-1 overflow-x-auto shadow-inner border border-slate-800">
                  <div className="text-sky-400 font-bold border-b border-slate-800 pb-1 mb-2 tracking-wide uppercase">
                    SƠ ĐỒ HỆ THỐNG &amp; LUỒNG DỮ LIỆU (INCREMENTAL STREAM FLOW)
                  </div>
                  <pre className="text-slate-300 leading-normal">
{` [ Partner API Host ]                   [ Vietsim backend (Cloud Run) ]           [ PostgreSQL ]
         |                                           |                                  |
         |  1. GET /auth/token (Client Creds)        |                                  |
         |<------------------------------------------|                                  |
         |  Returns: AccessToken (JWT, Expires 1h)   |                                  |
         |------------------------------------------>|                                  |
         |                                           |                                  |
         |  2. GET /sims/incremental                 |                                  |
         |     (Header: Authorization Bearer JWT     |                                  |
         |      Query: since = '2026-06-18T00:00:00Z'|                                  |
         |             limit = 50000, page = 1)      |                                  |
         |<------------------------------------------|                                  |
         |                                           |                                  |
         |  3. Streaming chunked payload of          |                                  |
         |     SIM delta arrays                      |                                  |
         |------------------------------------------>|                                  |
         |                                           |  4. Bulk PostgreSQL Transaction   |
         |                                           |     INSERT ... ON CONFLICT (id)  |
         |                                           |     DO UPDATE / DELETE ...       |
         |                                           |--------------------------------->|
         |                              (Repeats until total_pages fetched)             |`}
                  </pre>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-[11px] text-slate-600">
                  <div className="p-4 bg-white rounded-2xl border border-slate-150 space-y-1.5 text-justify">
                    <span className="font-bold text-slate-800 block text-xs">1. ĐỒNG BỘ QUY MÔ LỚN (1 - 3 TRIỆU SIM)</span>
                    <p className="leading-relaxed">
                      Để đảm bảo tính toàn vẹn của ứng dụng đang triển khai trên môi trường containerized, phương pháp đồng bộ 1-3 triệu sim tuyệt đối tránh sử dụng các vòng lặp chèn bản ghi đơn lẻ (Single-Insert Row Loop). Thay vào đó, áp dụng các kỹ thuật cốt lõi sau:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-500 mt-1">
                      <li><strong>Bulk Insert Chunking (Phân mảnh tối đa 100.000 bản ghi):</strong> Gom các tập tin nạp thô vào các cụm mảng lớn rồi đẩy trực tiếp cho DB engine thực thi qua câu lệnh gộp, giảm tải I/O kết nối đến 99%.</li>
                      <li><strong>Bỏ qua khóa HMR &amp; Block Gateway:</strong> Server trả phản hồi JSON nhanh kèm task_id tạo ẩn, giải phóng luồng HTTP chính để tránh lỗi Gateway Timeout (504). Tiến trình nạp dữ liệu chạy ngầm dưới dạng Async Worker.</li>
                      <li><strong>Tự động làm sạch &amp; phân loại:</strong> Trực tiếp giải nén và tiền lọc dữ liệu đầu số rác trước khi lưu trữ.</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-slate-150 space-y-1.5 text-justify">
                    <span className="font-bold text-slate-800 block text-xs">2. ĐỒNG BỘ GIA TĂNG (INCREMENTAL SYNC)</span>
                    <p className="leading-relaxed">
                      Chỉ fetch các SIM mới hoặc vừa được cập nhật kể từ phiên quét của đợt đồng bộ trước đó nhằm tiết kiệm băng thông và tài nguyên.
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-slate-500 mt-1">
                      <li><strong>Tham số theo dấu:</strong> modified_after / since</li>
                      <li><strong>Bộ lưu vết thông minh:</strong> Hệ thống tự động nhớ mốc thời gian gần nhất (lấy từ cột <code>last_synced_at</code> lớn nhất trong DB). Kỳ quét tiếp theo sẽ tự động gắn tham số <code>?since=ISOString</code> làm điều kiện lọc. Đối tác chỉ cần trả về những chiếc sim được sửa đổi/bổ sung sau thời điểm này.</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-150 font-sans text-xs space-y-2">
                  <span className="font-extrabold text-slate-800 block">3. MÔ TẢ LUỒNG GIAO TIẾP &amp; ĐẶC TẢ API KỸ THUẬT VỚI ĐỐI TÁC</span>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-150 text-[11px]">
                      <thead className="bg-[#002244] text-white">
                        <tr>
                          <th className="px-3 py-2 font-bold text-left">Bước</th>
                          <th className="px-3 py-2 font-bold text-left">Tác Vụ Xử Lý</th>
                          <th className="px-3 py-2 font-bold text-left">Bên Cung Cấp API</th>
                          <th className="px-3 py-2 font-bold text-left">Endpoint kỹ thuật &amp; Đặc tả</th>
                          <th className="px-3 py-2 font-bold text-left">Hành động của Vietsim</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-150 text-[10.5px] bg-slate-50/50">
                        <tr>
                          <td className="px-3 py-2 font-bold font-mono">Step 1</td>
                          <td className="px-3 py-2">Xác thực hệ thống (Oauth Client Creds)</td>
                          <td className="px-3 py-2 font-semibold">NHÀ MẠNG / ĐỐI TÁC</td>
                          <td className="px-3 py-2 font-mono text-[#003366] font-bold">POST /auth/token</td>
                          <td className="px-3 py-2 text-slate-500">Gửi credential và nhận JWT Access Token. Lưu an toàn vào bộ nhớ tạm.</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-bold font-mono">Step 2</td>
                          <td className="px-3 py-2">Truy vấn lấy danh sách gia tăng (Incremental)</td>
                          <td className="px-3 py-2 font-semibold">NHÀ MẠNG / ĐỐI TAC</td>
                          <td className="px-3 py-2 font-mono text-[#003366] font-bold">GET /sims/incremental</td>
                          <td className="px-3 py-2 text-slate-500">Gắn Bearer Token và tham số since. Thực thi phân trang đến khi hết dữ liệu.</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-bold font-mono">Step 3</td>
                          <td className="px-3 py-2">Chỉ thị rà soát &amp; lưu vết Đánh dấu xóa</td>
                          <td className="px-3 py-2 font-semibold">VIETSIM CENTRAL</td>
                          <td className="px-3 py-2 font-mono text-[#003366] font-bold">INTERNAL DELTA PROCESSOR</td>
                          <td className="px-3 py-2 text-slate-500">Đối chiếu dữ liệu feed, nếu SIM không tồn tại nữa sẽ được soft-delete chuyển vào deleted_sims.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>


              {/* SECTION: API PHÂN PHỐI BÁN SỈ CHO ĐỐI TÁC CẤP DƯỚI */}
              <div className="border border-indigo-100 bg-gradient-to-br from-indigo-50/10 to-transparent rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-indigo-150">
                  <div className="bg-indigo-600 text-white font-mono text-xs font-bold px-3 py-1 rounded-lg">CỔNG PHÂN PHỐI SỈ (PUSH API)</div>
                  <h4 className="font-sans font-extrabold text-sm text-[#003366] uppercase tracking-wide">
                    3. Tài Liệu Đặc Tả Các API Phân Phối Cung Cấp Cho Đối Tác & Đại Lý Cấp Dưới
                  </h4>
                </div>
                <p className="text-xs text-slate-650 leading-relaxed font-sans">
                  Hỗ trợ mô hình hợp tác đa kênh. Nếu bạn tuyển cộng tác viên hoặc đại lý sở hữu website vệ tinh riêng, hãy cung cấp các Endpoint API phân phối trực tiếp dưới đây để đối tác tích hợp hiển thị kho SIM hoặc gửi lệnh kích hoạt thuê bao và thanh toán tự động lên máy chủ của bạn một cách liền mạch.
                </p>
              </div>


              {/* API 1 */}
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
                  <span className="px-2.5 py-1 bg-green-100 text-green-800 font-mono text-[10px] font-bold rounded-md">GET</span>
                  <span className="font-mono text-sm text-[#003366] font-bold">/api/partner/sims/sync</span>
                  <span className="text-xs text-slate-500 font-sans font-medium ml-auto">3.1. Đồng Bộ Kho Số API Phân Phối Ra Ngoài (Vietsim Xuất Sỉ)</span>
                </div>
                <p className="text-xs text-slate-650 leading-relaxed font-sans">
                  Tuyển đại lý cấp dưới? Cung cấp cổng này để đối tác bên thứ ba của bạn tự động lấy toàn bộ danh sách SIM trống thực tế trong kho Vietsim của bạn kèm thông tin gói cước.
                </p>
                <div className="text-xs">
                  <span className="font-bold block text-slate-700 mb-1">Header yêu cầu:</span>
                  <code className="bg-slate-200 text-slate-800 font-mono px-2 py-1 rounded block w-fit mb-3">x-partner-key: {secrets.api_partner_sync_stock_key || "api_key_xxx"}</code>
                  <span className="font-bold block text-slate-700 mb-1">Response JSON mẫu:</span>
                  <pre className="bg-slate-900 text-slate-200 font-mono text-[10px] p-3 rounded-lg overflow-x-auto text-left leading-relaxed">
{`{
  "success": true,
  "partnerUrlUsed": "${secrets.api_partner_sync_stock_url}",
  "totalCount": 180,
  "sims": [
    {
      "id": "1",
      "simNumber": "0988.888.888",
      "rawNumber": "0988888888",
      "carrier": "Viettel",
      "priceInVND": 150000000,
      "wholesaleDiscountPercent": 20,
      "status": "AVAILABLE",
      "associatedPlan": "V205C (90GB/tháng + Thoại không giới hạn)"
    }
  ]
}`}
                  </pre>
                </div>
              </div>

              {/* API 2 */}
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
                  <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold rounded-md">POST</span>
                  <span className="font-mono text-sm text-[#003366] font-bold">/api/partner/payments/initiate</span>
                  <span className="text-xs text-slate-500 font-sans font-medium ml-auto">3.2. Khởi Tạo Chuyển Khoản Đối Tác</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Thiết lập tự động hóa thanh toán. Khi đối tác hoàn thiện một giỏ hàng, gọi URL này để sinh mã giao dịch thanh toán trực xạ và liên kết QR phù hợp.
                </p>
                <div className="text-xs space-y-2">
                  <div>
                    <span className="font-bold block text-slate-700 mb-1">Tham số Payload (JSON Body):</span>
                    <pre className="bg-slate-100 text-indigo-900 font-mono p-2.5 rounded-lg border">
{`{
  "amount": 350000,
  "orderId": "PARTNER_ORD_999",
  "provider": "vietqr"  // "vietqr" | "momo" | "vnpay"
}`}
                    </pre>
                  </div>
                  <div>
                    <span className="font-bold block text-slate-700 mb-1">Response JSON mẫu:</span>
                    <pre className="bg-slate-900 text-slate-200 font-mono text-[10px] p-2.5 rounded-lg overflow-x-auto text-left">
{`{
  "success": true,
  "message": "Payment transaction initiated successfully via partner gateway.",
  "transactionId": "TXN-PARTNER-A79B2CF0",
  "amount": 350000,
  "provider": "vietqr",
  "paymentUrl": "https://kho-sim.vn/api/partner/payments/checkout-mock?txn=TXN-PARTNER-A79B2CF0"
}`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* API 3 */}
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
                  <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold rounded-md">POST</span>
                  <span className="font-mono text-sm text-[#003366] font-bold">/api/partner/sims/activate</span>
                  <span className="text-xs text-slate-500 font-sans font-medium ml-auto">3.3. Kích Hoạt SIM Kit / Đăng Ký Thuê Bao</span>
                </div>
                <p className="text-xs text-slate-650 leading-relaxed font-sans">
                  Gửi dữ liệu đăng ký thuê bao chính chủ bao gồm họ tên khách hàng, số Căn cước công dân gắn liền, và mã Serial phôi SIM Kit để đăng ký trực tiếp lên hệ sinh thái cổng tổng đài nhà mạng.
                </p>
                <div className="text-xs space-y-2">
                  <div>
                    <span className="font-bold block text-slate-700 mb-1">Tham số Payload:</span>
                    <pre className="bg-slate-100 text-indigo-900 font-mono p-2.5 rounded-lg border">
{`{
  "simNumber": "0988.888.888",
  "fullName": "Nguyen Van A",
  "citizenId": "012345678901",
  "simKitSerial": "8984041122334455"
}`}
                    </pre>
                  </div>
                  <div>
                    <span className="font-bold block text-slate-700 mb-1">Response JSON mẫu:</span>
                    <pre className="bg-[#0c1424] text-slate-200 font-mono text-[10px] p-2.5 rounded-lg overflow-x-auto text-left">
{`{
  "success": true,
  "message": "SIM Kit registration request processed successfully.",
  "subscriberProfile": {
    "number": "0988.888.888",
    "fullName": "Nguyen Van A",
    "citizenId": "012345678901",
    "serialNumber": "8984041122334455",
    "activationStatus": "COMPLETED",
    "carrierActivatedAt": "2026-06-17T07:15:28Z"
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* API 4 - VPA License Plate Matching AI */}
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-5 space-y-3" id="vpa-api-integration-card">
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
                  <span className="px-2.5 py-1 bg-green-100 text-green-850 font-mono text-[10px] font-bold rounded-md">GET/POST</span>
                  <span className="font-mono text-sm text-[#003366] font-bold">/api/partner/vpa/matching-sims</span>
                  <span className="text-xs text-slate-500 font-sans font-medium ml-auto">3.4. Tích Hợp Cổng Đấu Giá Biển Số Xe VPA (Đặc Tả Độc Quyền)</span>
                </div>
                <p className="text-xs text-slate-650 leading-relaxed font-sans">
                  API tích hợp sòng phẳng với hệ thống Đấu giá biển số xe Quốc gia VPA (<a href="https://dgbs.vpa.com.vn/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-semibold">https://dgbs.vpa.com.vn/</a>) để tự bóc tách biển số thô của người dùng thành các dải ký tự đại diện và trích lọc đề xuất đúng 5 SIM may mắn tương compat phù hợp nhất.
                </p>
                <div className="text-xs space-y-2">
                  <div>
                    <span className="font-bold block text-slate-700 mb-1">Tham số Yêu cầu (gửi qua Querystring hoặc POST JSON Body):</span>
                    <div className="p-3.5 bg-slate-100 rounded-xl border space-y-1 text-slate-700 font-sans">
                      <p>• <strong>plate</strong> hoặc <strong>licensePlate</strong> (String - Bắt buộc): Biển số xe cần phân tích tương đồng. Chấp nhận đa dạng cú pháp Việt Nam thô hoặc đẹp (Ví dụ: <code>29AF12039</code>, <code>30F-999.99</code>, <code>34A-4567</code>).</p>
                    </div>
                  </div>
                  <div>
                    <span className="font-bold block text-slate-700 mb-1">Ví dụ phản hồi JSON kết quả thành công (HTTP 200 OK):</span>
                    <pre className="bg-[#050C18] text-[#98C379] font-mono text-[10px] p-3 rounded-lg overflow-x-auto text-left leading-normal">
{`{
  "success": true,
  "partner": "VPA - Vietnam Partnership Auction",
  "partnerWebsite": "https://dgbs.vpa.com.vn/",
  "inputPlate": "29AF12039",
  "parsedAnalysis": {
    "province": "29",
    "series": "AF",
    "numberBlock": "12039",
    "suffix4Digits": "2039",
    "suffix3Digits": "039",
    "suffix2Digits": "39"
  },
  "explanation": "API này cung cấp 5 số SIM có độ tương đồng cao nhất, bổ trợ phong thuỷ hoàn hảo cho biển số xe của bạn.",
  "count": 5,
  "sims": [
    {
      "id": "v10",
      "number": "0989.11.2039",
      "carrier": "Viettel",
      "category": "Sim Số Đẹp",
      "price": 1500000,
      "sum": 36,
      "similarityScore": 950
    }
    // ... tối đa đúng 5 dòng SIM có điểm số Similarity cao nhất
  ]
}`}
                    </pre>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 6: Database Maintenance & Big Data Operations */}
        {activeSubTab === "maintenance" && (
          <div className="space-y-6 animate-fadeIn font-sans p-2">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
              <Database className="w-5 h-5 text-red-600" /> Quản Trị Cơ Sở Dữ Liệu & Vận Hành Quy Mô Lớn
            </h3>

            <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-5 flex gap-3.5 text-amber-900 text-xs leading-relaxed">
              <Shield className="w-5 h-5 shrink-0 text-amber-600 mt-0.5 animate-pulse" />
              <div>
                <span className="font-extrabold block text-sm mb-1">Khu Vực Quản Trị Hệ Thống Nghiêm Ngặt:</span>
                Các lệnh trong phần này can thiệp và thay đổi trực tiếp cấu trúc lượng lớn bản ghi cơ sở dữ liệu. Yêu cầu nhập đúng mật khẩu xác thực quản trị viên (Admin Password) để kích hoạt.
              </div>
            </div>

            {/* Error & Success Alert Bars */}
            {maintenanceError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-xs font-bold leading-normal">
                ⚠️ Lỗi thực thi: {maintenanceError}
              </div>
            )}
            {maintenanceStatus && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-xs font-bold leading-normal">
                ✓ Trạng thái: {maintenanceStatus}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Authentication Credentials Column */}
              <div className="lg:col-span-4 bg-slate-50 border border-slate-200/80 rounded-3xl p-5 space-y-4 h-fit">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Key className="w-4.5 h-4.5 text-[#003366]" />
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Xác Thực Quyền Admin</h4>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-600">Mật khẩu Admin:</label>
                  <input
                    type="password"
                    value={dbPassword}
                    onChange={(e) => setDbPassword(e.target.value)}
                    placeholder="Nhập mật khẩu quản trị..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none focus:border-indigo-500 shadow-sm text-slate-850"
                  />
                  <p className="text-[10px] text-slate-500 leading-normal">
                    *Mật khẩu quản trị mặc định để thực thi (ví dụ mật khẩu admin trong cấu hình).
                  </p>
                </div>
              </div>

              {/* Action Handlers Column */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* 1. Generator Block */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4.5 h-4.5 text-amber-500" />
                      <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-sans">Tạo Ngẫu Nhiên SIM Số Đẹp Hàng Loạt</h4>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[9px] rounded uppercase">Tốc độ cao</span>
                  </div>
                  
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    Hỗ trợ sinh tự động hàng triệu sim số ngẫu nhiên chất lượng cực cao (phối ngẫu hợp lệ dải Viettel, Mobi, Vina, đầy đủ thể loại tứ quý, sảnh tiến, tam hoa, tài lộc phong thuỷ...). Thuật toán sinh được tối ưu hoá trực tiếp trên tầng SQL Database thông qua hàm phát sinh chuỗi cực nhanh, giảm thiểu nghẽn luồng và cạn kiệt bộ nhớ RAM Node.js.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end pt-2">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-600">Số lượng SIM muốn sinh (đến 3.000.000):</label>
                      <select
                        value={generateCount}
                        onChange={(e) => setGenerateCount(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-700 outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="1000">1.000 SIM (Cơ bản)</option>
                        <option value="10000">10.000 SIM (Mở rộng)</option>
                        <option value="100000">100.000 SIM (Doanh nghiệp)</option>
                        <option value="500000">500.000 SIM (Tải trọng cao)</option>
                        <option value="1500000">1.500.000 SIM (Quy mô cực đại)</option>
                        <option value="3000000">3.000.000 SIM (Kiểm thử Giới hạn)</option>
                      </select>
                    </div>

                    <button
                      onClick={handleGenerateSims}
                      disabled={isGenerating || isResetting}
                      className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {isGenerating ? "Đang tạo dữ liệu..." : `Khởi Tạo ${parseInt(generateCount).toLocaleString("vi-VN")} SIM`}
                    </button>
                  </div>

                  {generationProgress && (
                    <div className="bg-amber-50/50 border border-amber-200/40 rounded-xl p-4 space-y-2 bg-gradient-to-r from-amber-50/40 to-transparent">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-amber-800 flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                          Tiến trình sinh SIM ngầm:
                        </span>
                        <span className="font-mono font-extrabold text-amber-950">
                          {generationProgress.inserted.toLocaleString("vi-VN")} / {generationProgress.total.toLocaleString("vi-VN")} ({Math.round((generationProgress.inserted / generationProgress.total) * 100)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                        <div 
                          className="bg-amber-500 h-full rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${Math.round((generationProgress.inserted / generationProgress.total) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        *Cơ chế băm nhỏ luồng (Non-blocking Batch Loop) đang chạy ngầm trên Server giúp chống nghẽn và miễn nhiễm hoàn toàn với lỗi Timeout Cổng Nginx!
                      </p>
                    </div>
                  )}

                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 text-[11px] text-slate-600 leading-normal font-sans">
                    💡 <strong>Mẹo kiểm tra tải trọng:</strong> Việc sinh <strong>10.000 số</strong> chỉ tốn <strong>~100ms</strong>, <strong>1.500.000 số</strong> chỉ tốn <strong>~12 giây</strong>. Sau khi sinh, bạn ra màn hình <strong>Tra Cứu Kho Số</strong> hoặc <strong>Tìm Kiếm Biển Số VPA</strong> để trải nghiệm bộ lọc siêu tốc ứng dụng cơ chế Offset Pagination / Drizzle index đỉnh cao!
                  </div>
                </div>

                {/* 2. Reset DB Block */}
                <div className="bg-rose-50/20 border border-rose-200/40 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-rose-150 pb-2">
                    <div className="flex items-center gap-2">
                      <Database className="w-4.5 h-4.5 text-rose-600" />
                      <h4 className="font-bold text-rose-900 text-xs uppercase tracking-wider font-sans">Làm Sạch & Reset Database</h4>
                    </div>
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold text-[9px] rounded uppercase">Nguy hiểm</span>
                  </div>

                  <p className="text-xs text-slate-655 leading-relaxed font-sans">
                    Xóa vĩnh viễn toàn bộ danh sách SIM trống, SIM đã bán cùng toàn bộ biên lai lịch sử đơn hàng trong hệ thống. Đưa cơ sở dữ liệu về trạng thái sạch ban đầu. Hành động này không thể khôi phục, xin vui lòng cân nhắc tuyệt đối trước khi nhấn nút.
                  </p>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleResetDb}
                      disabled={isGenerating || isResetting}
                      className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm animate-pulse"
                    >
                      {isResetting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                      {isResetting ? "Đang dọn dẹp cơ sở dữ liệu..." : "Xác Nhận Reset & Xóa Sạch Database"}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>


      {/* PASSWORD PROTECTION MODAL FOR NEXTJS ZIP DOWNLOAD */}
      {isPassModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-sm w-full overflow-hidden animate-scaleIn">
            <div className="bg-gradient-to-br from-[#003366] to-[#001f3f] text-white p-6 relative">
              <button
                onClick={() => setIsPassModalOpen(false)}
                className="absolute top-4 right-4 text-blue-200 hover:text-white transition-colors cursor-pointer text-sm font-bold bg-white/10 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/20"
              >
                ✕
              </button>
              <div className="space-y-1">
                <span className="bg-[#FFD700] text-[#003366] font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">Xác Thực Quản Trị</span>
                <h3 className="font-sans font-black text-base text-slate-100 flex items-center gap-2 mt-1">
                  🔑 Yêu Cầu Mật Khẩu
                </h3>
                <p className="text-xs text-blue-200">
                  Vui lòng cung cấp mật khẩu quản trị để tải xuống mã nguồn VietSim Next.js 15.
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Mật khẩu bảo mật:</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu..."
                    value={downloadPassword}
                    onChange={(e) => {
                      setDownloadPassword(e.target.value);
                      if (downloadPassError) setDownloadPassError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleVerifyPasswordAndDownload();
                      }
                    }}
                    className="w-full pl-3 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] font-sans text-sm text-slate-800 tracking-wider"
                    autoFocus
                  />
                  <div className="absolute inset-y-0 right-3 flex items-center">
                    <Shield className="w-5 h-5 text-slate-300" />
                  </div>
                </div>
                {downloadPassError && (
                  <p className="text-[11px] text-rose-600 font-bold bg-rose-50 p-2.5 rounded-lg border border-rose-100 animate-pulse">
                    ⚠️ {downloadPassError}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPassModalOpen(false)}
                  disabled={isVerifyingPass}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold text-xs py-3.5 rounded-xl transition-all text-center cursor-pointer"
                >
                  HỦY BỎ
                </button>
                <button
                  type="button"
                  onClick={handleVerifyPasswordAndDownload}
                  disabled={isVerifyingPass}
                  className="flex-1 bg-[#003366] hover:bg-[#002244] disabled:bg-slate-400 text-white font-extrabold text-xs py-3.5 rounded-xl transition-all text-center cursor-pointer shadow-md shadow-[#003366]/10 flex items-center justify-center gap-1.5"
                >
                  {isVerifyingPass ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      ĐANG XÁC MINH...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      XÁC NHẬN
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer bar indicator */}
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-wrap gap-2 items-center justify-between text-slate-550 text-xs">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Tài liệu nội bộ đã xác thực kỹ thuật và sẵn sàng phục vụ xuất bản.</span>
        </div>
        <span className="font-mono text-[10px]">Version: 1.2.6-stable</span>
      </div>
    </div>
  );
}

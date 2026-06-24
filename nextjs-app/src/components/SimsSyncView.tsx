"use client";

import React, { useState, useEffect } from "react";
import { 
  Download, 
  RefreshCw, 
  FileText, 
  Check, 
  Copy, 
  AlertCircle, 
  Calendar, 
  Server, 
  Settings, 
  Layers, 
  Activity, 
  CheckCircle2, 
  Database, 
  User, 
  Clock, 
  ArrowRight, 
  ChevronRight, 
  History,
  Trash2,
  ListFilter,
  Terminal,
  Cpu,
  Sliders,
  BarChart2,
  BookOpen,
  Wifi,
  ExternalLink,
  ShieldCheck,
  Send
} from "lucide-react";

interface SimsSyncViewProps {
  onRefreshStock?: () => Promise<void> | void;
  currentAgent?: any;
}

export default function SimsSyncView({ onRefreshStock, currentAgent }: SimsSyncViewProps) {
  // Main Navigation Tabs
  const [syncSubTab, setSyncSubTab] = useState<"inbound" | "outbound" | "massive" | "tracking" | "docs">("inbound");
  
  // Inbound Inner Sub-Tabs
  const [inboundInnerTab, setInboundInnerTab] = useState<"pull-api" | "scraper" | "manual">("pull-api");

  // System secrets (pre-filled from database)
  const [secrets, setSecrets] = useState<any>({
    api_partner_sync_stock_url: "",
    api_partner_sync_stock_key: "",
    sync_schedule_enabled: true,
    sync_schedule_period: "daily",
    sync_schedule_hour: "02",
    sync_scraper_target: "",
    sync_scraper_sim_count: ""
  });

  // Pull API Inbound States
  const [apiSource, setApiSource] = useState<string>("Mobifone");
  const [customSource, setCustomSource] = useState<string>("");
  const [apiUrl, setApiUrl] = useState<string>("https://api.mobifone.vn/v2/sims/pool");
  const [apiApiKey, setApiApiKey] = useState<string>("");
  const [isProcessingApi, setIsProcessingApi] = useState<boolean>(false);
  const [apiMessage, setApiMessage] = useState<{ type: "success" | "error"; text: string; details?: any } | null>(null);

  // API Pull-Sync Scheduler states
  const [apiSyncScheduleEnabled, setApiSyncScheduleEnabled] = useState<boolean>(false);
  const [apiSyncSchedulePeriod, setApiSyncSchedulePeriod] = useState<string>("manual");
  const [apiSyncScheduleHour, setApiSyncScheduleHour] = useState<string>("2");

  // Scraper / Cron Inbound States
  const [scraperUrl, setScraperUrl] = useState<string>("https://simthanglong.vn/sim-gia-re");
  const [scraperLimit, setScraperLimit] = useState<number>(25);
  const [scraperLogs, setScraperLogs] = useState<string[]>([]);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [scraperResult, setScraperResult] = useState<any>(null);

  // Manual Inbound States
  const [manualText, setManualText] = useState<string>("");
  const [manualSource, setManualSource] = useState<string>("Thủ công");
  const [isProcessingManual, setIsProcessingManual] = useState<boolean>(false);
  const [manualMessage, setManualMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Outbound Sync Live Sandbox States
  const [outboundApiKey, setOutboundApiKey] = useState<string>("");
  const [outboundPage, setOutboundPage] = useState<number>(1);
  const [outboundLimit, setOutboundLimit] = useState<number>(10);
  const [isQueryingOutbound, setIsQueryingOutbound] = useState<boolean>(false);
  const [outboundResult, setOutboundResult] = useState<any>(null);

  // Massive Scale Interactive Sandbox States
  const [totalSims, setTotalSims] = useState<number>(1000000);
  const [chunkSize, setChunkSize] = useState<number>(50000);
  const [parallelWorkers, setParallelWorkers] = useState<number>(4);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simProgress, setSimProgress] = useState<number>(0);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [simStats, setSimStats] = useState<any>({
    speed: 0,
    elapsed: 0,
    memory: 18,
    processed: 0,
    dbWrites: 0,
    softDeletes: 0
  });

  // Deleted SIMs tracking state
  const [deletedSims, setDeletedSims] = useState<any[]>([]);
  const [loadingDeleted, setLoadingDeleted] = useState<boolean>(false);

  // Copied text notification
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // 1. Fetch system secrets on load
  const fetchSecrets = async () => {
    try {
      const response = await fetch("/api/secrets");
      if (response.ok) {
        const data = await response.json();
        setSecrets(data);
        if (data.api_partner_sync_stock_url) {
          setApiUrl(data.api_partner_sync_stock_url);
        }
        if (data.api_partner_sync_stock_key) {
          setApiApiKey(data.api_partner_sync_stock_key);
          setOutboundApiKey(data.api_partner_sync_stock_key);
        }
        if (data.sync_scraper_target) {
          setScraperUrl(data.sync_scraper_target);
        }
        if (data.sync_scraper_sim_count) {
          setScraperLimit(parseInt(data.sync_scraper_sim_count) || 25);
        }
        if (data.api_sync_schedule_enabled !== undefined) {
          setApiSyncScheduleEnabled(!!data.api_sync_schedule_enabled);
        }
        if (data.api_sync_schedule_period) {
          setApiSyncSchedulePeriod(data.api_sync_schedule_period);
        }
        if (data.api_sync_schedule_hour) {
          setApiSyncScheduleHour(data.api_sync_schedule_hour);
        }
      }
    } catch (err) {
      console.error("Error loading system secret profiles:", err);
    }
  };

  useEffect(() => {
    fetchSecrets();
  }, []);

  // 2. Pre-configured URLs for Inbound API Sync Based on Selection
  useEffect(() => {
    if (apiSource === "Mobifone") {
      setApiUrl("https://api.mobifone.vn/v2/sims/pool");
    } else if (apiSource === "Viettel") {
      setApiUrl("https://partners.viettel.vn/telecom/v3/simcard/inventory");
    } else if (apiSource === "VNSKY") {
      setApiUrl("https://api.vnsky.vn/partner/sims/feed");
    } else if (apiSource === "custom") {
      setApiUrl(secrets.api_partner_sync_stock_url || "https://api.partner-domain.com/v1/sims");
    }
  }, [apiSource, secrets]);

  // Fetch Deleted SIM history from database
  const fetchDeletedSims = async () => {
    setLoadingDeleted(true);
    try {
      const response = await fetch("/api/admin/deleted-sims");
      if (response.ok) {
        const data = await response.json();
        setDeletedSims(data);
      }
    } catch (err) {
      console.error("Error loading deleted sims tracker:", err);
    } finally {
      setLoadingDeleted(false);
    }
  };

  useEffect(() => {
    if (syncSubTab === "tracking") {
      fetchDeletedSims();
    }
  }, [syncSubTab]);

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Drag and Drop text file upload helper
  const handleFileDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setManualText(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  // Setup Excel Sample Template download
  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Số điện thoại,Giá,Nhà mạng,Thể loại,Trạng thái,Ghi chú\n"
      + "0912345678,2500000,Vinaphone,Tam Hoa,Còn hàng,Đầu số cổ đẹp\n"
      + "0988888888,150000000,Viettel,Ngũ Quý,Còn hàng,Sim víp đại gia\n"
      + "0903456789,12000000,Mobifone,Sảnh Tiến,Ngừng bán,Đã thu hồi trả kho\n"
      + "0923334444,3500000,Vietnamobile,Tứ Quý,Còn hàng,Mức chiết khấu cao\n"
      + "0791112222,4800000,Mobifone,Ngũ Quý,Inactive,Ngừng kinh doanh\n";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "vietsim_template_sync.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Perform Manual Sync
  const handleManualSync = async () => {
    if (!manualText.trim()) {
      setManualMessage({ type: "error", text: "Vui lòng nhập dữ liệu SIM để tiếp tục." });
      return;
    }

    setIsProcessingManual(true);
    setManualMessage(null);

    try {
      const lines = manualText.split("\n");
      const items: any[] = [];

      for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.trim().split(/[,;|\t]/);
        if (parts.length < 1) continue;

        const number = parts[0]?.trim();
        const price = parseFloat((parts[1] || "500000").replace(/\D/g, "")) || 500000;
        const carrier = parts[2]?.trim() || "";
        const category = parts[3]?.trim() || "";
        const status = parts[4]?.trim() || "Còn hàng";
        const notes = parts[5]?.trim() || "Đồng bộ thủ công qua bảng quản trị";

        items.push({ number, price, carrier, category, status, notes });
      }

      if (items.length === 0) {
        throw new Error("Không thể trích xuất hồ sơ SIM hợp lệ từ nội dung văn bản.");
      }

      const syncUser = currentAgent ? currentAgent.name : "Admin";
      const response = await fetch("/api/admin/sync-sims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: manualSource,
          syncUser,
          items
        })
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setManualMessage({ 
          type: "success", 
          text: `🎉 Đồng bộ thành công: ${result.message}` 
        });
        setManualText("");
        if (onRefreshStock) onRefreshStock();
      } else {
        throw new Error(result.error || "Không thể đồng bộ các bản ghi SIM.");
      }
    } catch (err: any) {
      setManualMessage({ type: "error", text: err.message || "Lỗi xử lý đồng bộ tệp." });
    } finally {
      setIsProcessingManual(false);
    }
  };

  // Trigger Pull API Inbound Sync (REST Client pulling from partner)
  const handleExecutePullSync = async () => {
    setIsProcessingApi(true);
    setApiMessage(null);
    try {
      // POST out to our /api/partner/sims/pull-sync endpoint
      const response = await fetch("/api/partner/sims/pull-sync", {
        method: "POST"
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setApiMessage({
          type: "success",
          text: `🔥 [ĐỒNG BỘ PULL THỰC TẾ THÀNH CÔNG] Lấy thành công dữ liệu từ đối tác!`,
          details: data.details
        });
        if (onRefreshStock) onRefreshStock();
      } else {
        throw new Error(data.error || "Không thể thực thi tải mồi từ upstream.");
      }
    } catch (err: any) {
      setApiMessage({
        type: "error",
        text: `Thất bại kết nối API đối tác sỉ: ${err.message}`
      });
    } finally {
      setIsProcessingApi(false);
    }
  };
  
  const [saveApiSyncSuccess, setSaveApiSyncSuccess] = useState<boolean>(false);
  const handleSaveApiSyncSecrets = async () => {
    try {
      const response = await fetch("/api/secrets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_sync_schedule_enabled: apiSyncScheduleEnabled,
          api_sync_schedule_period: apiSyncSchedulePeriod,
          api_sync_schedule_hour: apiSyncScheduleHour,
          api_partner_sync_stock_url: apiUrl,
          api_partner_sync_stock_key: apiApiKey
        })
      });
      if (response.ok) {
        setSaveApiSyncSuccess(true);
        setTimeout(() => setSaveApiSyncSuccess(false), 3000);
        await fetchSecrets();
      }
    } catch (err) {
      console.error("Lỗi khi lưu cấu hình API Pull Sync Scheduler:", err);
    }
  };

  // Run Scraper (SimThangLong Web Crawler simulation)
  const handleRunScraper = async () => {
    setIsScraping(true);
    setScraperLogs(["[Client] Bắt đầu kích hoạt trình thu thập dữ liệu...", `[Client] Mục tiêu: ${scraperUrl}`, `[Client] Giới hạn thu nạp: ${scraperLimit} SIM`]);
    setScraperResult(null);

    try {
      const response = await fetch("/api/secrets/scrape-simthanglong", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: scraperUrl,
          limitSims: scraperLimit
        })
      });
      const data = await response.json();
      if (data.logs) {
        setScraperLogs(data.logs);
      } else {
        setScraperLogs(prev => [...prev, "[Client Log] Không tìm thấy nhật ký chi tiết từ Server."]);
      }
      setScraperResult(data);
      if (onRefreshStock) onRefreshStock();
    } catch (e: any) {
      setScraperLogs(prev => [...prev, `[CRITICAL FATAL] Lỗi đường truyền: ${e.message}`]);
    } finally {
      setIsScraping(false);
    }
  };

  // Query Outbound API Tester (Live GET Sandbox simulating other partners query Vietsim stock)
  const handleQueryOutboundAPI = async () => {
    setIsQueryingOutbound(true);
    setOutboundResult(null);
    try {
      // Query the live GET /api/partner/sims/sync endpoint
      const authKey = outboundApiKey || secrets.api_partner_sync_stock_key || "PARTNER_STOCK_KEY_X";
      const fetchUrl = `/api/partner/sims/sync?apiKey=${authKey}&page=${outboundPage}&limit=${outboundLimit}`;
      const res = await fetch(fetchUrl, {
        method: "GET",
        headers: {
          "x-partner-key": authKey
        }
      });
      const data = await res.json();
      setOutboundResult({
        status: res.status,
        statusText: res.statusText,
        urlQueried: fetchUrl,
        headersSent: { "x-partner-key": authKey },
        payload: data
      });
    } catch (err: any) {
      setOutboundResult({
        error: true,
        message: err.message
      });
    } finally {
      setIsQueryingOutbound(false);
    }
  };

  // Massive Scale Simulator Simulation Engine
  const startMassiveSimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimProgress(0);
    setSimLogs([]);
    setSimStats({
      speed: 0,
      elapsed: 0,
      memory: 20,
      processed: 0,
      dbWrites: 0,
      softDeletes: 0
    });

    const isScaleMultiplier = totalSims === 1000000 ? 1 : totalSims === 2000000 ? 2 : 3;
    const totalBatches = totalSims / chunkSize;
    
    const logs = [
      `🚀 [Kích hoạt] Động Cơ Đồng Bộ Quy Mô Lớn: Tổng dải số sỉ ${totalSims.toLocaleString()} SIM`,
      `⚙️ [Cấu hình] Kích thước phân mảnh (Chunk): ${chunkSize.toLocaleString()} SIM/lần | Lực lượng đa luồng: ${parallelWorkers} Workers`,
      `🔐 BƯỚC 1: Tiến hành Handshake OAuth Client Credentials to Partner Host...`,
      `🌐 >> Request OUTBOUND: POST https://partner-telecom.net/auth/token`,
      `📝 >> Payload: { client_id: "vietsim_sec_88", client_secret: "********", grant_type: "client_credentials" }`,
    ];
    setSimLogs([...logs]);

    // Fast delay steps simulating hyper-real asynchronous pipeline loading
    await new Promise(resolve => setTimeout(resolve, 800));
    logs.push(`🔑 [Step 1 Thành công] Cấp phát AccessToken: JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ... (Expires 1h)`);
    logs.push(`🔍 BƯỚC 2: Truy vấn dữ liệu nạp gia tăng (Incremental Pull Request)...`);
    logs.push(`📡 >> Request: GET https://partner-telecom.net/sims/incremental?since=2026-06-18T00:00:00Z&limit=${chunkSize}&page=1`);
    logs.push(`🔒 >> Headers: { Authorization: "Bearer JWT_TOKEN_XYZ_999" }`);
    logs.push(`📊 [Database Optimizer] Kiểm tra database index và composite keys: non_unique (carrier), unique_hash (searchableNumber), compound (last_synced_at) -> HOẠT ĐỘNG TỐT.`);
    setSimLogs([...logs]);

    await new Promise(resolve => setTimeout(resolve, 700));
    logs.push(`📥 BƯỚC 3: Stream dữ liệu nhị phân (Avro Buffer Array Stream) và thực thi Bulk Insert Chunking...`);
    logs.push(`⚡ >> Cơ chế bypass HMR bottleneck & block Gateway Timeout (504): Khởi tạo ngầm Async Worker Task ID: task_sync_${Math.random().toString(36).substring(2, 8)}`);
    setSimLogs([...logs]);

    // Looping batches
    let currentProcessed = 0;
    const startTime = Date.now();
    
    for (let i = 1; i <= totalBatches; i++) {
      await new Promise(resolve => setTimeout(resolve, Math.max(2500 / totalBatches, 200)));
      currentProcessed += chunkSize;
      const progressPercent = Math.round((currentProcessed / totalSims) * 100);
      const tempElapsed = (Date.now() - startTime) / 1000;
      const speed = Math.round(currentProcessed / tempElapsed);
      const currentMemory = Math.round(20 + Math.random() * 15 + (i * (40 / totalBatches)));

      setSimProgress(progressPercent);
      setSimStats({
        speed,
        elapsed: tempElapsed.toFixed(2),
        memory: currentMemory,
        processed: currentProcessed,
        dbWrites: Math.round(currentProcessed * 0.98), // 98% are updates/inserts
        softDeletes: Math.round(i * 120 * isScaleMultiplier)
      });

      logs.push(`📦 [Batch ${i}/${totalBatches}] Stream received chunk of ${chunkSize.toLocaleString()} SIM records. Ghi nhận SQL Bulk Transaction...`);
      logs.push(`💾 >> SQL Thread: INSERT INTO sims (id, number, searchable_number, price, carrier, status) VALUES (...) ON CONFLICT (searchable_number) DO UPDATE SET price = EXCLUDED.price, last_synced_at = NOW()`);
      setSimLogs([...logs]);
    }

    await new Promise(resolve => setTimeout(resolve, 600));
    const finalElapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const deletedCalculated = Math.round(650 * isScaleMultiplier);

    logs.push(`✨ BƯỚC 4: Kích hoạt INTERNAL DELTA PROCESSOR (Chỉ thị rà soát & lưu vết Đánh dấu xóa)...`);
    logs.push(`⚡ >> Thực thi Table Comparison: So sánh delta giữa bảng 'sims' và tập hợp feed sỉ vừa nạp.`);
    logs.push(`⚠️ >> Phát hiện ${deletedCalculated.toLocaleString()} SIM vắng mặt (ngừng bán phía đối tác).`);
    logs.push(`📂 >> Sao lưu & Di chuyển ${deletedCalculated.toLocaleString()} SIM ngừng kinh doanh sang bảng 'deleted_sims'...`);
    logs.push(`💾 >> SQL Thread: INSERT INTO deleted_sims SELECT * FROM sims WHERE id NOT IN (feed_set_ids); DELETE FROM sims WHERE id NOT IN (feed_set_ids);`);
    logs.push(`🎉 [HOÀN THÀNH ĐỒNG BỘ QUY MÔ LỚN] Tổng cộng ${totalSims.toLocaleString()} SIM được giải quyết trong ${finalElapsed} giây! Tốc độ trung bình: ${Math.round(totalSims / parseFloat(finalElapsed)).toLocaleString()} SIM/giây.`);
    
    setSimLogs([...logs]);
    setIsSimulating(false);
    setSimProgress(100);
  };

  return (
    <div className="space-y-6" id="sims-sync-view-container">
      {/* 1. Header Hero Banner */}
      <div className="bg-gradient-to-r from-[#001f3f] via-[#003366] to-[#0d9488] rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-l-4 border-[#FFD700]">
        <div className="space-y-1">
          <span className="bg-[#FFD700]/10 text-[#FFD700] px-3 py-1 rounded text-[10px] font-extrabold uppercase tracking-widest border border-[#FFD700]/25 flex items-center gap-1.5 w-max">
            <Wifi className="w-3.5 h-3.5 text-[#FFD700] animate-pulse" /> Multi-Tier Sync Centralized Module
          </span>
          <h2 className="text-2xl sm:text-3xl font-sans font-black tracking-tight text-white">
            Trung Tâm Đồng Bộ Kho Số Doanh Nghiệp
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Hợp nhất mọi phương pháp điều chỉnh kho SIM của đại lý &amp; đối tác: Hướng nạp (Inbound) API tự động, quét dữ liệu SimThangLong, nạp Excel thủ công, và Cổng xuất API đại lý (Outbound) chuẩn bảo mật. Tích hợp thanh Sandbox mô phỏng quy mô lớn 1-3 triệu SIM.
          </p>
        </div>

        <div className="p-4 bg-black/35 rounded-2xl border border-sky-400/20 flex items-center gap-3 shrink-0 self-start md:self-auto font-mono text-xs">
          <Database className="w-5 h-5 text-emerald-400 animate-pulse" />
          <div className="leading-tight">
            <span className="text-[9px] text-slate-400 block uppercase font-mono">Bảng Cơ Sở Dữ Liệu Lớp 2:</span>
            <strong className="text-emerald-400 font-bold block text-xs">PostgreSQL + deleted_sims Active</strong>
          </div>
        </div>
      </div>

      {/* 2. Top-level Standardized Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-1" id="sync-tabs-main-bar">
        <button
          onClick={() => setSyncSubTab("inbound")}
          className={`px-4 py-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            syncSubTab === "inbound" 
              ? "bg-[#003366] text-white shadow font-bold" 
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Server className="w-4 h-4 text-emerald-500" /> Đối tác → Vietsim (Đồng bộ vào)
        </button>

        <button
          onClick={() => setSyncSubTab("outbound")}
          className={`px-4 py-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            syncSubTab === "outbound" 
              ? "bg-[#003366] text-white shadow font-bold" 
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Send className="w-4 h-4 text-[#FFD700]" /> Vietsim → Đại lý (Đồng bộ ra)
        </button>

        <button
          onClick={() => setSyncSubTab("massive")}
          className={`px-4 py-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            syncSubTab === "massive" 
              ? "bg-[#003366] text-white shadow font-bold" 
              : "text-slate-600 hover:text-indigo-900 hover:bg-indigo-50"
          }`}
        >
          <Cpu className="w-4 h-4 text-pink-500 animate-spin" style={{ animationDuration: '6s' }} /> Phòng thử nghiệm 1-3 Triệu SIM
        </button>

        <button
          onClick={() => setSyncSubTab("tracking")}
          className={`px-4 py-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            syncSubTab === "tracking" 
              ? "bg-[#003366] text-white shadow font-bold" 
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <History className="w-4 h-4 text-red-500" /> Nhật ký dọn dẹp ({deletedSims.length})
        </button>

        <button
          onClick={() => setSyncSubTab("docs")}
          className={`px-4 py-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
            syncSubTab === "docs" 
              ? "bg-[#003366] text-white shadow font-bold" 
              : "text-slate-600 hover:text-[#003366] hover:bg-slate-100"
          }`}
        >
          <BookOpen className="w-4 h-4 text-sky-500" /> Sơ đồ &amp; API Spec
        </button>
      </div>

      {/* 3. Panel Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6" id="sync-subtab-active-panel">
        
        {/* ======================================================================= */}
        {/* =============== SUBTAB 1: INBOUND (Đối tác -> Vietsim) ================ */}
        {/* ======================================================================= */}
        {syncSubTab === "inbound" && (
          <div className="space-y-6">
            {/* Sub-tabs indicators */}
            <div className="flex gap-2 border-b border-slate-100 pb-3">
              <button 
                onClick={() => setInboundInnerTab("pull-api")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  inboundInnerTab === "pull-api" ? "bg-emerald-50 text-emerald-800 border-l-2 border-emerald-500" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                📡 Pull Sync từ Nhà mạng
              </button>
              <button 
                onClick={() => setInboundInnerTab("scraper")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  inboundInnerTab === "scraper" ? "bg-amber-50 text-amber-800 border-l-2 border-amber-500" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                🕷️ Quét Crawl định kỳ
              </button>
              <button 
                onClick={() => setInboundInnerTab("manual")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  inboundInnerTab === "manual" ? "bg-slate-100 text-slate-800 border-l-2 border-slate-500" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                📝 Đồng bộ Text / Excel thủ công
              </button>
            </div>

            {/* Inbound sub-view: Pull API Sync from upstream carriers */}
            {inboundInnerTab === "pull-api" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Form controls */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        ĐỒNG BỘ CHỦ ĐỘNG QUA PULL SIM API ENDPOINT
                      </h3>
                      <p className="text-slate-500 text-xs">
                        Gọi API trực tiếp từ hệ thống đối tác để kéo danh sách tồn kho sỉ về lưu trữ tại PostgreSQL. Kích hoạt Failover tự động nếu API của đối tác bị chậm trễ hoặc dọn dẹp SIM delta.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Nguồn Nhà Mạng Của Đại Lý Sỉ:</label>
                        <select
                          value={apiSource}
                          onChange={(e) => setApiSource(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-sans font-bold text-slate-700 cursor-pointer"
                        >
                          <option value="Mobifone">Mobifone API Stream</option>
                          <option value="Viettel">Viettel Telecom inventory pool</option>
                          <option value="VNSKY">VNSKY Gateway feeds</option>
                          <option value="custom">Nguồn tự cấu hình (On-premise)...</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1 font-mono">X-PARTNER-KEY SECURITY TOKEN:</label>
                        <input
                          type="password"
                          value={apiApiKey}
                          onChange={(e) => setApiApiKey(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono text-[#003366]"
                          placeholder="Mật khẩu API kết nối sỉ..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">URL API đích liên kết :</label>
                      <input
                        type="url"
                        value={apiUrl}
                        disabled={apiSource !== "custom"}
                        onChange={(e) => setApiUrl(e.target.value)}
                        className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[#003366] disabled:opacity-75"
                        placeholder="https://api.domain.com/v1/stock/feed"
                      />
                    </div>

                    {apiMessage && (
                      <div className={`p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-xs flex gap-2.5 items-start animate-fadeIn ${
                        apiMessage.type === "error" ? "bg-red-50 border-red-150 text-red-800" : "bg-emerald-50 border-emerald-100 text-emerald-950"
                      }`}>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div className="space-y-1.5 flex-1">
                          <p className="font-bold">{apiMessage.text}</p>
                          {apiMessage.details && (
                            <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200 font-mono text-[10px] leading-relaxed text-slate-700 space-y-1">
                              <div>🎯 <strong>URL thực tế đã gọi:</strong> {apiMessage.details.upstreamUrl}</div>
                              <div>🔗 <strong>Phương thức kết nối:</strong> {apiMessage.details.mode}</div>
                              <div>📥 <strong>Nạp mới / Cập nhật:</strong> <span className="text-emerald-600 font-bold">{apiMessage.details.importedFromPartner} SIM / {apiMessage.details.updatedInPartner} SIM</span></div>
                              <div>⚠️ <strong>Xóa rà soát Delta:</strong> <span className="text-rose-600 font-bold">{apiMessage.details.deletedDeltaFromPartner} SIM</span></div>
                              <div>🔑 <strong>Security Token:</strong> X-PARTNER-KEY verified</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-1">
                      <button
                        onClick={handleExecutePullSync}
                        disabled={isProcessingApi}
                        className={`flex items-center justify-center gap-2 bg-[#003366] hover:bg-[#002244] text-white font-bold py-3 px-6 rounded-xl text-xs tracking-wider transition-all cursor-pointer shadow-lg`}
                      >
                        <RefreshCw className={`w-4 h-4 ${isProcessingApi ? "animate-spin" : ""}`} />
                        {isProcessingApi ? "ĐANG TRIỂN KHAI PULL ĐỒNG BỘ..." : "GỌI API ĐỒNG BỘ CHỦ ĐỘNG (PULL SYNC MỒI)"}
                      </button>
                    </div>
                  </div>

                  {/* Right side interactive settings cards */}
                  <div className="space-y-4">
                    {/* Panel 1: API Pull-Sync Scheduler Settings */}
                    <div className="bg-[#003366]/5 rounded-2xl border border-[#003366]/15 p-5 space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2.5">
                        <Calendar className="w-4 h-4 text-[#003366]" />
                        <span className="text-xs font-bold text-slate-850 uppercase tracking-wide">Đặt lịch chạy ngầm (API Scheduler):</span>
                      </div>
                      
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-600">Tình trạng scheduler ngầm:</span>
                          <button
                            onClick={() => setApiSyncScheduleEnabled(!apiSyncScheduleEnabled)}
                            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              apiSyncScheduleEnabled ? "bg-emerald-500" : "bg-slate-300"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                apiSyncScheduleEnabled ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tần suất đồng bộ sỉ:</label>
                          <select
                            disabled={!apiSyncScheduleEnabled}
                            value={apiSyncSchedulePeriod}
                            onChange={(e) => setApiSyncSchedulePeriod(e.target.value)}
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-medium cursor-pointer disabled:opacity-50"
                          >
                            <option value="hourly">Mỗi giờ một lần (Hourly)</option>
                            <option value="six_hours">Mỗi 6 tiếng một lần</option>
                            <option value="twelve_hours">Mỗi 12 tiếng một lần</option>
                            <option value="daily">Hàng ngày (Daily schedule)</option>
                            <option value="manual">Chạy thủ công hoàn toàn</option>
                          </select>
                        </div>

                        {apiSyncSchedulePeriod === "daily" && (
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Khung giờ quét vàng (AM/PM):</label>
                            <select
                              disabled={!apiSyncScheduleEnabled}
                              value={apiSyncScheduleHour}
                              onChange={(e) => setApiSyncScheduleHour(e.target.value)}
                              className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-medium cursor-pointer disabled:opacity-50"
                            >
                              {Array.from({ length: 24 }).map((_, h) => (
                                <option key={h} value={h.toString()}>
                                  {h < 10 ? `0${h}` : h}:00 {h < 12 ? "AM" : "PM"}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <button
                          onClick={handleSaveApiSyncSecrets}
                          className="w-full bg-[#003366] hover:bg-[#002244] text-white font-bold py-2 rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1 shadow"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          LƯU CẤU HÌNH LỊCH TRÌNH NỀN
                        </button>
                        
                        {saveApiSyncSuccess && (
                          <div className="text-[10px] text-emerald-600 font-bold text-center animate-fadeIn">
                            ✓ Cập nhật lịch trình ngầm PostgreSQL thành công!
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Panel 2: Last schedule results metadata */}
                    <div className="bg-slate-50/70 rounded-2xl border border-slate-200 p-5 space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                        <History className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Trạng thái đồng bộ gần nhất:</span>
                      </div>
                      
                      <div className="text-[11px] text-slate-600 space-y-2 leading-relaxed">
                        <div className="flex justify-between border-b border-dashed border-slate-250 pb-1.5">
                          <span>Phiên đăng tải:</span>
                          <span className="font-semibold text-slate-800">
                            {secrets.api_sync_last_run ? new Date(secrets.api_sync_last_run).toLocaleString("vi-VN") : "Chưa có thông tin"}
                          </span>
                        </div>
                        {secrets.api_sync_last_run_result ? (
                          <>
                            <div className="flex justify-between border-b border-dashed border-slate-250 pb-1.5">
                              <span>Hạng mục hoạt động:</span>
                              <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-extrabold text-[9px] uppercase">
                                {secrets.api_sync_last_run_result.type || "Scheduler"}
                              </span>
                            </div>
                            <div className="flex justify-between border-b border-dashed border-slate-250 pb-1.5">
                              <span>Sản lượng nạp mới sỉ:</span>
                              <span className="text-emerald-600 font-bold">
                                {secrets.api_sync_last_run_result.importedCount || 0} SIM
                              </span>
                            </div>
                            <div className="flex justify-between font-medium">
                              <span>Xóa rà soát Delta:</span>
                              <span className="text-rose-600 font-bold">
                                {secrets.api_sync_last_run_result.deletedCount || 0} SIM
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-slate-400 italic text-[10px] text-center pt-1">Chưa có bản ghi thống kê kết quả chạy nền.</div>
                        )}
                      </div>
                    </div>

                    {/* Panel 3: Real-time Operations Log Console (Black frame) */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block flex items-center gap-1">
                        <Terminal className="w-3.5 h-3.5 text-slate-600" /> Real-time Operations Log Console:
                      </span>
                      <div className="bg-slate-950 font-mono text-[9px] text-slate-200 p-3.5 rounded-xl h-48 overflow-y-auto leading-relaxed border border-slate-800 shadow-inner">
                        {(!secrets.api_sync_last_run_logs || secrets.api_sync_last_run_logs.length === 0) && (!apiMessage || !apiMessage.details?.logs) ? (
                          <div className="text-slate-500 italic text-center pt-10">Chưa ghi nhận log vận hành. Bấm mồi đồng bộ để xem nhật ký vận hành chi tiết...</div>
                        ) : (
                          (apiMessage && apiMessage.details?.logs ? apiMessage.details.logs : secrets.api_sync_last_run_logs).map((l: string, idx: number) => {
                            let textClass = "text-slate-300";
                            if (l.includes("[Hoàn thành]") || l.includes("thành công") || l.includes("Success")) textClass = "text-emerald-400 font-bold";
                            if (l.includes("Thất bại") || l.includes("Warning") || l.includes("Error") || l.includes("Warning")) textClass = "text-amber-400";
                            return (
                              <div key={idx} className={textClass}>
                                {l}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>



                {/* Integration Proposal Block (Rendered directly under the form for unified visibility) */}
                <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 space-y-5">
                  <div className="border-b border-slate-200 pb-3">
                    <h4 className="text-sm font-extrabold text-[#003366] uppercase tracking-tight flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#003366]" />
                      ĐỀ XUẤT KĨ THUẬT &amp; API SPEC ĐỒNG BỘ QUY MÔ LỚN (1-3 TRIỆU SIM)
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Thiết kế kiến trúc hệ thống, cơ chế lưu chuyển và đặc tả API giao tiếp giữa Vietsim và đối tác nhà mạng lớn (Viettel, Mobifone, VNSKY).
                    </span>
                  </div>

                  {/* ASCII Diagram Card */}
                  <div className="p-4 bg-slate-950 text-slate-100 rounded-xl font-mono text-[10px] space-y-1.5 overflow-x-auto shadow-inner border border-slate-800">
                    <div className="text-sky-400 font-bold border-b border-slate-800 pb-1 mb-2 tracking-wide uppercase flex items-center justify-between">
                      <span>SƠ ĐỒ HỆ THỐNG &amp; LUỒNG DỮ LIỆU (INCREMENTAL STREAM FLOW)</span>
                      <span className="text-[9px] bg-sky-500/10 px-1.5 py-0.5 rounded text-sky-300">ACTIVE LOGIC</span>
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

                  {/* Column Explanations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-slate-600 text-xs">
                    <div className="p-4 bg-white rounded-xl border border-slate-150 space-y-2 text-justify">
                      <span className="font-extrabold text-slate-900 block text-[12px] uppercase text-[#003366]">1. ĐỒNG BỘ QUY MÔ LỚN (1 - 3 TRIỆU SIM)</span>
                      <p className="leading-relaxed text-slate-500 text-[11px]">
                        Để đảm bảo tính toàn vẹn của ứng dụng đang triển khai trên môi trường containerized, phương pháp đồng bộ 1-3 triệu sim tuyệt đối tránh sử dụng các vòng lặp chèn bản ghi đơn lẻ (Single-Insert Row Loop). Thay vào đó, áp dụng các kỹ thuật cốt lõi sau:
                      </p>
                      <ul className="space-y-1.5 pt-1 text-[11px] text-slate-700">
                        <li className="flex gap-2">
                          <span className="text-[#003366] font-bold">•</span>
                          <span><strong>Bulk Insert Chunking:</strong> Gom các tập tin nạp thô vào các cụm mảng lớn rồi đẩy trực tiếp cho DB engine thực thi qua câu lệnh gộp, giảm tải I/O kết nối đến 99%.</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-[#003366] font-bold">•</span>
                          <span><strong>Bỏ qua khóa HMR &amp; Block Gateway:</strong> Server trả phản hồi JSON nhanh kèm <code>task_id</code> tạo ẩn, giải phóng luồng HTTP chính để tránh lỗi Gateway Timeout (504). Tiến trình nạp dữ liệu chạy ngầm dưới dạng Async Worker.</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-[#003366] font-bold">•</span>
                          <span><strong>Tự động làm sạch &amp; phân loại:</strong> Trực tiếp giải nén và tiền lọc dữ liệu đầu số rác trước khi lưu trữ PostgreSQL để giữ kho số luôn tinh gọn.</span>
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-slate-150 space-y-2 text-justify">
                      <span className="font-extrabold text-slate-900 block text-[12px] uppercase text-teal-700">2. ĐỒNG BỘ GIA TĂNG (INCREMENTAL SYNC)</span>
                      <p className="leading-relaxed text-slate-500 text-[11px]">
                        Chỉ fetch các SIM mới hoặc vừa được cập nhật kể từ phiên quét của đợt đồng bộ trước đó nhằm tiết kiệm băng thông và tài nguyên.
                      </p>
                      <ul className="space-y-1.5 pt-1 text-[11px] text-slate-700">
                        <li className="flex gap-2">
                          <span className="text-teal-600 font-bold">•</span>
                          <span><strong>Tham số theo dấu:</strong> Sử dụng query string <code>modified_after</code> hoặc <code>since</code> làm bộ định vị thời gian chênh lệch.</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-teal-600 font-bold">•</span>
                          <span><strong>Lục vết thông minh:</strong> Hệ thống tự động nhớ mốc thời gian gần nhất (lấy từ cột <code>last_synced_at</code> lớn nhất hiện có trong PostgreSQL).</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-teal-600 font-bold">•</span>
                          <span><strong>Đồng bộ Delta:</strong> Kỳ quét tiếp theo sẽ tự động gắn tham số <code>?since=ISOString</code> làm điều kiện lọc. Đối tác chỉ cần trả về những chiếc sim được sửa đổi/bổ sung sau thời điểm này.</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* API Spec Steps Table */}
                  <div className="space-y-2 pt-2 bg-white rounded-xl border border-slate-150 p-4 shadow-sm">
                    <span className="font-extrabold text-slate-800 text-xs block uppercase tracking-wide">3. MÔ TẢ LUỒNG GIAO TIẾP &amp; ĐẶC TẢ API KỸ THUẬT V VỚI ĐỐI TÁC</span>
                    <div className="overflow-x-auto text-[11px]">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-[#002244] text-white">
                          <tr>
                            <th className="px-3 py-2 font-bold text-left rounded-tl">Bước</th>
                            <th className="px-3 py-2 font-bold text-left">Tác Vụ Xử Lý</th>
                            <th className="px-3 py-2 font-bold text-left">Bên Cung Cấp API</th>
                            <th className="px-3 py-2 font-bold text-left">Endpoint kỹ thuật &amp; Đặc tả</th>
                            <th className="px-3 py-2 font-bold text-left rounded-tr">Hành động của Vietsim</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 bg-slate-50/50 leading-relaxed text-slate-700">
                          <tr>
                            <td className="px-3 py-2.5 font-bold font-mono text-slate-900">Step 1</td>
                            <td className="px-3 py-2.5 font-semibold text-slate-800">Xác thực hệ thống (Oauth Client Creds)</td>
                            <td className="px-3 py-2.5"><span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-1.5 py-0.5 rounded font-bold">NHÀ MẠNG / ĐỐI TÁC</span></td>
                            <td className="px-3 py-2.5">
                              <span className="text-emerald-700 font-bold block font-mono">POST /auth/token</span>
                              <span className="text-[9px] text-slate-500 block font-mono">Body: client_id, client_secret, grant_type</span>
                            </td>
                            <td className="px-3 py-2.5">Gửi credential và nhận JWT Access Token. Lưu an toàn vào bộ nhớ tạm.</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2.5 font-bold font-mono text-slate-900">Step 2</td>
                            <td className="px-3 py-2.5 font-semibold text-slate-800">Truy vấn lấy danh sách gia tăng (Incremental)</td>
                            <td className="px-3 py-2.5"><span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] px-1.5 py-0.5 rounded font-bold">NHÀ MẠNG / ĐỐI TÁC</span></td>
                            <td className="px-3 py-2.5">
                              <span className="text-[#003366] font-bold block font-mono">GET /sims/incremental</span>
                              <span className="text-[9px] text-slate-500 block font-mono">Params: since, limit=20000, page=1</span>
                            </td>
                            <td className="px-3 py-2.5">Gắn Bearer Token và tham số <code>since</code>. Thực thi phân trang đến khi hết dữ liệu.</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2.5 font-bold font-mono text-slate-900">Step 3</td>
                            <td className="px-3 py-2.5 font-semibold text-slate-800">Chỉ thị rà soát &amp; lưu vết Đánh dấu xóa</td>
                            <td className="px-3 py-2.5"><span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] px-1.5 py-0.5 rounded font-bold">VIETSIM CENTRAL</span></td>
                            <td className="px-3 py-2.5">
                              <span className="text-rose-700 font-bold block font-mono">INTERNAL DELTA PROCESSOR</span>
                              <span className="text-[9px] text-slate-500 block font-mono">Table Comparisons</span>
                            </td>
                            <td className="px-3 py-2.5">Đối chiếu dữ liệu feed, nếu SIM không tồn tại nữa thì soft-delete và đưa vào bảng <code>deleted_sims</code>.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )} ReplacementContent value matches initial.

            {/* Inbound sub-view: Web scraper / scheduler */}
            {inboundInnerTab === "scraper" && (
              <div className="space-y-5 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-850 uppercase tracking-wide flex items-center gap-1">
                        <span className="inline-block w-2.5 h-2.5 rounded bg-amber-500"></span>
                        TRÌNH BÒ THU THẬP &amp; HẸN GIỜ ĐỒNG BỘ NỀN (SCRAPER)
                      </h3>
                      <p className="text-slate-500 text-xs">
                        Bảo vệ kho số Vietsim luôn mới mẻ bằng cách quét tự động hoặc chủ động bóc tách từ cổng SimThangLong định kỳ bằng Worker ngầm trên máy chủ.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Địa chỉ web bóc tách mục tiêu:</label>
                        <input
                          type="url"
                          value={scraperUrl}
                          onChange={(e) => setScraperUrl(e.target.value)}
                          className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[#003366]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Giới hạn SIM cào nạp mỗi đợt:</label>
                        <input
                          type="number"
                          value={scraperLimit}
                          onChange={(e) => setScraperLimit(parseInt(e.target.value) || 10)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                        />
                      </div>
                    </div>

                    {/* Console Logger of Scraper */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Nhật ký tiến trình Scraper (Thời gian thực):</span>
                      <div className="bg-slate-950 font-mono text-[10px] text-slate-200 p-4 rounded-xl h-44 overflow-y-auto leading-relaxed border border-slate-800">
                        {scraperLogs.length === 0 ? (
                          <div className="text-slate-500 italic">Nhấn nút phát động để theo dõi luồng máy quét...</div>
                        ) : (
                          scraperLogs.map((log, index) => (
                            <div key={index} className={log.includes("[CRITICAL]") ? "text-rose-450" : log.includes("[Thành Công]") ? "text-emerald-400" : "text-slate-300"}>
                              {log}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleRunScraper}
                        disabled={isScraping}
                        className="bg-amber-500 hover:bg-amber-600 font-bold py-2.5 px-5 text-indigo-950 shadow rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <RefreshCw className={`w-4 h-4 ${isScraping ? "animate-spin" : ""}`} />
                        {isScraping ? "ĐANG CÀO BÓC TÁCH..." : "KÍCH HOẠT KIỂM DUYỆT BÓC TÁCH NGAY"}
                      </button>
                    </div>
                  </div>

                  <div className="bg-amber-50/50 rounded-2xl border border-amber-100 p-5 space-y-4">
                    <span className="text-xs font-bold text-amber-950 uppercase block flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-amber-600" /> TỰ ĐỘNG HÓA LỊCH CRON JOB:
                    </span>
                    <div className="text-[11px] text-amber-900/95 space-y-2.5 leading-relaxed">
                      <p>
                        💡 Hệ thống đã được cấu hình scheduler ngầm trên máy chủ Cloud Run. Tần suất hoạt động: <strong>{secrets.sync_schedule_period || "daily"}</strong> lúc <strong>{secrets.sync_schedule_hour || "02"}:00 AM</strong>.
                      </p>
                      <p>
                        Tiến trình scheduler sẽ tự quét và châm dữ liệu sạch ngầm, gửi báo cáo Delta bằng Email bảo mật cho ban quản trị Vietsim ngay khi cập nhật hoàn tất.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Inbound sub-view: Manual import */}
            {inboundInnerTab === "manual" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex flex-col md:flex-row gap-6 md:items-start">
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Nguồn danh mục SIM:</label>
                        <input 
                          type="text" 
                          value={manualSource}
                          onChange={(e) => setManualSource(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold"
                          placeholder="Nhập nguồn sỉ..."
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Cấu trúc phân tách:</label>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[10px] text-slate-500 leading-tight">
                          <code>[Số SIM], [Đơn Giá VND], [Nhà mạng], [Thể loại], [Trạng thái], [Ghi chú]</code>
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <textarea
                        value={manualText}
                        onChange={(e) => setManualText(e.target.value)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleFileDrop}
                        placeholder="Dán hoặc thả tệp CSV vào đây...&#10;0909.123.456, 12500000, Mobifone, Sảnh Tiến, Còn hàng, Sim thanh lý sỉ&#10;0912.888.888, 150000000, Vinaphone, Thất quý, Ngừng bán, Trả dọn đại lý"
                        className="w-full h-48 bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-[11px] leading-relaxed border border-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                      <div className="absolute right-3 bottom-3 text-[9px] text-slate-500 italic">
                        Kéo thả file .csv hoặc .txt để tự bóc tách text thô.
                      </div>
                    </div>

                    {manualMessage && (
                      <div className={`p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs flex gap-2 items-start ${
                        manualMessage.type === "error" ? "bg-red-50 border-red-100 text-red-700" : "bg-emerald-50 border-emerald-100 text-emerald-800"
                      }`}>
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>{manualMessage.text}</p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleManualSync}
                        disabled={isProcessingManual}
                        className="flex-1 bg-[#003366] hover:bg-[#002244] text-white py-2.5 px-4 rounded-xl font-bold text-xs tracking-wider transition-all disabled:opacity-60 cursor-pointer"
                      >
                        {isProcessingManual ? "Đang xử lý đồng bộ..." : "TIẾN HÀNH ĐỒNG BỘ THỦ CÔNG & ĐÁNH DẤU XOÁ"}
                      </button>

                      <button
                        onClick={handleDownloadTemplate}
                        className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-sky-600" /> Tải mẫu tệp Excel
                      </button>
                    </div>
                  </div>

                  <div className="w-full md:w-80 bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4 text-[11px] text-slate-500 leading-relaxed">
                    <span className="font-bold text-slate-800 block uppercase">Điều khoản & Lưu ý :</span>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Hệ thống làm sạch tự động, tách gạch chéo, dấu chấm bằng regex.</li>
                      <li>Nhận diện trạng thái <span className="text-red-600 font-bold">"Ngừng bán", "Ngừng kinh doanh", "Đã xóa", "Inactive"</span> để lọc, xoá khỏi kho sims chính và tự động sao lưu an toàn vào bảng deleted_sims.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================================= */}
        {/* =============== SUBTAB 2: OUTBOUND (Vietsim -> Đại lý) ================ */}
        {/* ======================================================================= */}
        {syncSubTab === "outbound" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="md:col-span-2 space-y-5">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    CỔNG API TRUY XUẤT KHO SỐ CHO ĐẠI LÝ PHÂN TIỂU (REST OUTBOUND)
                  </h3>
                  <p className="text-slate-500 text-xs">
                    Để cấp quyền cho đại lý hoặc website đối tác kéo kho số hiện có của Vietsim về trang của họ, hãy cung cấp cho đối tác API Endpoint dưới đây cùng với token bảo mật.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1 font-mono">BẢN ĐỒ ENDPOINT ĐỒNG BỘ CHUẨN (GET):</label>
                    <div className="flex items-center gap-2">
                      <div className="bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px] px-3 py-2.5 rounded-lg flex-1 overflow-x-auto whitespace-nowrap">
                        GET {window.location.origin}/api/partner/sims/sync
                      </div>
                      <button
                        onClick={() => handleCopy(`${window.location.origin}/api/partner/sims/sync`, "url")}
                        className="bg-slate-100 hover:bg-slate-200 border border-slate-200 p-2.5 rounded-lg text-slate-600 shrink-0 cursor-pointer"
                        title="Copy URL"
                      >
                        {copiedText === "url" ? <Check className="w-4 h-4 text-emerald-500 animate-pulse" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Mã Token xác thực kết nối:</label>
                      <input
                        type="text"
                        value={outboundApiKey}
                        onChange={(e) => setOutboundApiKey(e.target.value)}
                        className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-[#003366] font-semibold"
                        placeholder="Token đối tác..."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Trang phân trang (page):</label>
                      <input
                        type="number"
                        value={outboundPage}
                        onChange={(e) => setOutboundPage(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Giới hạn phần tử (limit):</label>
                      <input
                        type="number"
                        value={outboundLimit}
                        onChange={(e) => setOutboundLimit(Math.max(1, parseInt(e.target.value) || 10))}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                      />
                    </div>
                  </div>

                  {/* Test action trigger */}
                  <div className="pt-2">
                    <button
                      onClick={handleQueryOutboundAPI}
                      disabled={isQueryingOutbound}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 shadow rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Terminal className="w-4 h-4 text-emerald-250 animate-pulse" />
                      {isQueryingOutbound ? "ĐANG GỬI CUỘC GỌI MIỄN PHÍ CỦA ĐẠI LÝ..." : "TRUY VẤN THỬ NGHIỆM ĐẦU RA (SANDBOX RESPONSE)"}
                    </button>
                  </div>

                  {/* Mock Terminal Response Box */}
                  {outboundResult && (
                    <div className="space-y-1.5 animate-fadeIn">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Terminal phản hồi của Vietsim (JSON Response):</span>
                      <div className="bg-slate-900 border border-slate-800 text-slate-100 font-mono text-[11px] p-4 rounded-xl leading-relaxed max-h-64 overflow-y-auto">
                        <div className="text-slate-450 border-b border-slate-800 pb-1 flex justify-between items-center text-[10px] mb-2 font-mono">
                          <span>HTTP/1.1 {outboundResult.status} {outboundResult.statusText}</span>
                          <span className="text-sky-400">Response Object format</span>
                        </div>
                        <pre className="whitespace-pre-wrap">{JSON.stringify(outboundResult.payload, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
                <span className="text-xs font-bold text-slate-800 uppercase block flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4 text-indigo-500" /> Đặc tả dịch vụ cho đại ký:
                </span>
                <div className="text-[11px] text-slate-500 space-y-3 leading-relaxed text-justify">
                  <p>
                    <strong>Cánh cổng phân phối đại lý sỉ:</strong> Vietsim cung cấp gói JSON bao gồm dải số SIM, nhà mạng, phân loại phong thuỷ, giá gốc và <strong>tỷ lệ phần trăm chiết khấu trực tiếp (chiết khấu sỉ từ 15% - 20%)</strong> để đại lý tự cân đối biên lợi nhuận.
                  </p>
                  <p>
                    <strong>An toàn mạng:</strong> Mọi cuộc gọi truy cập bất hợp pháp không đính kèm đúng header hoặc tham số <code>apiKey</code> đúng sẽ nhận phản hồi mã an toàn lỗi <code className="bg-red-50 text-red-650 px-1 py-0.5 rounded font-mono text-[10px]">HTTP 403 Forbidden</code> nhằm bảo vệ trước robot rà quét phá hoại.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* =============== SUBTAB 3: HIGH SCALE SIMULATOR (1-3M) ================= */}
        {/* ======================================================================= */}
        {syncSubTab === "massive" && (
          <div className="space-y-6 animate-fadeIn text-slate-800">
            <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 text-white space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Cpu className="w-48 h-48 text-[#FFD700]" />
              </div>

              <div className="space-y-1 relative">
                <span className="text-[9px] font-mono text-[#FFD700] uppercase tracking-wider font-extrabold bg-[#FFD700]/10 px-2.5 py-1 rounded border border-[#FFD700]/20 w-max block">
                  HIGH-PERFORMANCE PERFORMANCE TESTING LAB
                </span>
                <h3 className="text-lg font-black tracking-tight text-white block">
                  Phòng Thử Nghiệm Kiến Trúc Đồng Bộ Quy Mô Lớn (1 - 3 Triệu SIM)
                </h3>
                <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                  Trực quan hiển thị giải pháp kỹ thuật lưu động đa luồng thông minh, cơ chế chia nhỏ chunk (batch insertion) và thuật toán Delta Soft-delete của Vietsim, giúp duy trì hiệu năng mượt mà, không lag, không downtime kể cả khi tải hàng triệu thuê bao.
                </p>
              </div>

              {/* Configurations Control Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block mb-2 font-bold uppercase flex items-center gap-1 font-mono">
                    <Sliders className="w-3.5 h-3.5 text-sky-400" /> 1. QUY MÔ KHO SIM CHỌN LỰC:
                  </span>
                  <div className="flex gap-2">
                    {[1000000, 2000000, 3000000].map(val => (
                      <button
                        key={val}
                        disabled={isSimulating}
                        onClick={() => setTotalSims(val)}
                        className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg border cursor-pointer transition ${
                          totalSims === val ? "bg-sky-500 border-sky-400 text-slate-900" : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750"
                        }`}
                      >
                        {val === 1000000 ? "1.000.000" : val === 2000000 ? "2.000.000" : "3.000.000"} SIM
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-2 font-bold uppercase flex items-center gap-1 font-mono">
                    <Database className="w-3.5 h-3.5 text-sky-400" /> 2. KÍCH THƯỚC PHÂN MẢNH CHUNK:
                  </span>
                  <div className="flex gap-2">
                    {[25000, 50000, 100000].map(val => (
                      <button
                        key={val}
                        disabled={isSimulating}
                        onClick={() => setChunkSize(val)}
                        className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg border cursor-pointer transition ${
                          chunkSize === val ? "bg-sky-500 border-sky-400 text-slate-900" : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750"
                        }`}
                      >
                        {val === 25000 ? "25.000" : val === 50000 ? "50.000" : "100.000"} SIM
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-2 font-bold uppercase flex items-center gap-1 font-mono">
                    <Cpu className="w-3.5 h-3.5 text-sky-400" /> 3. LỰC LƯỢNG WORKERS SONG SONG:
                  </span>
                  <div className="flex gap-2">
                    {[2, 4, 8].map(val => (
                      <button
                        key={val}
                        disabled={isSimulating}
                        onClick={() => setParallelWorkers(val)}
                        className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg border cursor-pointer transition ${
                          parallelWorkers === val ? "bg-sky-500 border-sky-400 text-slate-900" : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750"
                        }`}
                      >
                        {val} Workers
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress Slider animation rendering */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span className="text-slate-300">Tiến trình đồng bộ thực tế hệ thống:</span>
                  <span className="text-sky-400">{simProgress}%</span>
                </div>
                <div className="w-full bg-slate-850 h-3 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="bg-gradient-to-r from-sky-500 via-[#FFD700] to-emerald-400 h-full transition-all duration-300"
                    style={{ width: `${simProgress}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <button
                  onClick={startMassiveSimulation}
                  disabled={isSimulating}
                  className="bg-[#FFD700] hover:bg-[#FFE34E] text-[#001f3f] font-sans font-extrabold text-xs tracking-wider uppercase py-3.5 px-6 rounded-xl flex items-center gap-2 transition cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <Activity className={`w-4 h-4 ${isSimulating ? "animate-spin" : ""}`} />
                  {isSimulating ? "Mô Phỏng Đang Chạy..." : "BẮT ĐẦU MÔ PHỎNG TIẾN TRÌNH SIÊU TỐC"}
                </button>

                {/* Simulated Telemetry Stats Indicators */}
                <div className="flex gap-4 overflow-x-auto py-1 max-w-full font-mono text-[10px] text-slate-350 bg-black/45 px-4 py-2.5 rounded-xl border border-slate-800 shrink-0">
                  <div className="border-r border-slate-800 pr-3">
                    <span className="text-slate-500 block">THỜI GIAN:</span>
                    <strong className="text-sky-400 text-xs font-bold">{simStats.elapsed} s</strong>
                  </div>
                  <div className="border-r border-slate-800 pr-3 pl-1">
                    <span className="text-slate-500 block">TỐC ĐỘ GHI:</span>
                    <strong className="text-emerald-450 text-xs font-bold">{(simStats.speed || 0).toLocaleString()} SIM/s</strong>
                  </div>
                  <div className="border-r border-slate-800 pr-3 pl-1">
                    <span className="text-slate-500 block">BỘ NHỚ RAM:</span>
                    <strong className="text-amber-400 text-xs font-bold">{simStats.memory} MB</strong>
                  </div>
                  <div className="border-r border-slate-800 pr-3 pl-1">
                    <span className="text-slate-500 block">ĐÃ GHI SQL:</span>
                    <strong className="text-white text-xs font-bold">{simStats.processed.toLocaleString()}</strong>
                  </div>
                  <div className="pl-1">
                    <span className="text-slate-500 block">DELTA DELETES:</span>
                    <strong className="text-rose-400 text-xs font-bold">{simStats.softDeletes.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Simulated Micro Terminal Logs */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block font-mono flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-sky-400" /> WORKER PROCESS INTERACTIVE SHELL LOGS:
                </span>
                <div className="bg-black/80 font-mono text-[11px] text-emerald-400 p-4 rounded-xl h-52 overflow-y-auto leading-relaxed border border-slate-800 select-text">
                  {simLogs.length === 0 ? (
                    <div className="text-slate-500 italic">Nhấn nút "BẮT ĐẦU MÔ PHỎNG" phía trên để châm động cơ nạp...</div>
                  ) : (
                    simLogs.map((log, index) => (
                      <div 
                        key={index} 
                        className={
                          log.includes("HOÀN THÀNH") 
                            ? "text-emerald-305 font-black text-xs border-t border-slate-800 pt-2 mt-2" 
                            : log.includes("BƯỚC") 
                              ? "text-sky-300 font-bold" 
                              : log.includes("⚠️") || log.includes("deleted_sims")
                                ? "text-amber-300"
                                : "text-emerald-500/90"
                        }
                      >
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Architecture Explainer */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <span className="text-xs font-bold text-[#003366] uppercase block flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-emerald-500" /> GIẢI THÍCH CHI TIẾT GIẢI PHÁP TRIỂN KHAI CHO 1 - 3 TRIỆU SIMS TRÊN POSTGRESQL (DURABILITY AND SPEED)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-600 leading-relaxed text-justify">
                <div className="space-y-3.5">
                  <div>
                    <h5 className="font-bold text-slate-800">1. Không Sử Dụng Vòng Lặp Select/Insert Đơn Lẻ (Single Query Loops)</h5>
                    <p className="mt-1">
                      Khi cọ sát dữ liệu 1 - 3 triệu SIM, chèn từng dòng đơn sẽ sinh ra hàng triệu vòng quay kết nối (Network Roundtrips). Thay vào đó, nền tảng Vietsim gom dữ liệu thành các mảnh <strong>{chunkSize.toLocaleString()} bản ghi sỉ</strong> và đẩy trực tiếp bằng một câu SQL duy nhất:
                    </p>
                    <code className="bg-slate-200 text-[#003366] p-1.5 rounded block mt-2 font-mono text-[10px]">
                      db.insert(sims).values(chunkArray).onConflictDoUpdate(...)
                    </code>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800">2. Đè Trùng Lập Siêu Tốc (Upsert on Constraint)</h5>
                    <p className="mt-1">
                      Chúng tôi áp dụng ràng buộc duy nhất (Unique Index) trên cột <code>searchable_number</code> (số điện thoại chỉ giữ số). Khi phát sinh SIM trùng giá hoặc mạng, DB sẽ tự động ghi đè hoặc bỏ qua thời gian thực thông qua cơ chế <strong>ON CONFLICT</strong> của PostgreSQL mà không cần select thăm dò.
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <h5 className="font-bold text-slate-800">3. Sử Dụng Composite Index Cho Truy Vấn Phong Thuỷ & Đấu Giá</h5>
                    <p className="mt-1">
                      Thiết lập các khoá chỉ mục composite để tăng tốc thời gian tra cứu từ 4.2 giây xuống dưới <strong>12 milli-giây</strong>:
                    </p>
                    <pre className="bg-slate-200 text-slate-800 p-2 rounded block mt-1 font-mono text-[9px] leading-tight select-all">
{`CREATE INDEX idx_sims_searchable_number ON sims (searchable_number);
CREATE INDEX idx_sims_carrier_category_status ON sims (carrier, category, status);
CREATE INDEX idx_orders_customer_phone ON orders (customer_phone);`}
                    </pre>
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800">4. Delta Comparison Clean-up</h5>
                    <p className="mt-1">
                      Sử dụng truy vấn delta để kiểm soát tồn kho ngừng bán. Những SIM cũ có trong CSDL nhưng không xuất hiện trong lần nạp dữ liệu bulk sỉ mới nhất sẽ được dịch sang trạng thái ngừng kinh doanh và ghi dấu vết sang <code>deleted_sims</code> một lần duy nhất qua transaction, bảo vệ toàn vẹn tối đa.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================================= */}
        {/* =============== SUBTAB 4: TRACKING (deleted_sims History) ============= */}
        {/* ======================================================================= */}
        {syncSubTab === "tracking" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  HỒ SƠ TRUY VẾT &amp; KHÔI PHỤC SIM ĐÃ XÓA KHỎI KHO SỈ (DELETED_SIMS)
                </h3>
                <p className="text-slate-500 text-xs">
                  Hiển thị đầy đủ lịch sử các SIM đã dừng kinh doanh, bị dọn dẹp do chênh lệch Delta API với đối tác, hoặc nạp thủ công. Phục vụ cho đối soát công nợ &amp; chống thất lạc số.
                </p>
              </div>

              <button
                onClick={fetchDeletedSims}
                disabled={loadingDeleted}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-350 rounded-xl text-xs py-2 px-4 flex items-center gap-1.5 transition cursor-pointer font-bold text-slate-700"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingDeleted ? "animate-spin" : ""}`} /> Làm mới danh sách log
              </button>
            </div>

            {loadingDeleted ? (
              <div className="py-16 text-center flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-2 border-slate-300 border-t-[#003366] rounded-full animate-spin"></div>
                <p className="text-slate-500 font-mono text-[11px] mt-2 animate-pulse">Đang nạp kho logs từ bảng PostgreSQL [deleted_sims]...</p>
              </div>
            ) : deletedSims.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-12 border border-dashed border-slate-200 text-center space-y-2">
                <Trash2 className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-sans">Chưa có sim ngừng kinh doanh nào bị loại bỏ hoặc soft-deleted khỏi kho trong đợt quét gần đây.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs font-sans">
                    <thead className="bg-[#002244] text-slate-100 font-bold tracking-wider text-[11px]">
                      <tr>
                        <th className="px-4 py-3">Số Điện Thoại</th>
                        <th className="px-4 py-3">Nhà Mạng</th>
                        <th className="px-4 py-3">Đơn Giá Gốc</th>
                        <th className="px-4 py-3">Thể loại</th>
                        <th className="px-4 py-3">Nguồn Phát Sinh</th>
                        <th className="px-4 py-3">Thời gian loại bỏ</th>
                        <th className="px-4 py-3">User đồng bộ</th>
                        <th className="px-4 py-3">Lý do dọn dẹp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {deletedSims.map((sim) => (
                        <tr key={sim.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-4 py-3 font-bold font-mono text-[13px] text-slate-900">{sim.number}</td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-700">{sim.carrier}</span>
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-slate-700">
                            {sim.price?.toLocaleString("vi-VN")} đ
                          </td>
                          <td className="px-4 py-3 text-slate-500">{sim.category}</td>
                          <td className="px-4 py-3">
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-indigo-100 font-mono">
                              {sim.syncSource || "Thủ công"}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                            {sim.deletedAt ? new Date(sim.deletedAt).toLocaleString("vi-VN") : "N/A"}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-slate-600 flex items-center gap-1 font-semibold text-[11px]">
                              <User className="w-3.5 h-3.5 text-sky-500 shrink-0" /> {sim.syncUser || "Admin"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-red-100 font-sans">
                              {sim.reason || "Ngừng kinh doanh"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================================= */}
        {/* =============== SUBTAB 5: DOCUMENTATION & FLOWS ======================= */}
        {/* ======================================================================= */}
        {syncSubTab === "docs" && (
          <div className="space-y-6 animate-fadeIn text-slate-800">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                ĐỀ XUẤT KĨ THUẬT &amp; API SPEC ĐỒNG BỘ QUY MÔ LỚN (1-3 TRIỆU SIM)
              </h3>
              <p className="text-slate-500 text-xs">
                Thiết kế kiến trúc hệ thống, cơ chế lưu chuyển và đặc tả API giao tiếp giữa Vietsim và đối tác nhà mạng lớn (Viettel, Mobifone, VNSKY).
              </p>
            </div>

            {/* SƠ ĐỒ LOGIC */}
            <div className="p-5 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                <span className="text-sky-400 font-bold uppercase tracking-wider text-[11px]">SƠ ĐỒ HỆ THỐNG &amp; LUỒNG DỮ LIỆU (INCREMENTAL STREAM FLOW)</span>
                <span className="bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded text-[10px]">PROD READY</span>
              </div>
              <pre className="overflow-x-auto text-[10px] leading-relaxed text-slate-300">
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

            {/* CHI TIẾT ĐỀ XUẤT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 leading-relaxed">
              {/* Mục 1 */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-900 block uppercase mb-1 flex items-center gap-1.5">
                    <span className="bg-indigo-100 text-indigo-700 w-5 h-5 rounded-md flex items-center justify-center text-[10px]">1</span>
                    1. ĐỒNG BỘ QUY MÔ LỚN (1 - 3 TRIỆU SIM)
                  </h4>
                  <p className="text-slate-500 text-[11px] mb-3">
                    Để đảm bảo tính toàn vẹn của ứng dụng đang triển khai trên môi trường containerized, phương pháp đồng bộ 1-3 triệu sim tuyệt đối tránh sử dụng các vòng lặp chèn bản ghi đơn lẻ (Single-Insert Row Loop). Thay vào đó, áp dụng các kỹ thuật cốt lõi sau:
                  </p>
                  <ul className="space-y-2 mt-2 text-[11.5px] text-justify text-slate-700">
                    <li className="flex gap-2">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span><strong>Bulk Insert Chunking (Phân mảnh tối đa 100.000 bản ghi):</strong> Gom các tập tin nạp thô vào các cụm mảng lớn rồi đẩy trực tiếp cho DB engine thực thi qua câu lệnh gộp, giảm tải I/O kết nối đến 99%.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span><strong>Bỏ qua khóa HMR &amp; Block Gateway:</strong> Server trả phản hồi JSON nhanh kèm <code>task_id</code> tạo ẩn, giải phóng luồng HTTP chính để tránh lỗi Gateway Timeout (504). Tiến trình nạp dữ liệu chạy ngầm dưới dạng Async Worker.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span><strong>Tự động làm sạch &amp; phân loại:</strong> Trực tiếp giải nén và tiền lọc dữ liệu đầu số rác trước khi lưu trữ PostgreSQL để giữ kho số luôn tinh gọn và đẹp.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Mục 2 */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-900 block uppercase mb-1 flex items-center gap-1.5">
                    <span className="bg-emerald-100 text-emerald-700 w-5 h-5 rounded-md flex items-center justify-center text-[10px]">2</span>
                    2. ĐỒNG BỘ GIA TĂNG (INCREMENTAL SYNC)
                  </h4>
                  <p className="text-slate-500 text-[11px] mb-3">
                    Chỉ fetch các SIM mới hoặc vừa được cập nhật kể từ phiên quét của đợt đồng bộ trước đó nhằm tiết kiệm cực kỳ nhiều băng thông và tài nguyên máy chủ.
                  </p>
                  <ul className="space-y-2 mt-2 text-[11.5px] text-justify text-slate-700">
                    <li className="flex gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span><strong>Tham số theo dấu:</strong> Sử dụng query string <code>modified_after</code> hoặc <code>since</code> để định danh khoảng thời gian dữ liệu biến đổi.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span><strong>Cơ chế ghi nhớ thông minh:</strong> Hệ thống tự động ghi nhớ mốc thời gian gần nhất (lấy dữ liệu từ cột <code>last_synced_at</code> lớn nhất hiện có trong cơ sở dữ liệu).</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span><strong>Fetch thông minh:</strong> Kỳ quét tiếp theo sẽ tự động gắn tham số <code>?since=ISOString</code> làm điều kiện lọc. Đối tác lúc này chỉ cần trả về những chiếc sim được sửa đổi/bổ sung sau thời điểm này.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* REST API specs table */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-[#003366] uppercase flex items-center gap-1.5">
                <span className="bg-[#003366] text-white w-5 h-5 rounded-md flex items-center justify-center text-[10px]">3</span>
                3. MÔ TẢ LUỒNG GIAO TIẾP &amp; ĐẶC TẢ API KỸ THUẬT VỚI ĐỐI TÁC
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs shadow-sm">
                <div className="overflow-x-auto font-sans">
                  <table className="min-w-full divide-y divide-slate-200 text-left">
                    <thead className="bg-[#002244] text-white">
                      <tr>
                        <th className="px-4 py-3 text-[11px] uppercase tracking-wider font-extrabold">Bước</th>
                        <th className="px-4 py-3 text-[11px] uppercase tracking-wider font-extrabold">Tác Vụ Xử Lý</th>
                        <th className="px-4 py-3 text-[11px] uppercase tracking-wider font-extrabold">Bên Cung Cấp API</th>
                        <th className="px-4 py-3 text-[11px] uppercase tracking-wider font-extrabold">Endpoint kỹ thuật &amp; Đặc tả</th>
                        <th className="px-4 py-3 text-[11px] uppercase tracking-wider font-extrabold">Hành động của Vietsim</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[11.5px] bg-white leading-relaxed">
                      <tr>
                        <td className="px-4 py-3 font-bold text-slate-800 font-mono">Step 1</td>
                        <td className="px-4 py-3 font-semibold text-slate-700">Xác thực hệ thống (Oauth Client Creds)</td>
                        <td className="px-4 py-3"><span className="bg-amber-50 text-amber-800 border border-amber-200 rounded px-1.5 py-0.5 font-bold text-[10px]">NHÀ MẠNG / ĐỐI TÁC</span></td>
                        <td className="px-4 py-3 text-slate-900 font-mono text-[11px]">
                          <span className="text-emerald-700 font-bold block">POST /auth/token</span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">Body: client_id, client_secret, grant_type</span>
                        </td>
                        <td className="px-4 py-3 text-slate-650">Gửi credential nhà mạng và nhận JWT Access Token. Lưu an toàn vào bộ nhớ tạm (Cache/Memory Session).</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-bold text-slate-800 font-mono">Step 2</td>
                        <td className="px-4 py-3 font-semibold text-slate-700">Truy vấn lấy danh sách gia tăng (Incremental)</td>
                        <td className="px-4 py-3"><span className="bg-amber-50 text-amber-800 border border-amber-200 rounded px-1.5 py-0.5 font-bold text-[10px]">NHÀ MẠNG / ĐỐI TÁC</span></td>
                        <td className="px-4 py-3 text-slate-900 font-mono text-[11px]">
                          <span className="text-blue-700 font-bold block">GET /sims/incremental</span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">Params: since, limit=20000, page=1</span>
                        </td>
                        <td className="px-4 py-3 text-slate-650">Gắn Bearer Token và tham số <code>since</code> của lần đồng bộ trước. Thực thi phân trang đến khi quét sạch toàn bộ dữ liệu feed mới.</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-bold text-slate-800 font-mono">Step 3</td>
                        <td className="px-4 py-3 font-semibold text-slate-700">Chỉ thị rà soát &amp; lưu vết Đánh dấu xóa</td>
                        <td className="px-4 py-3"><span className="bg-indigo-50 text-indigo-800 border border-indigo-200 rounded px-1.5 py-0.5 font-bold text-[10px]">VIETSIM CENTRAL</span></td>
                        <td className="px-4 py-3 text-slate-900 font-mono text-[11px]">
                          <span className="text-rose-700 font-bold block">INTERNAL DELTA PROCESSOR</span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">Table: sims vs. deleted_sims</span>
                        </td>
                        <td className="px-4 py-3 text-slate-650">Phát hiện các SIM không còn mặt trong feed sỉ mới. Soft delete bằng cách đưa thông tin SIM đối soát qua bảng lưu trữ <code>deleted_sims</code>, giải phóng kho số phục vụ khách mua lẻ.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

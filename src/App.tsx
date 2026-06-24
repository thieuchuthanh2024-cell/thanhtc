import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import SimSearch from "./components/SimSearch";
import AIConsultant from "./components/AIConsultant";
import OrdersView from "./components/OrdersView";
import AgentProfileView from "./components/AgentProfileView";
import ReportsView from "./components/ReportsView";
import ManualView from "./components/ManualView";
import SimsSyncView from "./components/SimsSyncView";
import PackagesAdminView from "./components/PackagesAdminView";
import SqlAdminView from "./components/SqlAdminView";
import CheckoutModal from "./components/CheckoutModal";
import AuthModal from "./components/AuthModal";
import VietsimLogo from "./components/VietsimLogo";
import { SimCard, Order, AgentProfile, AgentRole, OrderStatus } from "./types";
import { AlertCircle, ArrowUpRight, HelpCircle, Phone, Sparkles } from "lucide-react";

export default function App() {
  // Operational Mode (🔒 Production by default vs 🛠️ Simulation)
  const [isProductionMode, setIsProductionMode] = useState<boolean>(true);
  const [allowSimulation, setAllowSimulation] = useState<boolean>(true);
  const [loggedInAgent, setLoggedInAgent] = useState<AgentProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  
  const [simulatedRole, setSimulatedRole] = useState<AgentRole>("Khách hàng");
  const [activeTab, setActiveTab] = useState<string>("search");
  
  // Data States
  const [sims, setSims] = useState<SimCard[]>([]);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch security configuration on mount
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.allowSimulation === "boolean") {
          setAllowSimulation(data.allowSimulation);
          if (!data.allowSimulation) {
            setIsProductionMode(true);
            setSimulatedRole("Khách hàng");
          }
        }
      })
      .catch((err) => console.error("Error loading secure configuration:", err));
  }, []);

  // Derived current role & agent profiles based on chosen Mode
  const activeRole: AgentRole = isProductionMode
    ? (loggedInAgent?.role || "Khách hàng")
    : simulatedRole;

  const currentAgent: AgentProfile | null = isProductionMode
    ? loggedInAgent
    : (agents.find((a) => a.role === simulatedRole) || null);

  // Checkout modal control
  const [selectedSimForCheckout, setSelectedSimForCheckout] = useState<SimCard | null>(null);

  // Fetch core datasets on launch
  const refreshAll = async () => {
    setLoading(true);
    try {
      // 1. Fetch SIM cards
      const resSims = await fetch("/api/sims");
      if (resSims.ok) {
        const data = await resSims.json();
        setSims(data);
      }

      // 2. Fetch Agents
      const resAgents = await fetch("/api/agents");
      if (resAgents.ok) {
        const data = await resAgents.json();
        setAgents(data);
      }

      // 3. Fetch Orders
      const resOrders = await fetch("/api/orders");
      if (resOrders.ok) {
        const data = await resOrders.json();
        setOrders(data);
      }

      // 4. Fetch Pending Count
      const resPending = await fetch("/api/orders/pending-count");
      if (resPending.ok) {
        const pData = await resPending.json();
        setPendingCount(pData.count || 0);
      }
    } catch (err) {
      console.error("Critical error fetching full-stack state lists", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, [activeRole]);

  // Checkout submit handler
  const handleCheckoutSubmit = async (orderData: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    paymentMethod: "momo" | "vietqr" | "vnpay";
    packageId?: string;
  }) => {
    const payload = {
      simId: selectedSimForCheckout?.id,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerAddress: orderData.customerAddress,
      paymentMethod: orderData.paymentMethod,
      agentId: currentAgent?.id || undefined, // link agent context if not retail
      packageId: orderData.packageId,
    };

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errPayload = await response.json();
      throw new Error(errPayload.error || "Không thể khởi tạo hóa đơn giao dịch.");
    }

    const result = await response.json();
    return result.order;
  };

  // Simulate payment callback verification
  const handleSimulatePayment = async (orderId: string) => {
    const response = await fetch(`/api/orders/${orderId}/simulate-payment`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error("API cổng thanh toán phản hồi thất bại.");
    }
    // refresh internal state
    await refreshAll();
  };

  // Update order workflow status
  const handleUpdateOrderStatus = async (id: string, status: OrderStatus, paymentStatus?: string) => {
    const response = await fetch(`/api/orders/${id}/update-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, paymentStatus }),
    });
    if (response.ok) {
      await refreshAll();
    }
  };

  // Import raw text / CSV sims lists
  const handleImportSims = async (textData: string) => {
    const response = await fetch("/api/sims/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textData }),
    });
    if (!response.ok) {
      throw new Error("Lỗi API import kho số.");
    }
    const result = await response.json();
    await refreshAll();
    return result;
  };

  // Register / update agent configuration
  const handleUpdateAgentProfile = async (agent: AgentProfile) => {
    const response = await fetch("/api/agents/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(agent),
    });
    if (response.ok) {
      await refreshAll();
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] text-slate-800 selection:bg-[#003366] selection:text-white" id="main-layout">
      {/* Visual Navigation header and Role sandbox toggler */}
      <Navbar
        activeRole={activeRole}
        currentAgent={currentAgent}
        onChangeRole={(role) => {
          setSimulatedRole(role);
          if (role === "Khách hàng") {
            setActiveTab("search");
          } else {
            setActiveTab("orders");
          }
        }}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        cartCount={pendingCount}
        isProductionMode={isProductionMode}
        onChangeMode={(prod) => {
          setIsProductionMode(prod);
          // If moving into production, default back to Guest customer unless already logged in
          if (prod) {
            setSimulatedRole("Khách hàng");
            if (!loggedInAgent) {
              setActiveTab("search");
            }
          }
        }}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={() => {
          setLoggedInAgent(null);
          setSimulatedRole("Khách hàng");
          setActiveTab("search");
        }}
        allowSimulation={allowSimulation}
      />

      {/* Main dashboard viewport */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && sims.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400 space-y-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-[#003366] rounded-full animate-spin"></div>
            <p className="text-xs font-bold font-sans">
              Đang đồng bộ cơ sở dữ liệu sỉ lẻ tổng kho ĐẠI LÝ SIM...
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-fadeIn" id="app-viewport">
            
            {/* Quick-routing info strip showing active capabilities */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span className="text-xs font-bold text-slate-600 font-sans">
                  {isProductionMode ? (
                    loggedInAgent ? (
                      `🔒 ĐÃ ĐĂNG NHẬP THÀNH CÔNG: Chào mừng đối tác ${loggedInAgent.name} (Quyền: ${loggedInAgent.role} - Chiết khấu sỉ: ${(loggedInAgent.discountRate * 100).toFixed(0)}%)`
                    ) : (
                      "🌐 CHẾ ĐỘ CHẠY THỰC TẾ (PRODUCTION): Đang hiển thị giá niêm yết bán lẻ cho khách vãng lai."
                    )
                  ) : (
                    `🛠️ CHẾ ĐỘ MÔ PHỎNG VAI TRÒ (SIMULATION): Đang truy cập dữ liệu dưới quyền ảo của "${activeRole}"`
                  )}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab("search")}
                  className="text-xs font-bold text-slate-500 hover:text-[#003366] flex items-center gap-1 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" /> Kho sim
                </button>
                <span className="text-slate-350">|</span>
                <button
                  onClick={() => setActiveTab("ai-consult")}
                  className="text-xs font-bold text-slate-500 hover:text-[#003366] flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Luận quẻ AI
                </button>
              </div>
            </div>

            {/* TAB INTERFACE ROUTING VIEWPORT */}
            <div id="tab-holder">
              {activeTab === "search" && (
                <SimSearch
                  activeRole={activeRole}
                  currentAgent={currentAgent}
                  onBookSim={setSelectedSimForCheckout}
                  onRefreshStock={refreshAll}
                  sims={sims}
                  onImportSims={handleImportSims}
                />
              )}

              {activeTab === "ai-consult" && (
                <AIConsultant onBookSim={setSelectedSimForCheckout} availableSims={sims} />
              )}

              {activeTab === "orders" && (
                <OrdersView
                  activeRole={activeRole}
                  orders={orders}
                  onUpdateStatus={handleUpdateOrderStatus}
                  onRefreshOrders={refreshAll}
                />
              )}

              {activeTab === "agents" && (
                <AgentProfileView
                  activeRole={activeRole}
                  onChangeRole={setSimulatedRole}
                  agents={agents}
                  onUpdateAgent={handleUpdateAgentProfile}
                />
              )}

              {activeTab === "sims-sync" && activeRole === "Admin" && (
                <SimsSyncView onRefreshStock={refreshAll} currentAgent={currentAgent} />
              )}

              {activeTab === "packages-admin" && activeRole === "Admin" && (
                <PackagesAdminView />
              )}

              {activeTab === "sql-admin" && activeRole === "Admin" && (
                <SqlAdminView />
              )}

              {activeTab === "reports" && <ReportsView />}

              {activeTab === "guide" && activeRole === "Admin" && <ManualView />}
            </div>
          </div>
        )}
      </main>

      {/* 4. Footer Brand disclaimer */}
      <footer className="bg-[#001f3f] text-slate-400 py-6 border-t border-blue-900/60" id="main-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-2.5">
          <div className="flex items-center justify-center gap-2">
            <VietsimLogo className="w-7 h-7 drop-shadow-md shrink-0" />
            <span className="font-sans font-black text-white text-sm">VIET<span className="text-[#FFD700]">SIM</span></span>
          </div>
          <p className="text-xs max-w-md mx-auto leading-relaxed">
            Hệ thống đại lý phân phối, tra cứu sim số đẹp lớn nhất Việt Nam.
          </p>
          <div className="text-[10px] text-slate-500 font-mono italic">
            © 2026 Sim Agency system. Powered by VPAVNTA
          </div>
        </div>
      </footer>

      {/* Dynamic Modal checkout controller */}
      {selectedSimForCheckout && (
        <CheckoutModal
          sim={selectedSimForCheckout}
          activeRole={activeRole}
          agentId={currentAgent?.id}
          onClose={() => setSelectedSimForCheckout(null)}
          onSubmitOrder={handleCheckoutSubmit}
          onSimulatePayment={handleSimulatePayment}
        />
      )}

      {/* Authentication Gateway */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={(agent) => {
            setLoggedInAgent(agent);
            setSimulatedRole(agent.role);
            // Default routing when authenticating successfully
            if (agent.role === "Admin") {
              setActiveTab("agents");
            } else {
              setActiveTab("orders");
            }
          }}
        />
      )}
    </div>
  );
}

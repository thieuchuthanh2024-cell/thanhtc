"use client";

import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { LineChart, Line } from "recharts";
import { TrendingUp, Award, DollarSign, PieChart as PieIcon, RefreshCw, Layers } from "lucide-react";

interface ReportsData {
  totalRevenue: number;
  completedSales: number;
  activeBookings: number;
  orderCount: number;
  carrierChart: Array<{ name: string; value: number; count: number }>;
  agentChart: Array<{ id: string; name: string; role: string; sales: number; commission: number }>;
  timelineChart: Array<{ name: string; revenue: number }>;
}

export default function ReportsView() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/reports");
      if (response.ok) {
        const payload = await response.json();
        setData(payload);
      }
    } catch (err) {
      console.error("Error fetching report summaries", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const COLORS = ["#EF4444", "#3B82F6", "#F59E0B", "#F97316", "#14B8A6", "#6366F1"];

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 flex flex-col justify-center items-center h-[500px]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#003366] rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-slate-500 animate-pulse text-wrap">
          Đang tổng hợp số liệu doanh thu từ kho SIM nhà mạng toàn quốc...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-100 text-center">
        <p className="text-sm font-semibold text-red-600">Đã xảy ra lỗi khi tính toán tổng số liệu.</p>
        <button
          onClick={fetchReports}
          className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer"
        >
          Thử tải lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="reports-view-panel">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#003366] via-[#002244] to-[#001f3f] rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-l-4 border-[#FFD700]">
        <div>
          <span className="bg-white/10 px-3 py-1 rounded-sm text-[10px] font-extrabold uppercase tracking-widest text-[#FFD700]">
            Hệ Thống Phân Tích Doanh Thu Toàn Quốc (BI REPORT)
          </span>
          <h2 className="text-2xl sm:text-3xl font-sans font-black tracking-tight mt-1">
            Báo Cáo Hoạt Động Đại Lý &amp; Kho Số
          </h2>
          <p className="text-xs text-blue-100 mt-1">
            Đồng bộ dữ liệu thời gian thực từ API nhà mạng và trạng thái xử lý cổng thanh toán.
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="bg-white/10 hover:bg-white/15 px-4 py-2 rounded-xl text-xs text-slate-100 border border-white/20 flex items-center justify-center gap-1.5 cursor-pointer font-bold shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" /> Làm tươi báo cáo
        </button>
      </div>

      {/* 2. Visual Aggregations metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-banner-row">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Doanh thu Đã Thu
            </span>
            <h4 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {data.totalRevenue.toLocaleString("vi-VN")} <span className="text-xs font-normal">đ</span>
            </h4>
            <span className="text-[10px] text-emerald-500 font-bold block">
              ↑ Khớp GD thành công
            </span>
          </div>
          <div className="w-12 h-12 bg-emerald-100/50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5 stroke-3" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Doanh số Toàn hệ thống
            </span>
            <h4 className="text-xl sm:text-2xl font-black text-indigo-950 tracking-tight">
              {data.completedSales.toLocaleString("vi-VN")} <span className="text-xs font-normal">đ</span>
            </h4>
            <span className="text-[10px] text-indigo-500 font-bold block">
              Dựa trên giá bán lẻ gốc
            </span>
          </div>
          <div className="w-12 h-12 bg-indigo-100/50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 stroke-3" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Đơn đang xử lý / nợ treo
            </span>
            <h4 className="text-xl sm:text-2xl font-black text-amber-950 tracking-tight">
              {data.activeBookings.toLocaleString("vi-VN")} <span className="text-xs font-normal">đ</span>
            </h4>
            <span className="text-[10px] text-amber-600 font-bold block">
              Chờ duyệt giao thẻ
            </span>
          </div>
          <div className="w-12 h-12 bg-amber-100/50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 stroke-3" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Tổng số lượng đơn
            </span>
            <h4 className="text-xl sm:text-2xl font-black text-rose-950 tracking-tight">
              {data.orderCount} <span className="text-xs font-normal">giao dịch</span>
            </h4>
            <span className="text-[10px] text-slate-400 block font-normal leading-none pt-0.5">
              Từ ứng dụng &amp; đối tác
            </span>
          </div>
          <div className="w-12 h-12 bg-rose-100/50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Recharts Graphics Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="charts-mesh">
        
        {/* Playback timeline card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs lg:col-span-2 space-y-4">
          <div>
            <h4 className="font-sans font-bold text-slate-800 text-sm">Biểu Đồ Xu Hướng Doanh Thu</h4>
            <p className="text-[11px] text-slate-400">Tăng trưởng dòng tiền ròng thực nhận qua các tháng</p>
          </div>

          <div className="h-[280px] w-full">
            {data.timelineChart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Chưa phát sinh dòng tiền thành công
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timelineChart}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${val.toLocaleString("vi-VN")} đ`, "Thu nhập ròng"]}
                    labelFormatter={(label) => `Tháng: ${label}`}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Carrier volume pie chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs lg:col-span-1 space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="font-sans font-bold text-slate-800 text-sm">Cơ Cấu SIM Theo Nhà Mạng</h4>
            <p className="text-[11px] text-slate-400">Thị phần phân phối và độ chuộng số thuê bao</p>
          </div>

          <div className="h-[180px] w-full relative flex items-center justify-center">
            {data.carrierChart.length === 0 ? (
              <div className="text-xs text-slate-400">Chưa có cơ cấu bán</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.carrierChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.carrierChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `${value.toLocaleString("vi-VN")} đ`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Color legends representing distinct entities */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 pt-2 border-t border-slate-50">
            {data.carrierChart.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded shrink-0"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                ></span>
                <span className="truncate">
                  {item.name}: {((item.value / data.completedSales) * 100 || 0).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. Agent Performance ranking leaderboard table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="analytics-table">
        <div className="px-6 py-4 border-b border-slate-150">
          <h4 className="font-sans font-bold text-slate-800 text-sm">Bảng Xếp Hạng Kết Quả Bán Hàng Của Đối Tác</h4>
          <p className="text-[11px] text-slate-400">Khen thưởng hoa hồng, sỉ doanh số từ cao xuống thấp</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-100">
                <th className="px-6 py-3.5 font-bold">Thứ hạng</th>
                <th className="px-6 py-3.5 font-bold">Thành viên Đại lý</th>
                <th className="px-6 py-3.5 font-bold">Vai trò cấp</th>
                <th className="px-6 py-3.5 font-bold">Tổng doanh thu bán lẻ gốc</th>
                <th className="px-6 py-3.5 font-bold">Chiết khấu thực lãnh (Hoa hồng)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {data.agentChart
                .sort((a, b) => b.sales - a.sales)
                .map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-black text-slate-800 text-sm">
                      #{idx + 1}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                        {item.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {item.sales.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">
                      {item.commission.toLocaleString("vi-VN")} đ
                    </td>
                  </tr>
                ))}
              {data.agentChart.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-400 text-xs font-semibold">
                    Hiện chưa phát sinh doanh số đại lý liên kết.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

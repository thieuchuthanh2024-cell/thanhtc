import React, { useState } from "react";
import { Database, ShieldAlert, Play, Trash2, HelpCircle, CheckCircle2, AlertTriangle, TableProperties } from "lucide-react";

const PRESETS = [
  { label: "Xem 10 SIM mới nhất", sql: "SELECT * FROM sims ORDER BY created_at DESC LIMIT 10;" },
  { label: "Xem 10 đơn hàng gần đây", sql: "SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;" },
  { label: "Xem danh sách các nhà mạng", sql: "SELECT * FROM networks;" },
  { label: "Xem danh sách gói cước", sql: "SELECT * FROM packages;" },
  { label: "Xem cấu hình hệ thống (system_configs)", sql: "SELECT * FROM system_configs;" },
  { label: "Thống kê số đơn hàng theo trạng thái", sql: "SELECT status, COUNT(*) as sl FROM orders GROUP BY status;" },
];

export default function SqlAdminView() {
  const [password, setPassword] = useState("");
  const [query, setQuery] = useState("SELECT * FROM sims LIMIT 10;");
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [results, setResults] = useState<any[]>([]);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Vui lòng nhập mật khẩu quản trị viên để tiếp tục.");
      return;
    }
    if (password !== "Thanh@admin") {
      setError("Mật khẩu quản trị viên không chính xác!");
      return;
    }
    if (!query.trim()) {
      setError("Vui lòng nhập câu lệnh SQL muốn thực thi.");
      return;
    }

    setExecuting(true);
    setError(null);
    setSuccess(false);
    setResults([]);
    setRowCount(null);
    setFields([]);
    const startTime = Date.now();

    try {
      const response = await fetch("/api/admin/execute-sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, query }),
      });

      const data = await response.json();
      const elapsed = Date.now() - startTime;
      setExecutionTime(elapsed);

      if (!response.ok || !data.success) {
        setError(data.error || "Có lỗi xảy ra khi thực thi câu lệnh SQL.");
      } else {
        setSuccess(true);
        setResults(data.rows || []);
        setRowCount(data.rowCount);
        setFields(data.fields || []);
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi kết nối tới server.");
    } finally {
      setExecuting(false);
    }
  };

  const handlePresetSelect = (sql: string) => {
    setQuery(sql);
    setError(null);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setRowCount(null);
    setFields([]);
    setError(null);
    setSuccess(false);
    setExecutionTime(null);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6" id="sql-admin-panel">
      {/* Header title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 font-sans tracking-tight">
              Trung Tâm Quản Trị SQL Cơ Sở Dữ Liệu
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Thực thi các câu lệnh SQL trực tiếp trên cơ sở dữ liệu PostgreSQL On-Premise.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-medium font-sans">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          Chế độ Admin Tối Cao
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-4 flex gap-3 text-amber-900 text-xs">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold font-sans">CẢNH BÁO AN TOÀN TRUY CẬP TRỰC TIẾP (DIRECT DATABASE DANGER ZONE)</p>
          <p className="font-sans text-amber-800 leading-relaxed">
            Các câu lệnh tác động trực tiếp như <code className="bg-amber-100 px-1 rounded font-mono font-bold">UPDATE</code>,{" "}
            <code className="bg-amber-100 px-1 rounded font-mono font-bold">DELETE</code> hoặc{" "}
            <code className="bg-amber-100 px-1 rounded font-mono font-bold">DROP</code> có thể gây mất mát dữ liệu vĩnh viễn và không thể khôi phục. 
            Vui lòng kiểm tra kỹ cú pháp trước khi chạy. Mật khẩu xác thực bắt buộc: <code className="bg-amber-200 px-1 py-0.5 rounded font-mono font-bold text-amber-950">Thanh@admin</code>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input panel - Left column */}
        <div className="lg:col-span-8 space-y-4">
          <form onSubmit={handleExecute} className="space-y-4">
            {/* Query Textarea */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 font-sans flex items-center justify-between">
                <span>Nhập câu lệnh SQL:</span>
                <span className="text-[10px] text-slate-400 font-mono">Định dạng chuẩn PostgreSQL</span>
              </label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nhập câu lệnh SQL vào đây..."
                rows={6}
                className="w-full bg-slate-900 text-emerald-400 font-mono text-sm p-4 rounded-2xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
              />
            </div>

            {/* Authentication password field */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700 font-sans block">Xác thực quyền thực thi:</span>
                <span className="text-[10px] text-slate-500 font-sans block">Nhập mật khẩu an toàn hệ thống để mở khóa DB</span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto shrink-0">
                <input
                  type="password"
                  placeholder="Mật khẩu Admin..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white border border-slate-200 text-xs rounded-xl px-3 py-2 w-full sm:w-48 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
                />
                <button
                  type="submit"
                  disabled={executing}
                  className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
                >
                  {executing ? (
                    <>
                      <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      Đang chạy...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Thực thi SQL
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Preset list - Right column */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs font-bold text-slate-600 font-sans flex items-center gap-1">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            Các câu lệnh mẫu nhanh (Presets):
          </span>
          <div className="grid grid-cols-1 gap-2">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetSelect(p.sql)}
                className="w-full text-left bg-slate-50 hover:bg-amber-50/50 hover:border-amber-200 p-2.5 rounded-xl border border-slate-100 text-[11px] font-sans text-slate-700 transition-all cursor-pointer flex flex-col justify-center"
              >
                <span className="font-bold text-slate-800">{p.label}</span>
                <code className="text-[9px] text-slate-400 truncate mt-0.5 font-mono">{p.sql}</code>
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="w-full bg-slate-100 hover:bg-slate-200 p-2.5 rounded-xl border border-slate-200 text-[11px] font-sans font-bold text-slate-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Làm sạch bàn phím & kết quả
            </button>
          </div>
        </div>
      </div>

      {/* Status section & Results Table */}
      {(error || success || executing) && (
        <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/20 shadow-xs space-y-4 p-4 animate-fadeIn">
          {/* Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-700 font-sans flex items-center gap-1.5">
              <TableProperties className="w-4 h-4 text-slate-400" />
              Trạng thái phản hồi từ Cơ sở dữ liệu:
            </span>
            <div className="flex gap-2 text-[10px] font-mono">
              {executionTime !== null && (
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  Thời gian: {executionTime}ms
                </span>
              )}
              {rowCount !== null && (
                <span className="bg-[#003366]/10 text-[#003366] px-2 py-0.5 rounded font-bold">
                  Bản ghi ảnh hưởng: {rowCount}
                </span>
              )}
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-3 text-xs font-mono whitespace-pre-wrap">
              ❌ LỖI: {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-900 rounded-xl p-3 text-xs flex items-center gap-2 font-sans font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Thực thi câu lệnh SQL hoàn thành thành công rực rỡ!
            </div>
          )}

          {/* Table display */}
          {success && results.length > 0 ? (
            <div className="overflow-x-auto border border-slate-100 rounded-xl max-h-[450px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-mono text-[10px] uppercase">
                    <th className="px-3 py-2 border-r border-slate-200">#</th>
                    {Object.keys(results[0]).map((key) => (
                      <th key={key} className="px-3 py-2 border-r border-slate-200 font-bold whitespace-nowrap">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="font-mono text-xs divide-y divide-slate-150">
                  {results.map((row, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/10 transition-colors">
                      <td className="px-3 py-1.5 bg-slate-50/50 border-r border-slate-250 text-[10px] text-slate-400 text-center font-bold">
                        {idx + 1}
                      </td>
                      {Object.keys(row).map((key) => {
                        const val = row[key];
                        let renderedVal = "";
                        if (val === null) {
                          renderedVal = "NULL";
                        } else if (typeof val === "object") {
                          renderedVal = JSON.stringify(val);
                        } else {
                          renderedVal = String(val);
                        }
                        return (
                          <td key={key} className="px-3 py-1.5 border-r border-slate-200 max-w-xs truncate text-slate-800" title={renderedVal}>
                            {val === null ? (
                              <span className="text-slate-300 italic">NULL</span>
                            ) : (
                              renderedVal
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            success && results.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400 font-sans italic">
                (Câu lệnh không trả về tập kết quả dữ liệu hoặc danh sách rỗng)
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

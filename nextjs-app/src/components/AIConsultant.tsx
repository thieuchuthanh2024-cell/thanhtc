"use client";

import React, { useState } from "react";
import { Sparkles, Send, Bot, User, Phone, Check, RefreshCw, AlertCircle, ShoppingCart } from "lucide-react";
import { ChatMessage, SimCard } from "@/types";

interface AIConsultantProps {
  onBookSim: (sim: SimCard) => void;
  availableSims: SimCard[];
}

export default function AIConsultant({ onBookSim, availableSims }: AIConsultantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "model",
      text: "Xin kính chào quý khách! Tôi là trợ lý ảo Phong Thủy Số Học, cố vấn chọn SIM số đẹp đỉnh cao. Hãy cho tôi biết năm sinh, mệnh của bạn hoặc những mong nguyện về sự nghiệp để tôi tính toán bát tự ngũ hành và giới thiệu những SIM đẹp đại lộc nhất đang có trong kho!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput("");
    
    const userMsg: ChatMessage = {
      id: "usr-" + Date.now(),
      role: "user",
      text: userText,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Call our backend API route
      const response = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!response.ok) throw new Error("Chưa kết nối được với Trợ lý AI.");

      const data = await response.json();
      
      // Parse recommended ids if any, e.g. [RECOMMENDED_IDS:v1,v2]
      let replyText = data.reply || "";
      let recommendedSims: string[] = [];

      const match = replyText.match(/\[RECOMMENDED_IDS:([^\]]+)\]/);
      if (match) {
        recommendedSims = match[1].split(",").map(id => id.trim()).filter(Boolean);
        // Strip the special code from the displayed text to keep the talk extremely neat!
        replyText = replyText.replace(/\[RECOMMENDED_IDS:[^\]]+\]/, "");
      }

      setMessages([
        ...updatedMessages,
        {
          id: "bot-" + Date.now(),
          role: "model",
          text: replyText.trim(),
          recommendedSims: recommendedSims.filter(id => id),
          recommendedSimsDetails: data.recommendedSimsDetails || [],
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages([
        ...updatedMessages,
        {
          id: "bot-err-" + Date.now(),
          role: "model",
          text: "Hệ thống AI đang quá tải phân tích quẻ dịch. Bạn có thể sử dụng bộ lọc số bên tab Tra cứu, hoặc đặt câu hỏi đơn giản hơn về Năm sinh / Nhà mạng / Ngân sách tại đây!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Quick prompt presets
  const applyPreset = (text: string) => {
    setInput(text);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-150 overflow-hidden flex flex-col h-[650px]" id="ai-chat-box">
      {/* AI banner */}
      <div className="bg-gradient-to-r from-[#003366] to-[#001f3f] p-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 border border-blue-500/35 rounded-xl flex items-center justify-center text-[#FFD700] animate-pulse">
            <Sparkles className="w-5 h-5 fill-[#FFD700]/20" />
          </div>
          <div>
            <h3 className="font-sans font-extrabold text-base tracking-tight flex items-center gap-1.5 text-slate-50">
              Chuyên Gia Phong Thủy Số Học AI
            </h3>
            <p className="text-[11px] text-blue-200 tracking-wide font-mono">
              Giải quẻ Ngũ hành bát tự • Đề xuất SIM kho thực tế
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setMessages([
              {
                id: "init",
                role: "model",
                text: "Kho số vừa được làm tươi quẻ dịch cát khí! Quý khách sinh năm bao nhiêu, hoạt động kinh doanh gì và thích chuỗi đuôi số điện thoại nào để tôi bắt đầu luận giải thần số học?",
              },
            ]);
          }}
          className="text-xs font-semibold text-indigo-300 hover:text-white flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg border border-slate-700 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Khởi động lại
        </button>
      </div>

      {/* Messages layout */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/70" id="chat-scroller">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 max-w-4xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
            {/* Avatar block */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
              msg.role === "user" 
                ? "bg-[#003366] text-slate-100" 
                : "bg-gradient-to-br from-[#003366] to-[#001f3f] text-[#FFD700]"
            }`}>
              {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className="space-y-2">
              <div className={`p-4 rounded-xl text-sm leading-relaxed ${
                msg.role === "user" 
                  ? "bg-[#003366] text-white rounded-tr-none font-medium" 
                  : "bg-white text-slate-800 border border-slate-200 shadow-sm rounded-tl-none whitespace-pre-wrap"
              }`}>
                {msg.text}
              </div>

              {/* Parsed Recommended SIM cards block */}
              {msg.recommendedSims && msg.recommendedSims.length > 0 && (
                <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 space-y-3 max-w-md animate-fadeIn shadow-xs">
                  <span className="text-xs font-bold text-blue-900 font-mono tracking-wider block uppercase mb-1">
                    🎯 SIM cát khí phong thủy tốt đang có sẵn trong kho:
                  </span>
                  <div className="space-y-2.5">
                    {msg.recommendedSims.map((id) => {
                      const sim = msg.recommendedSimsDetails?.find((s) => s.id === id) || availableSims.find((s) => s.id === id);
                      if (!sim) return null;
                      return (
                        <div key={sim.id} className="bg-white border border-slate-100 rounded-lg p-3 flex justify-between items-center shadow-xs">
                          <div className="space-y-0.5">
                            <span className="text-[10px] bg-blue-100 text-[#003366] px-1.5 py-0.5 font-extrabold rounded">
                              {sim.carrier}
                            </span>
                            <p className="font-sans font-black text-lg text-slate-900 tracking-tight">
                              {sim.number}
                            </p>
                            <span className="text-[10px] text-slate-400 font-semibold italic">
                              Hàng {sim.category} • Tổng {sim.sum} nút
                            </span>
                          </div>
                          <div className="text-right space-y-2">
                            <p className="font-sans font-extrabold text-sm text-[#003366]">
                              {sim.price.toLocaleString("vi-VN")} đ
                            </p>
                            <button
                              onClick={() => onBookSim(sim)}
                              className="bg-[#003366] hover:bg-blue-800 text-white text-[10px] px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <ShoppingCart className="w-3" /> Mua ngay
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-4xl mr-auto">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-amber-200 flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white text-slate-500 border border-slate-200 shadow-sm rounded-2xl rounded-tl-none p-4 text-xs font-semibold flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
              <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
              <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
              Đang luận quẻ bát tự & tính căn tìm số...
            </div>
          </div>
        )}
      </div>

      {/* Preset click options */}
      <div className="px-6 py-3 border-t border-slate-100 flex flex-wrap gap-2 bg-white shrink-0">
        <span className="text-[11px] font-bold text-slate-400 self-center uppercase font-mono mr-1">
          Hỏi nhanh:
        </span>
        {[
          "Tôi sinh năm Canh Thìn 2000 mạng Kim, xin sim phù hợp tài lộc dưới 10M",
          "Tìm sim Viettel đuôi Lộc Phát tiến lên đắc lộc?",
          "Sim nào là dòng VIP nhất kho số phong thủy?",
          "Tìm sim có số nút từ 70 đến 90 cho doanh nghiệp",
        ].map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => applyPreset(preset)}
            className="text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200/50 transition-colors cursor-pointer text-ellipsis overflow-hidden"
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Input controls form */}
      <form onSubmit={sendMessage} className="p-4 bg-slate-50 border-t border-slate-100 shrink-0 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi về tuổi tác bản mệnh, hành Mộc/Kim/Hỏa, nhà mạng, đầu số..."
          className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#003366]"
          id="ai-user-textbox"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="bg-[#003366] hover:bg-blue-800 disabled:bg-slate-350 text-white px-5 rounded-lg cursor-pointer font-bold transition-all flex items-center justify-center-span cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

import { NextResponse } from "next/server";
import { db } from "@/db";
import { sims } from "@/db/schema";
import { eq, and, or, gte, lte, like, desc, asc, sql } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import { analyzeFengShui, getNguHanhByYear } from "@/utils/phongthuyEngine";

function formatSimNumber(numStr: string): string {
  const clean = numStr.replace(/\D/g, "");
  if (clean.length === 10) {
    return `${clean.slice(0, 4)}.${clean.slice(4, 7)}.${clean.slice(7)}`;
  }
  return clean;
}

function parseConsultationParams(text: string) {
  const textLower = text.toLowerCase();
  
  // 1. Parse Birth Year
  let birthYear: number | undefined;
  const yearMatch = text.match(/\b(19\d{2}|20\d{2})\b/);
  if (yearMatch) {
    birthYear = parseInt(yearMatch[1], 10);
  }

  // 2. Parse Carrier
  let carrier: string | undefined;
  if (textLower.includes("viettel") || textLower.includes("viettell")) {
    carrier = "Viettel";
  } else if (textLower.includes("mobi") || textLower.includes("mobifone")) {
    carrier = "Mobifone";
  } else if (textLower.includes("vina") || textLower.includes("vinaphone")) {
    carrier = "Vinaphone";
  } else if (textLower.includes("vietnamobile")) {
    carrier = "Vietnamobile";
  } else if (textLower.includes("wintel")) {
    carrier = "Wintel";
  } else if (textLower.includes("itelecom")) {
    carrier = "Itelecom";
  }

  // 3. Parse Price Ranges
  let maxPrice: number | undefined;
  let minPrice: number | undefined;

  const duoiTrieuMatch = textLower.match(/(?:dưới|không quá|tối đa|dưới\s*tầm|nhỏ hơn|ít hơn)\s*(\d+(?:\.\d+)?)\s*(?:triệu|tr|m)/);
  if (duoiTrieuMatch) {
    maxPrice = parseFloat(duoiTrieuMatch[1]) * 1000000;
  } else {
    const duoiTramMatch = textLower.match(/(?:dưới|không quá|tối đa)\s*(\d+)\s*(?:trăm|k)/);
    if (duoiTramMatch) {
      maxPrice = parseInt(duoiTramMatch[1], 10) * (textLower.includes("trăm") ? 100000 : 1000);
    } else {
      const generalTrieuMatch = textLower.match(/(\d+(?:\.\d+)?)\s*(?:triệu|tr|m)/);
      if (generalTrieuMatch) {
        const val = parseFloat(generalTrieuMatch[1]) * 1000000;
        minPrice = Math.max(0, val - val * 0.4);
        maxPrice = val + val * 0.4;
      } else {
        const kMatch = textLower.match(/(\d+)\s*k/);
        if (kMatch) {
          const val = parseInt(kMatch[1], 10) * 1000;
          minPrice = Math.max(0, val - val * 0.4);
          maxPrice = val + val * 0.4;
        }
      }
    }
  }

  // 4. Parse Category
  let category: string | undefined;
  if (textLower.includes("tứ quý") || textLower.includes("tu quy")) {
    category = "Tứ Quý";
  } else if (textLower.includes("ngũ quý") || textLower.includes("ngu quy")) {
    category = "Ngũ Quý";
  } else if (textLower.includes("tam hoa") || textLower.includes("tam hoa")) {
    category = "Tam Hoa";
  } else if (textLower.includes("lộc phát") || textLower.includes("loc phat") || textLower.includes("6886") || textLower.includes("8668")) {
    category = "Lộc Phát";
  } else if (textLower.includes("thần tài") || textLower.includes("than tai")) {
    category = "Thần Tài";
  } else if (textLower.includes("sảnh tiến") || textLower.includes("sanh tien")) {
    category = "Sảnh Tiến";
  } else if (textLower.includes("sim taxi") || textLower.includes("taxi")) {
    category = "Sim Taxi";
  }

  // 5. Parse digits sequence
  let digits: string | undefined;
  const duoiDigitsMatch = textLower.match(/(?:đuôi|chứa|số đuôi|kết thúc bằng|tìm số)\s*([0-9\*]+)/);
  if (duoiDigitsMatch) {
    digits = duoiDigitsMatch[1].replace(/\*/g, "");
  }

  return { birthYear, carrier, minPrice, maxPrice, category, digits };
}

export async function POST(request: Request) {
  try {
    const { messages, userPreferences } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing message contexts" }, { status: 400 });
    }

    const lastUserQuestion = messages[messages.length - 1]?.text || "";
    const parsedText = lastUserQuestion + " " + messages.slice(-3).map(m => m.text).join(" ");
    const { birthYear, carrier, minPrice, maxPrice, category, digits } = parseConsultationParams(parsedText);

    // Build smart database conditions list
    const conditions: any[] = [eq(sims.status, "Còn hàng")];

    if (carrier) {
      conditions.push(eq(sql`lower(${sims.carrier})`, carrier.toLowerCase()));
    }

    if (category) {
      conditions.push(eq(sims.category, category));
    }

    if (minPrice && minPrice > 0) {
      conditions.push(gte(sims.price, minPrice));
    }
    if (maxPrice && maxPrice > 0) {
      conditions.push(lte(sims.price, maxPrice));
    }

    if (digits && digits.length > 0) {
      conditions.push(like(sims.searchableNumber, `%${digits}%`));
    }

    // Apply favorable list of digits matching Feng Shui elements representing Birth Year
    if (birthYear) {
      const yearInfo = getNguHanhByYear(birthYear);
      const userMenh = yearInfo.menh;
      let targetDigits: string[] = [];
      if (userMenh === "Kim") {
        targetDigits = ["2", "5", "8", "6", "7"];
      } else if (userMenh === "Thủy") {
        targetDigits = ["6", "7", "1"];
      } else if (userMenh === "Mộc") {
        targetDigits = ["1", "3", "4"];
      } else if (userMenh === "Hỏa") {
        targetDigits = ["3", "4", "9", "0"];
      } else if (userMenh === "Thổ") {
        targetDigits = ["9", "0", "2", "5", "8"];
      }

      if (targetDigits.length > 0) {
        conditions.push(or(...targetDigits.map(d => like(sims.searchableNumber, `%${d}`))));
      }
    }

    // Perform selective DB queries from the 3 million records
    let availableSims = await db.select().from(sims).where(and(...conditions)).orderBy(desc(sims.isHot), desc(sims.sum)).limit(80);

    // Relax conditions if results are low
    if (availableSims.length < 8) {
      const relaxedConditions: any[] = [eq(sims.status, "Còn hàng")];
      if (carrier) relaxedConditions.push(eq(sql`lower(${sims.carrier})`, carrier.toLowerCase()));
      if (maxPrice) relaxedConditions.push(lte(sims.price, maxPrice * 1.5));
      
      if (birthYear) {
        const yearInfo = getNguHanhByYear(birthYear);
        const userMenh = yearInfo.menh;
        let targetDigits: string[] = [];
        if (userMenh === "Kim") targetDigits = ["2", "5", "8", "6", "7"];
        else if (userMenh === "Thủy") targetDigits = ["6", "7", "1"];
        else if (userMenh === "Mộc") targetDigits = ["1", "3", "4"];
        else if (userMenh === "Hỏa") targetDigits = ["3", "4", "9", "0"];
        else if (userMenh === "Thổ") targetDigits = ["9", "0", "2", "5", "8"];

        if (targetDigits.length > 0) {
          relaxedConditions.push(or(...targetDigits.map(d => like(sims.searchableNumber, `%${d}`))));
        }
      }

      const relaxedSims = await db.select().from(sims).where(and(...relaxedConditions)).orderBy(desc(sims.sum)).limit(80);
      availableSims = [...availableSims, ...relaxedSims];
      const seen = new Set();
      availableSims = availableSims.filter(s => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      });
    }

    // Secondary fallback
    if (availableSims.length < 5) {
      const globalSims = await db.select().from(sims).where(eq(sims.status, "Còn hàng")).orderBy(desc(sims.isHot)).limit(50);
      availableSims = [...availableSims, ...globalSims];
      const seen = new Set();
      availableSims = availableSims.filter(s => {
        if (seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      });
    }

    // Run local Feng Shui annotations
    const annotatedSims = availableSims.map(s => {
      const pt = analyzeFengShui(s.number, birthYear);
      return {
        id: s.id,
        number: s.number,
        carrier: s.carrier,
        category: s.category,
        price: s.price,
        formattedPrice: `${s.price.toLocaleString("vi-VN")}đ`,
        score: pt.score,
        nut: pt.nut,
        nguHanhSim: pt.nguHanhSim,
        nguHanhMenh: pt.nguHanhMenh,
        tuongSinhStatus: pt.tuongSinhStatus,
        queDichName: pt.queDichName,
        queDichDesc: pt.queDichDesc,
        tags: pt.auspiciousTags
      };
    });

    // Sort SIM recommendations
    let sortedRecommendations = [...annotatedSims];
    if (birthYear) {
      sortedRecommendations.sort((a, b) => b.score - a.score || a.price - b.price);
    } else {
      sortedRecommendations.sort((a, b) => (b.score + (b.nut * 0.1)) - (a.score + (a.nut * 0.1)) || a.price - b.price);
    }

    // Filter by carrier
    const lastUserQuestionLower = lastUserQuestion.toLowerCase();
    if (lastUserQuestionLower.includes("viettel") || lastUserQuestionLower.includes("viettell")) {
      sortedRecommendations = sortedRecommendations.filter(s => s.carrier === "Viettel");
    } else if (lastUserQuestionLower.includes("mobi") || lastUserQuestionLower.includes("mobifone")) {
      sortedRecommendations = sortedRecommendations.filter(s => s.carrier === "Mobifone");
    } else if (lastUserQuestionLower.includes("vina") || lastUserQuestionLower.includes("vinaphone")) {
      sortedRecommendations = sortedRecommendations.filter(s => s.carrier === "Vinaphone");
    }

    // Local consultation report generator fallback
    const createLocalConsultResponse = () => {
      let replyText = `### 🔮 BẢN TIN PHONG THỦY ĐỊNH MỆNH & TƯ VẤN SIM SỐ ĐẸP (LOCAL ENGINE C)\n`;
      replyText += `*(Đang chạy trên Động Cơ Điện Toán Phong Thuỷ độc lập và an toàn tuyệt đối)*\n\n`;
      
      if (birthYear) {
        const info = getNguHanhByYear(birthYear);
        replyText += `**Phân tích bản mệnh:** Quý khách sinh năm **${birthYear}** (${info.menhChiTiet}).\n`;
        replyText += `- **Hành tương hợp vượng phát:** Các con số và dòng SIM thuộc hành **${info.menh === "Kim" ? "Thổ & Kim" : info.menh === "Thủy" ? "Kim & Thủy" : info.menh === "Mộc" ? "Thủy & Mộc" : info.menh === "Hỏa" ? "Mộc & Hỏa" : "Hỏa & Thổ"}** được coi là cát khí hộ mệnh song toàn.\n\n`;
      } else {
        replyText += `Quý khách hiện chưa cung cấp năm sinh để bình giải chi tiết Ngũ hành tương hợp. Tôi xin phép chấm điểm Phong thủy tổng quan Kinh dịch và Số nút các SIM vượng tài lộc tốt nhất tại kho Vietsim:\n\n`;
      }

      const topSims = sortedRecommendations.slice(0, 3);
      if (topSims.length > 0) {
        replyText += `#### ✨ Đề xuất những SIM lý tưởng hàng đầu dành riêng cho quý khách:\n\n`;
        topSims.forEach((s, idx) => {
          replyText += `${idx + 1}. **SIM ${formatSimNumber(s.number)}** (${s.carrier} - *${s.category}*)\n`;
          replyText += `   - **Mức giá:** ${s.formattedPrice}\n`;
          replyText += `   - **Điểm số:** **${s.score}/10** | **${s.nut}/10 nút** đại cát.\n`;
          replyText += `   - **Ngũ Hành SIM / Thể:** Cung **${s.nguHanhSim}** ${birthYear ? `(Tương tác: ${s.tuongSinhStatus})` : ""}.\n`;
          replyText += `   - **Quẻ Kinh Dịch:** *${s.queDichName}* (${s.queDichDesc}).\n`;
          if (s.tags.length > 0) {
            replyText += `   - **Thế số phụ cát:** ${s.tags.map(t => `\`${t}\``).join(", ")} mang ý nghĩa thịnh vượng bền bỉ.\n`;
          }
          replyText += `\n`;
        });
        
        replyText += `\n**Lời khuyên chuyên môn:** Quý khách nên chọn SIM có số nút cao (từ 8 đến 10) và mang quẻ cát/đại cát để thu hút trường khí thịnh vượng, hanh thông mưu sự lớn.`;
        replyText += `\n\n[RECOMMENDED_IDS:${topSims.map(s => s.id).join(",")}]`;
      } else {
        replyText += `Hiện tại các dòng số phù hợp trực tiếp với tiêu chí tạm thời chưa xuất hiện trong kho chính thức trực tuyến. Quý khách có thể sử dụng bộ lọc tìm kiếm nâng cao hoặc thu hẹp dải giá để khám phá thêm hàng nghìn số khác.\n`;
      }
      return replyText;
    };

    // Slice to top 15 highest rating candidates to keep the AI context compact and fully tailored
    const aiCandidates = sortedRecommendations.slice(0, 15);

    // System prompt reinforced with pre-calculated, local mathematical facts
    const systemPrompt = `Bạn là Chuyên gia Phong Thủy số học và Tư vấn Sim hàng đầu Việt Nam, hỗ trợ khách hàng tìm kiếm Sim đẹp, Sim lộc phát, Sim thần tài hợp mệnh từ kho số đại lý.
    Dưới đây là một số dòng SIM ĐANG CÒN HÀNG trong kho số đã được Động cơ Phong thủy Local chấm điểm, giải quẻ và tính ngũ hành chính xác 100%:
    ${JSON.stringify(aiCandidates.map(s => ({
      id: s.id,
      phone: s.number,
      carrier: s.carrier,
      category: s.category,
      price: s.formattedPrice,
      localFengShuiScore: s.score,
      totalNuts: s.nut,
      nguHanh: s.nguHanhSim,
      hexagram: s.queDichName,
      hexagramMeaning: s.queDichDesc,
      auspiciousTags: s.tags.join(", ")
    })), null, 2)}

    YÊU CẦU ĐỐI VỚI VAI TRÒ CHUYÊN GIA PHONG THỦY:
    1. Tư vấn lịch sự, chuẩn mực, giàu kiến thức phong thủy sâu sắc dựa trên các THÔNG SỐ TOÁN HỌC PHONG THỦY thực tế đã được cung cấp ở trên.
    2. Hãy lấy thông tin chấm điểm phong thủy, số nút, ngũ hành và quẻ dịch của từng số trong danh sách để tư vấn cho người dùng. TUYỆT ĐỐI KHÔNG tự bịa (hallucinate) ra điểm số hoặc quẻ dịch khác so với danh sách đã phân tích sẵn.
    3. Trích cử chính xác 1 đến 3 số Sim tốt nhất cho nhu cầu của khách hàng, giải thích tại sao nó hợp phong thủy của họ (Ví dụ: đối chiếu ngũ hành năm sinh khách hàng với ngũ hành sim, vinh thăng số nút cao, giải nghĩa quẻ cát tường).
    4. Để hệ thống hiển thị số Sim trực quan bằng thẻ, hãy đưa các "id" của số Sim bạn khuyên dùng vào trong mảng JSON nằm ở dòng cuối cùng của phản hồi với định dạng đặc biệt sau:
       [RECOMMENDED_IDS:id1,id2]
       (Thay id1, id2 bằng các "id" thực tế như "v1", "v2" v.v trong kho số. Hết sức lưu ý KHÔNG viết thừa hay thiếu ký tự trống).
    5. Nếu khách hàng không cung cấp năm sinh, hãy khuyến khích họ cung cấp để bình giải tương hợp chính xác, đồng thời tư vấn phong thủy chung dựa trên số nút và linh số Kinh Dịch 80.`;

    const apiKey = process.env.GEMINI_API_KEY;
    let reply = "";

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "") {
      reply = createLocalConsultResponse();
    } else {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
        
        const formattedContents = messages.map((msg: any) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }]
        }));

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            { role: "user", parts: [{ text: systemPrompt }] },
            ...formattedContents
          ]
        });

        reply = response.text || "";
        if (!reply) {
          reply = createLocalConsultResponse();
        }
      } catch (apiErr) {
        console.warn("Exception during Gemini request inside Next.js, falling back locally:", apiErr);
        reply = createLocalConsultResponse();
      }
    }

    // Parse RECOMMENDED_IDS from reply and populate recommendedSimsDetails using full database entries
    let recommendedSimsDetails: any[] = [];
    const match = reply.match(/\[RECOMMENDED_IDS:([^\]]+)\]/);
    if (match) {
      const ids = match[1].split(",").map(id => id.trim()).filter(Boolean);
      recommendedSimsDetails = availableSims.filter(s => ids.includes(s.id));
    }

    return NextResponse.json({
      reply,
      recommendedSimsDetails
    });
  } catch (err: any) {
    console.error("General Next.js AI Consultation Error:", err);
    return NextResponse.json({ error: "Hệ thống tư vấn phong thủy đang bận. Xin vui lòng thử lại!" }, { status: 500 });
  }
}

/**
 * HỆ THỐNG ĐỘNG CƠ PHONG THỦY SỐ HỌC (LOCAL FENG SHUI ENGINE) — NEXT.JS VERSION
 * Phục vụ cho kiến trúc lai Hybrid (Option C) - Chạy hoàn toàn độc lập và không phụ thuộc API
 */

export interface FengShuiReport {
  score: number;             // Thang điểm 10
  nut: number;               // Số nút (1 - 10)
  nguHanhSim: string;        // Ngũ hành của SIM (Kim, Mộc, Thủy, Hỏa, Thổ)
  nguHanhMenh: string;       // Ngũ hành hợp tuổi người xem (nếu có cung cấp năm sinh)
  tuongSinhStatus: string;   // Trạng thái tương tác ngũ hành (Tương Sinh, Hòa Hợp, Sinh Xuất, Khắc Nhập, Khắc Xuất, Bình Hòa)
  queDichName: string;       // Tên quẻ (Cát / Đại Cát / Bình Hòa / Hung)
  queDichDesc: string;       // Ý nghĩa giải nghĩa quẻ Kinh Dịch / Số học
  auspiciousTags: string[];  // Các thẻ số đẹp (Lộc phát, Thần tài, Tứ quý...)
  detailedAnalysis: string[];// Các dòng phân tích chi tiết sâu sắc
}

// 1. Bản đồ năm sinh dương lịch sang Ngũ Hành
export function getNguHanhByYear(year: number): { menh: string; menhChiTiet: string } {
  const map: { [key: number]: { menh: string; menhChiTiet: string } } = {
    0: { menh: "Kim", menhChiTiet: "Bạch Lạp Kim (Vàng trong nến)" },
    1: { menh: "Kim", menhChiTiet: "Bạch Lạp Kim (Vàng trong nến)" },
    2: { menh: "Thủy", menhChiTiet: "Tuyền Trung Thủy (Nước trong suối)" },
    3: { menh: "Thủy", menhChiTiet: "Tuyền Trung Thủy (Nước trong suối)" },
    4: { menh: "Hỏa", menhChiTiet: "Sơn Đầu Hỏa (Lửa trên núi)" },
    5: { menh: "Hỏa", menhChiTiet: "Sơn Đầu Hỏa (Lửa trên núi)" },
    6: { menh: "Thổ", menhChiTiet: "Ốc Thượng Thổ (Đất trên mái nhà)" },
    7: { menh: "Thổ", menhChiTiet: "Ốc Thượng Thổ (Đất trên mái nhà)" },
    8: { menh: "Mộc", menhChiTiet: "Tùng Bách Mộc (Gỗ cây tùng bách)" },
    9: { menh: "Mộc", menhChiTiet: "Tùng Bách Mộc (Gỗ cây tùng bách)" },
  };

  const canMap: { [key: string]: number } = { "Giáp": 1, "Ất": 1, "Bính": 2, "Đinh": 2, "Mậu": 3, "Kỷ": 3, "Canh": 4, "Tân": 4, "Nhâm": 5, "Quý": 5 };
  const chiMap: { [key: string]: number } = { "Tý": 0, "Sửu": 0, "Ngọ": 0, "Mùi": 0, "Dần": 1, "Mão": 1, "Thân": 1, "Dậu": 1, "Thìn": 2, "Tỵ": 2, "Tuất": 2, "Hợi": 2 };
  
  const cans = ["Canh", "Tân", "Nhâm", "Quý", "Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ"];
  const chis = ["Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi"];
  
  const can = cans[year % 10];
  const chi = chis[year % 12];
  
  let val = (canMap[can] || 0) + (chiMap[chi] || 0);
  if (val > 5) val -= 5;
  
  const elements = ["", "Kim", "Thủy", "Hỏa", "Thổ", "Mộc"];
  const menh = elements[val] || "Thổ";
  
  const detailMap: { [key: string]: string } = {
    "Kim": "Vàng bạc, tài quý, cát lộc hanh thông",
    "Mộc": "Cây cối sinh sôi, vững bền tráng kiện",
    "Thủy": "Nước chảy nguồn thâm, trí tuệ sâu rộng",
    "Hỏa": "Lửa rực thăng tinh, nhiệt huyết hào dũng",
    "Thổ": "Đất mẹ bao dung, điền sản vượng địa"
  };
  
  return {
    menh,
    menhChiTiet: `${can} ${chi} - Mệnh ${menh} (${detailMap[menh]})`
  };
}

// 2. Tra cứu Ngũ Hành của số điện thoại dựa trên con số đuôi cuối cùng
export function getNguHanhOfSim(simNumber: string): string {
  const cleanNum = simNumber.replace(/\D/g, "");
  if (!cleanNum) return "Thổ";
  const lastDigit = parseInt(cleanNum[cleanNum.length - 1]);
  
  if (lastDigit === 1) return "Thủy";
  if (lastDigit === 2 || lastDigit === 5 || lastDigit === 8) return "Thổ";
  if (lastDigit === 3 || lastDigit === 4) return "Mộc";
  if (lastDigit === 6 || lastDigit === 7) return "Kim";
  return "Hỏa"; // 9, 0
}

// 3. Quy luật tương sinh tương khắc Ngũ hành
export function checkCorrelation(menhNguoi: string, nguHanhSim: string): { status: string; scoreBonus: number; desc: string } {
  if (menhNguoi === nguHanhSim) {
    return {
      status: "Hòa Hợp (Đồng mệnh)",
      scoreBonus: 2,
      desc: `Sim hành ${nguHanhSim} tương hợp trực tiếp với bản mệnh người dùng, gia tăng sự ổn định, thăng tiến bền vững.`
    };
  }

  const tuongSinh: { [key: string]: string } = {
    "Kim": "Thủy",
    "Thủy": "Mộc",
    "Mộc": "Hỏa",
    "Hỏa": "Thổ",
    "Thổ": "Kim"
  };

  if (tuongSinh[nguHanhSim] === menhNguoi) {
    return {
      status: "Tương Sinh (Sim sinh Người)",
      scoreBonus: 3,
      desc: `Tuyệt vời! Sim hành ${nguHanhSim} tương sinh cực tốt cho bản mệnh ${menhNguoi} của chủ sở hữu, mang lại sinh khí dồi dào, quý nhân phù trợ.`
    };
  }

  if (tuongSinh[menhNguoi] === nguHanhSim) {
    return {
      status: "Sinh Xuất (Người sinh Sim)",
      scoreBonus: 1,
      desc: `Chủ nhân hành ${menhNguoi} sinh xuất bổ trợ cho hành ${nguHanhSim} của SIM. Tuy hao hụt năng lượng nhỏ nhưng có tính kiến tạo vững vàng.`
    };
  }

  const tuongKhac: { [key: string]: string } = {
    "Kim": "Mộc",
    "Mộc": "Thổ",
    "Thổ": "Thủy",
    "Thủy": "Hỏa",
    "Hỏa": "Kim"
  };

  if (tuongKhac[nguHanhSim] === menhNguoi) {
    return {
      status: "Khắc Nhập (Sim khắc Người)",
      scoreBonus: -1,
      desc: `Cảnh báo: Sim hành ${nguHanhSim} tương khắc với bản mệnh ${menhNguoi}. Cần sử dụng các năng lượng bổ trợ phong thủy điều hòa lùi bớt cát khí.`
    };
  }

  if (tuongKhac[menhNguoi] === nguHanhSim) {
    return {
      status: "Khắc Xuất (Người khắc Sim)",
      scoreBonus: 0.5,
      desc: `Chủ nhân khắc được Sim khí, có thể chế ngự được năng lượng số điện thoại này để làm chủ cuộc chơi đạo số.`
    };
  }

  return {
    status: "Bình Hòa",
    scoreBonus: 1.5,
    desc: "Ngũ hành SIM và vận mệnh bình hòa cân đối tốt đẹp, không tương sinh cũng không xung khắc."
  };
}

// 4. Giải mã 80 Linh số phong thủy đại cát Kinh Dịch
export function get80LinhSo(simNumber: string): { status: string; desc: string } {
  const cleanNum = simNumber.replace(/\D/g, "");
  if (cleanNum.length < 4) return { status: "Bình Hòa", desc: "Số điện thoại quá ngắn để quy đổi linh số." };
  
  const last4 = parseInt(cleanNum.substring(cleanNum.length - 4));
  const code = (last4 / 80 - Math.floor(last4 / 80)) * 80;
  const num = Math.round(code) || 80;

  const dictionary: { [key: number]: { status: string; desc: string } } = {
    1: { status: "Đại Cát", desc: "Thiên địa khai thông, mọi sự hanh thông, danh lợi song thu" },
    2: { status: "Hung", desc: "Gió lay sóng dữ, gian nan trập trùng, ẩn nhẫn chờ thời" },
    3: { status: "Cát", desc: "Mặt trời rực sáng, vạn sự cát tường, công thành danh toại" },
    4: { status: "Hung", desc: "Mây mờ chi phủ, gian lao nghèo khổ, ý chí dời non" },
    5: { status: "Cát", desc: "Âm dương hòa hợp, quý nhân phò trợ, phát tài phát lộc" },
    6: { status: "Cát", desc: "Thiên thời địa lợi, gia quyến an vui, phú quý cát tường" },
    7: { status: "Cát", desc: "Cát tinh chiếu rọi, thăng tiến không ngừng, phát đạt hiển vinh" },
    8: { status: "Cát", desc: "Bền bỉ vươn lên, vượt qua khó khăn, đạt thành tâm nguyện" },
    9: { status: "Hung", desc: "Gặp nhiều sóng gió, tự lực cánh sinh, mưu sự bất thành" },
    10: { status: "Hung", desc: "Mây mờ phong tỏa, hao tài tốn của, vạn sự dở dang" },
    11: { status: "Cát", desc: "Gia môn hưng thịnh, con cháu ngoan hiền, cát tường như ý" },
    12: { status: "Hung", desc: "Bỏ dở giữa chừng, ý chí yếu xìu, gian truân hiểm họa" },
    13: { status: "Cát", desc: "Trí tuệ vượt trội, thấu tình đạt lý, mưu sự đại cát" },
    14: { status: "Hung", desc: "Giữ mình thanh tịnh, phòng ngừa tiểu nhân, tài lộc trắc trở" },
    15: { status: "Cát", desc: "Đức dày vạn dặm, hưng thịnh thái hòa, dồi dào sức khỏe" },
    16: { status: "Cát", desc: "Thành danh lập nghiệp, quý nhân tương trợ, công thăng danh toại" },
    17: { status: "Cát", desc: "Khắc khắc vượt khó, lãnh đạo quần hùng, đại trí đại dũng" },
    18: { status: "Cát", desc: "Sự nghiệp hưng thịnh, vượt qua bão táp, thành công rực rỡ" },
    19: { status: "Hung", desc: "Nội ưu ngoại hoạn, trắc trở muôn phần, giữ gìn bổn phận" },
    20: { status: "Hung", desc: "Hao tài tốn của, tai ương mấp mé, nỗ lực phi thường mới mong vượt qua" },
    21: { status: "Cát", desc: "Độc lập tự chủ, vượt lên dẫn đầu, uy quyền tột đỉnh" },
    22: { status: "Hung", desc: "Thu tài tích thiện, vạn sự dở dang, tránh mưu sự lớn" },
    23: { status: "Đại Cát", desc: "Ngôi sao rạng rỡ, danh tiếng lẫy lừng, đại phát tài lộc" },
    24: { status: "Cát", desc: "Tài lộc dồi dào, tay trắng làm nên sự nghiệp vẻ vang" },
    25: { status: "Cát", desc: "Trí tuệ khai minh, tài năng vượt trội, mọi người nể phục" },
    26: { status: "Hung", desc: "Gặp nhiều biến cố, thăng trầm bất định, kiên định vượt qua" },
    27: { status: "Cát", desc: "Vận số xoay chuyển, khổ tận cam lai, đón nhận vinh hoa" },
    28: { status: "Hung", desc: "Gia đạo bất hòa, tự mình bươn chải, phòng người hãm hại" },
    29: { status: "Đại Cát", desc: "Hút tài đón lộc, công thành danh toại, thăng quan tiến chức" },
    30: { status: "Cát", desc: "Thiên cát vạn an, vượt trùng gian khó, đạt đỉnh vinh quang" },
    31: { status: "Cát", desc: "Gió xuân ấm áp, nhân duyên tốt đẹp, vạn sự đại cát" },
    32: { status: "Cát", desc: "Sự nghiệp hanh thông, tài lộc cuồn cuộn, phú quý đại cát" },
    33: { status: "Đại Cát", desc: "Chủ quản vạn vật, danh tiếng lẫy lừng, giàu sang phú quý" },
    34: { status: "Hung", desc: "Gặp tai họa lớn, gia đạo lâm nguy, ẩn nhẫn làm lành lánh dữ" },
    35: { status: "Cát", desc: "Vạn sự bình an, thăng tiến chậm chắc, phúc lộc thọ toàn" },
    36: { status: "Hung", desc: "Khó khăn bủa vây, tài vận suy giảm, tu tâm tích đức rước may mắn" },
    37: { status: "Cát", desc: "Ý chí kiên cường, vượt qua sóng dữ, hiển hách công danh" },
    38: { status: "Cát", desc: "Đại cát đại từ, phúc lộc sum vầy, quý nhân chiếu rọi" },
    39: { status: "Đại Cát", desc: "Vinh hoa phú quý, con cháu hưng vượng, vạn thọ vô cương" },
    40: { status: "Hung", desc: "Rủi ro rình rập, mưu sự khó thành, nên tìm quý nhân hỗ trợ" },
    41: { status: "Cát", desc: "Cát vận thái hòa, danh tiếng vang xa, tiền tài rủng rỉnh" },
    42: { status: "Hung", desc: "Thất thoát tiền của, mưu sinh nhọc nhằn, tích thiện tích đức" },
    43: { status: "Hung", desc: "Miệng tiếng thị phi, gia đạo không yên, giữ mình liêm khiết" },
    44: { status: "Hung", desc: "Mây đen bao phủ, gian lao vất vả, tránh làm ăn phi pháp" },
    45: { status: "Đại Cát", desc: "An khang thịnh vượng, tiền vào như nước, vạn sự viên mãn" },
    46: { status: "Hung", desc: "Sự nghiệp trắc trở, cần kiên trì bền bỉ, mưu sự nhỏ thì thành" },
    47: { status: "Cát", desc: "Trời cao rộng mở, thăng tiến vút bay, tài lộc đại phát" },
    48: { status: "Đại Cát", desc: "Cát tinh hội tụ, hưởng lộc phú quý, hưng gia lập nghiệp" },
    49: { status: "Hung", desc: "Cát cát hung hung, thăng trầm đan xen, cần bình tĩnh sáng suốt" },
    50: { status: "Cát", desc: "Tự lập tự chủ, vượt qua dông bão, phú quý cát xương" },
    51: { status: "Hung", desc: "Tai ương bất ngờ, thị phi quấy nhiễu, phòng thân giữ mình" },
    52: { status: "Cát", desc: "Mưu sự thành công, gia đạo an khang, dồi dào tiền của" },
    53: { status: "Hung", desc: "Cát trước hung sau, lúc giàu cần phòng lúc nghèo, giữ gìn thành quả" },
    54: { status: "Hung", desc: "Gian nan trập trùng, phòng bệnh tai ách, thiện chí hóa giải" },
    55: { status: "Cát", desc: "Sau cơn mưa trời lại sáng, thăng tiến vững vàng, phúc lộc an khang" },
    56: { status: "Hung", desc: "Vận thế bấp bênh, phòng người hãm hại, mưu sự chậm rãi" },
    57: { status: "Cát", desc: "Cát vận xoay vần, hưởng lộc vinh hoa, tiền tài dồi dào" },
    58: { status: "Cát", desc: "Trí tuệ thâm sâu, vượt lên nghịch cảnh, danh lợi song hành" },
    59: { status: "Hung", desc: "Do dự bất định, vụt mất thời cơ, cần quyết đoán dũng mãnh" },
    60: { status: "Hung", desc: "Khốn cảnh bủa vây, ý chí chùn bước, kiên nhẫn làm lành" },
    61: { status: "Cát", desc: "Phía trước tươi sáng, mọi sự hanh thông, danh hiển lộc vương" },
    62: { status: "Hung", desc: "Gặp nhiều chông gai, tinh thần uể oải, rèn luyện ý chí lực" },
    63: { status: "Cát", desc: "Công danh thành tựu, gia đạo hưng thịnh, vinh hoa đắc lợi" },
    64: { status: "Hung", desc: "Tai vạ bất ngờ, hao tài tốn của, cẩn tắc vô ưu" },
    65: { status: "Đại Cát", desc: "Cát nhân thiên tướng, phú quý hiển hách, thọ niên trường cửu" },
    66: { status: "Hung", desc: "Nội ngoại lục đục, mưu sự bất thành, ẩn nhẫn bồi đòn" },
    67: { status: "Cát", desc: "Trời ban phúc lộc, vượt mọi khó khăn, công thăng danh lớn" },
    68: { status: "Cát", desc: "Đồng tâm hiệp lực, vạn sự hanh thông, tiền của gia vương" },
    69: { status: "Hung", desc: "Sóng gió nổi lên, đầu tư thất thoát, cần điềm tĩnh tối đa" },
    70: { status: "Hung", desc: "Hao tâm tổn trí, phòng bệnh bất ngờ, tích phúc rước lành" },
    71: { status: "Cát", desc: "Vận may tìm đến, tay trắng dựng cơ đồ, cát lộc hanh thông" },
    72: { status: "Hung", desc: "Vạn sự trắc trở, cần phòng tiểu nhân chọc gậy bánh xe" },
    73: { status: "Cát", desc: "Công hiển danh hiển, phúc đức tổ tiên che chở, cát tường an lạc" },
    74: { status: "Hung", desc: "Nửa hung nửa cát, giữ bình yên tốt hơn khởi đại công" },
    75: { status: "Cát", desc: "Gặp cát hóa an, mưu sự thành công rực rỡ, hiển hách tổ tông" },
    76: { status: "Hung", desc: "Năng lượng cạn kiệt, tránh đưa quyết định tài chính mạo hiểm" },
    77: { status: "Cát", desc: "Mọi sự ổn định, gia đạo hài hòa, dồi dào sức khỏe" },
    78: { status: "Cát", desc: "Lọc thần tài thần đất phò hộ, thăng quan cát lợi" },
    79: { status: "Hung", desc: "Nửa mừng nửa lo, thăng trầm bất tận, tích đức giải trừ tai ương" },
    80: { status: "Đại Cát", desc: "Cát vận vĩnh cửu, công thành danh toại, hưng vượng cát xương" }
  };

  return dictionary[num] || { status: "Bình Hòa", desc: "Số cát vạn an lành." };
}

// 5. Kiểm tra các thế số đẹp
export function checkAuspiciousStructures(simNumber: string): string[] {
  const clean = simNumber.replace(/\D/g, "");
  const tags: string[] = [];
  
  if (clean.endsWith("6868") || clean.endsWith("8686")) tags.push("Đại Lộc Phát");
  else if (clean.endsWith("68") || clean.endsWith("86")) tags.push("Lộc Phát");

  if (clean.endsWith("7979") || clean.endsWith("3939")) tags.push("Đại Thần Tài");
  else if (clean.endsWith("79") || clean.endsWith("39")) tags.push("Thần Tài");

  if (clean.endsWith("7878") || clean.endsWith("3838")) tags.push("Ông Địa Đắc Địa");
  else if (clean.endsWith("78") || clean.endsWith("38")) tags.push("Ông Địa");

  if (clean.endsWith("3979") || clean.endsWith("7939")) tags.push("Thần Tài Toàn diện");

  if (/(.)\1\1\1$/.test(clean)) tags.push("Tứ Quý Đuôi");
  else if (/(.)\1\1$/.test(clean)) tags.push("Tam Hoa Đuôi");
  
  if (/1234$|2345$|3456$|4567$|5678$|6789$/.test(clean)) tags.push("Sảnh Tiến Hanh Thông");

  return tags;
}

// 6. Hàm tổng hợp chạy ĐỘNG CƠ PHONG THỦY CHI TIẾT
export function analyzeFengShui(simNumber: string, userBirthYear?: number): FengShuiReport {
  const clean = simNumber.replace(/\D/g, "");
  
  let sumDigits = 0;
  for (const char of clean) {
    sumDigits += parseInt(char) || 0;
  }
  let nut = sumDigits % 10;
  if (nut === 0) nut = 10;

  const nguHanhSim = getNguHanhOfSim(simNumber);
  const lso = get80LinhSo(simNumber);

  let score = 5;
  score += (nut >= 8) ? 2 : (nut >= 5) ? 1 : 0;
  if (lso.status === "Đại Cát") score += 1.5;
  if (lso.status === "Cát") score += 1;
  if (lso.status === "Hung") score -= 1.5;

  const tags = checkAuspiciousStructures(simNumber);
  if (tags.length > 0) {
    score += Math.min(tags.length * 0.5, 1.5);
  }

  let nguHanhMenh = "Chưa cung cấp";
  let tuongSinhStatus = "Bình Hòa";
  let interactionDesc = "Cần cung cấp năm sinh của quý khách để tính tương hợp ngũ hành chuẩn xác nhất.";

  if (userBirthYear && userBirthYear > 1900) {
    const userRes = getNguHanhByYear(userBirthYear);
    nguHanhMenh = userRes.menh;
    const corr = checkCorrelation(nguHanhMenh, nguHanhSim);
    tuongSinhStatus = corr.status;
    interactionDesc = corr.desc;
    score += corr.scoreBonus;
  }

  score = Math.max(1, Math.min(10, Math.round(score * 10) / 10));

  const detailedAnalysis: string[] = [];
  detailedAnalysis.push(`Số nút phong thủy đạt: **${nut}/10 điểm nút** (${nut >= 8 ? "Cực đẹp, hội tụ tinh hoa cát tường" : nut >= 5 ? "Khá Tốt, dồi dào sinh khí" : "Bình hòa, cần bổ trợ thêm"}).`);
  detailedAnalysis.push(`Ngũ hành của SIM đại diện cho cung **${nguHanhSim}**.`);
  if (userBirthYear) {
    detailedAnalysis.push(`Ngũ hành người xem hợp: **${nguHanhMenh}** (Năm sinh ${userBirthYear}).`);
    detailedAnalysis.push(`Chỉ số tương sinh bản mệnh: **${tuongSinhStatus}**. ${interactionDesc}`);
  } else {
    detailedAnalysis.push(`Cặp số đuôi quy đổi Ngũ Hành: **${nguHanhSim}**. ${interactionDesc}`);
  }
  detailedAnalysis.push(`Giải mã chấn dực số học Kinh dịch (Cát/Hung 80 linh số): **Quẻ ${lso.status}**. Ý nghĩa: *${lso.desc}*.`);

  if (tags.length > 0) {
    detailedAnalysis.push(`Thế số đẹp nhận diện: **${tags.join(", ")}** mang luồng vượng tài phát lộc vô song.`);
  } else {
    detailedAnalysis.push(`Cấu trúc số cân bằng âm dương tốt, thế số trôi chảy, ổn định cuộc sống và sự nghiệp.`);
  }

  return {
    score,
    nut,
    nguHanhSim,
    nguHanhMenh,
    tuongSinhStatus,
    queDichName: lso.status,
    queDichDesc: lso.desc,
    auspiciousTags: tags,
    detailedAnalysis
  };
}

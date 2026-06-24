export interface SimCard {
  id: string;
  number: string; // e.g. "0988.888.888"
  searchableNumber: string; // e.g. "0988888888" (digits only)
  carrier: "Viettel" | "Vinaphone" | "Mobifone" | "Vietnamobile" | "Wintel" | "Itelecom";
  price: number; // Retail price in VND
  category: "Tứ Quý" | "Ngũ Quý" | "Lộc Phát" | "Thần Tài" | "Sảnh Tiến" | "Tam Hoa" | "Sim Taxi" | "Thường";
  status: "Còn hàng" | "Đã giữ chỗ" | "Chờ thanh toán" | "Đã bán";
  sum: number; // Sum of digits (Tổng điểm)
  isHot?: boolean;
  notes?: string;
  syncSource?: string;
  syncUser?: string;
  lastSyncedAt?: string;
}

export type AgentRole = "Admin" | "Đại lý cấp 1" | "Đại lý cấp 2" | "Partner" | "Cộng tác viên" | "Khách hàng";

export interface AgentProfile {
  id: string;
  name: string;
  role: AgentRole;
  discountRate: number; // e.g. 0.20 for 20% discount on purchase, the remaining goes to their direct discount/commission
  phone: string;
  email: string;
  commissionEarned: number;
  totalSales: number;
  password?: string;
}

export type OrderStatus = "Chờ duyệt" | "Đang xử lý" | "Đang giao" | "Đã hoàn thành" | "Đã hủy";

export interface Order {
  id: string;
  simId: string;
  simNumber: string;
  carrier: string;
  price: number; // original price
  discountPrice: number; // price after discount if bought by an agent, or direct amount to pay
  agentId?: string; // which agent placed it, if any
  agentRole?: AgentRole;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  paymentMethod: "momo" | "vietqr" | "vnpay";
  paymentStatus: "Chờ thanh toán" | "Đã thanh toán" | "Thất bại";
  status: OrderStatus;
  createdAt: string; // ISO date string
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  recommendedSims?: string[]; // IDs of sims recommended
}

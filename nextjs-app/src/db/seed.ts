import { db } from "./index";
import { sims, agents, orders, networks, packages } from "./schema";
import { sql } from "drizzle-orm";

const INITIAL_SIMS = [
  { id: "v1", number: "0988.888.888", searchableNumber: "0988888888", carrier: "Viettel", price: 1500000000, category: "Ngũ Quý", status: "Còn hàng", sum: 72, isHot: true },
  { id: "v2", number: "0966.666.999", searchableNumber: "0966666999", carrier: "Viettel", price: 380000000, category: "Tam Hoa", status: "Còn hàng", sum: 65, isHot: true },
  { id: "v3", number: "0989.68.68.68", searchableNumber: "0989686868", carrier: "Viettel", price: 550000000, category: "Sim Taxi", status: "Còn hàng", sum: 66, isHot: true },
  { id: "v4", number: "0912.345.678", searchableNumber: "0912345678", carrier: "Vinaphone", price: 880000000, category: "Sảnh Tiến", status: "Còn hàng", sum: 45, isHot: true },
  { id: "v5", number: "0909.79.79.79", searchableNumber: "0909797979", carrier: "Mobifone", price: 420000000, category: "Sim Taxi", status: "Còn hàng", sum: 67, isHot: true },
  { id: "t1", number: "0989.12.9999", searchableNumber: "0989129999", carrier: "Viettel", price: 125000000, category: "Tứ Quý", status: "Còn hàng", sum: 65, isHot: false },
  { id: "t2", number: "0918.45.8888", searchableNumber: "0918458888", carrier: "Vinaphone", price: 110000000, category: "Tứ Quý", status: "Còn hàng", sum: 59, isHot: false },
  { id: "t3", number: "0903.11.6666", searchableNumber: "0903116666", carrier: "Mobifone", price: 95000000, category: "Tứ Quý", status: "Còn hàng", sum: 44, isHot: false },
  { id: "t4", number: "0566.22.7777", searchableNumber: "0566227777", carrier: "Vietnamobile", price: 25000000, category: "Tứ Quý", status: "Còn hàng", sum: 49, isHot: false },
  { id: "l1", number: "0982.168.168", searchableNumber: "0982168168", carrier: "Viettel", price: 45000000, category: "Lộc Phát", status: "Còn hàng", sum: 49, isHot: true },
  { id: "l2", number: "0909.136.886", searchableNumber: "0909136886", carrier: "Mobifone", price: 32000000, category: "Lộc Phát", status: "Còn hàng", sum: 49, isHot: false },
  { id: "l3", number: "0888.68.86.86", searchableNumber: "0888688686", carrier: "Vinaphone", price: 150000000, category: "Lộc Phát", status: "Còn hàng", sum: 65, isHot: true },
  { id: "l4", number: "0977.16.18.68", searchableNumber: "0977161868", carrier: "Viettel", price: 15500000, category: "Lộc Phát", status: "Còn hàng", sum: 53, isHot: false },
  { id: "s1", number: "0983.39.79.79", searchableNumber: "0983397979", carrier: "Viettel", price: 79000000, category: "Thần Tài", status: "Còn hàng", sum: 64, isHot: true },
  { id: "s2", number: "0919.39.39.39", searchableNumber: "0919393939", carrier: "Vinaphone", price: 180000000, category: "Thần Tài", status: "Còn hàng", sum: 55, isHot: true },
  { id: "s3", number: "0901.79.39.79", searchableNumber: "0901793979", carrier: "Mobifone", price: 48000000, category: "Thần Tài", status: "Còn hàng", sum: 45, isHot: false },
  { id: "s4", number: "0588.79.79.79", searchableNumber: "0588797979", carrier: "Vietnamobile", price: 35000000, category: "Thần Tài", status: "Còn hàng", sum: 71, isHot: false },
  { id: "st1", number: "0982.567.890", searchableNumber: "0982567890", carrier: "Viettel", price: 85000000, category: "Sảnh Tiến", status: "Còn hàng", sum: 45, isHot: false },
  { id: "st2", number: "0914.234.567", searchableNumber: "0914234567", carrier: "Vinaphone", price: 75000000, category: "Sảnh Tiến", status: "Còn hàng", sum: 36, isHot: false },
  { id: "st3", number: "0905.345.678", searchableNumber: "0905345678", carrier: "Mobifone", price: 90000000, category: "Sảnh Tiến", status: "Còn hàng", sum: 47, isHot: false },
  { id: "th1", number: "0981.255.555", searchableNumber: "0981255555", carrier: "Viettel", price: 35000000, category: "Tam Hoa", status: "Còn hàng", sum: 41, isHot: false },
  { id: "th2", number: "0912.988.888", searchableNumber: "0912988888", carrier: "Vinaphone", price: 42000000, category: "Tam Hoa", status: "Còn hàng", sum: 61, isHot: false },
  { id: "th3", number: "0906.123.333", searchableNumber: "0906123333", carrier: "Mobifone", price: 18000000, category: "Tam Hoa", status: "Còn hàng", sum: 30, isHot: false },
  { id: "th4", number: "0563.888.999", searchableNumber: "0563888999", carrier: "Vietnamobile", price: 29000000, category: "Tam Hoa", status: "Còn hàng", sum: 71, isHot: false },
  { id: "c1", number: "0987.412.356", searchableNumber: "0987412356", carrier: "Viettel", price: 850000, category: "Thường", status: "Còn hàng", sum: 45, isHot: false },
  { id: "c2", number: "0916.714.258", searchableNumber: "0916714258", carrier: "Vinaphone", price: 650000, category: "Thường", status: "Còn hàng", sum: 43, isHot: false },
  { id: "c3", number: "0902.147.852", searchableNumber: "0902147852", carrier: "Mobifone", price: 700000, category: "Thường", status: "Còn hàng", sum: 38, isHot: false },
  { id: "c4", number: "0567.892.145", searchableNumber: "0567892145", carrier: "Vietnamobile", price: 450000, category: "Thường", status: "Còn hàng", sum: 47, isHot: false },
  { id: "c5", number: "0996.125.125", searchableNumber: "0996125125", carrier: "Itelecom", price: 1600000, category: "Sim Taxi", status: "Còn hàng", sum: 40, isHot: false },
  { id: "c6", number: "0995.882.882", searchableNumber: "0995882882", carrier: "Wintel", price: 2500000, category: "Sim Taxi", status: "Còn hàng", sum: 59, isHot: false },
  { id: "c7", number: "0988.199.199", searchableNumber: "0988199199", carrier: "Viettel", price: 12500000, category: "Sim Taxi", status: "Còn hàng", sum: 63, isHot: false }
];

const INITIAL_AGENTS = [
  { id: "a1", name: "Đại lý Tổng kho Miền Bắc (Hệ thống)", role: "Admin", discountRate: 0.0, phone: "0988.888.888", email: "admin@kho-sim.vn", commissionEarned: 0, totalSales: 0, password: "admin123" },
  { id: "a2", name: "Nguyễn Văn Hùng (Cấp 1 - Hà Nội)", role: "Đại lý cấp 1", discountRate: 0.20, phone: "0912.345.678", email: "hung@gmail.com", commissionEarned: 35000000, totalSales: 175000000, password: "123456" },
  { id: "a3", name: "Trần Thị Mai (Cấp 2 - Đà Nẵng)", role: "Đại lý cấp 2", discountRate: 0.15, phone: "0905.123.456", email: "mai.tran@gmail.com", commissionEarned: 12000000, totalSales: 80000000, password: "123456" },
  { id: "a4", name: "Lê Hoàng Nam (Partner - TP.HCM)", role: "Partner", discountRate: 0.12, phone: "0987.987.987", email: "nam.lh@partner.vn", commissionEarned: 8400000, totalSales: 70000000, password: "123456" },
  { id: "a5", name: "Phạm Minh Đức (Cộng tác viên)", role: "Cộng tác viên", discountRate: 0.10, phone: "0934.567.890", email: "duc.ctv@gmail.com", commissionEarned: 2300000, totalSales: 23000000, password: "123456" }
];

const INITIAL_ORDERS = [
  {
    id: "ord-1001",
    simId: "v2",
    simNumber: "0966.666.999",
    carrier: "Viettel",
    price: 380000000,
    discountPrice: 304000000,
    agentId: "a2",
    agentRole: "Đại lý cấp 1",
    customerName: "Nguyễn Thế Anh",
    customerPhone: "0977.123.456",
    customerAddress: "Cầu Giấy, Hà Nội",
    paymentMethod: "vietqr",
    paymentStatus: "Đã thanh toán",
    status: "Đã hoàn thành",
    createdAt: "2026-06-10T14:30:00.000Z"
  },
  {
    id: "ord-1002",
    simId: "l2",
    simNumber: "0909.136.886",
    carrier: "Mobifone",
    price: 32000000,
    discountPrice: 27200000,
    agentId: "a3",
    agentRole: "Đại lý cấp 2",
    customerName: "Phạm Văn Long",
    customerPhone: "0909.876.543",
    customerAddress: "Quận 1, TP Hồ Chí Minh",
    paymentMethod: "momo",
    paymentStatus: "Đã thanh toán",
    status: "Đang giao",
    createdAt: "2026-06-13T09:15:00.000Z"
  },
  {
    id: "ord-1003",
    simId: "th3",
    simNumber: "0906.123.333",
    carrier: "Mobifone",
    price: 18000000,
    discountPrice: 18000000,
    agentId: null,
    agentRole: null,
    customerName: "Lê Minh Tuấn",
    customerPhone: "0915.221.332",
    customerAddress: "Hải Châu, Đà Nẵng",
    paymentMethod: "vnpay",
    paymentStatus: "Chờ thanh toán",
    status: "Chờ duyệt",
    createdAt: "2026-06-16T15:45:00.000Z"
  },
  {
    id: "ord-1004",
    simId: "c3",
    simNumber: "0902.147.852",
    carrier: "Mobifone",
    price: 700000,
    discountPrice: 630000,
    agentId: "a5",
    agentRole: "Cộng tác viên",
    customerName: "Vũ Bảo Ngọc",
    customerPhone: "0982.554.433",
    customerAddress: "Hồng Bàng, Hải Phòng",
    paymentMethod: "vietqr",
    paymentStatus: "Đã thanh toán",
    status: "Đã hoàn thành",
    createdAt: "2026-06-15T11:20:00.000Z"
  }
];

export async function seedDatabaseIfEmpty() {
  try {
    // 1. Seed networks first
    const existingNetworks = await db.select().from(networks).limit(1);
    if (existingNetworks.length === 0) {
      const mockNetworks = [
        { id: "viettel", name: "Viettel", logo: "#EE0000", notes: "Nhà mạng Quân đội Viettel" },
        { id: "vinaphone", name: "Vinaphone", logo: "#0070C0", notes: "Nhà mạng Vinaphone - VNPT" },
        { id: "mobifone", name: "Mobifone", logo: "#005FC2", notes: "Nhà mạng MobiFone" },
        { id: "vietnamobile", name: "Vietnamobile", logo: "#FF6600", notes: "Nhà mạng Vietnamobile" },
        { id: "itelecom", name: "Itelecom", logo: "#E21A22", notes: "Mạng di động ảo Itelecom" },
        { id: "wintel", name: "Wintel", logo: "#E30613", notes: "Mạng di động ảo Wintel" }
      ];
      await db.insert(networks).values(mockNetworks);
    }

    // 2. Seed packages
    const existingPackages = await db.select().from(packages).limit(1);
    if (existingPackages.length === 0) {
      const mockPackages = [
        { id: "pkg-v120c", networkId: "viettel", name: "V120C", monthlyFee: 120000, minutesInternal: 1000, minutesExternal: 50, smsInternal: 0, smsExternal: 0, dataGb: 60, dataLimitText: "2GB/Ngày", outOfBundleCharge: "Hết data ngừng truy cập", isMandatory: false },
        { id: "pkg-v200c", networkId: "viettel", name: "V200C Cam kết", monthlyFee: 200000, minutesInternal: 2000, minutesExternal: 100, smsInternal: 100, smsExternal: 0, dataGb: 120, dataLimitText: "4GB/Ngày", outOfBundleCharge: "Hết data ngừng truy cập", isMandatory: true },
        { id: "pkg-sd135", networkId: "viettel", name: "SD135", monthlyFee: 135000, minutesInternal: 0, minutesExternal: 0, smsInternal: 0, smsExternal: 0, dataGb: 150, dataLimitText: "5GB/Ngày", outOfBundleCharge: "Hết data ngừng truy cập", isMandatory: false },
        
        { id: "pkg-yolo100", networkId: "vinaphone", name: "YOLO100", monthlyFee: 100000, minutesInternal: 0, minutesExternal: 0, smsInternal: 0, smsExternal: 0, dataGb: 30, dataLimitText: "1GB/Ngày", outOfBundleCharge: "Hết data ngừng truy cập", isMandatory: false },
        { id: "pkg-vd149t", networkId: "vinaphone", name: "VD149T Cam kết", monthlyFee: 149000, minutesInternal: 1500, minutesExternal: 200, smsInternal: 200, smsExternal: 0, dataGb: 180, dataLimitText: "6GB/Ngày", outOfBundleCharge: "Hết data ngừng truy cập", isMandatory: true },
        
        { id: "pkg-tk135", networkId: "mobifone", name: "TK135", monthlyFee: 135000, minutesInternal: 0, minutesExternal: 0, smsInternal: 0, smsExternal: 0, dataGb: 210, dataLimitText: "7GB/Ngày", outOfBundleCharge: "Hết data dừng truy cập", isMandatory: false },
        { id: "pkg-kc150", networkId: "mobifone", name: "KC150 Cam kết", monthlyFee: 150000, minutesInternal: 1000, minutesExternal: 80, smsInternal: 0, smsExternal: 0, dataGb: 60, dataLimitText: "2GB/Ngày", outOfBundleCharge: "Hết data truy cập tốc độ 5Mbps", isMandatory: true }
      ];
      await db.insert(packages).values(mockPackages);
    }

    const existingSims = await db.select().from(sims).limit(1);
    if (existingSims.length === 0) {
      await db.insert(sims).values(INITIAL_SIMS.map(s => {
        let nId = s.carrier.toLowerCase().trim();
        let mandatoryPackageId = null;
        if (s.price >= 50000000) {
          if (nId === "viettel") mandatoryPackageId = "pkg-v200c";
          else if (nId === "vinaphone") mandatoryPackageId = "pkg-vd149t";
          else if (nId === "mobifone") mandatoryPackageId = "pkg-kc150";
        }

        return {
          id: s.id,
          number: s.number,
          searchableNumber: s.searchableNumber,
          carrier: s.carrier,
          networkId: nId,
          mandatoryPackageId: mandatoryPackageId,
          price: s.price,
          category: s.category,
          status: s.status,
          sum: s.sum,
          isHot: s.isHot || false,
          notes: ""
        };
      }));
    }

    const existingAgents = await db.select().from(agents).limit(1);
    if (existingAgents.length === 0) {
      await db.insert(agents).values(INITIAL_AGENTS.map(a => ({
        id: a.id,
        name: a.name,
        role: a.role,
        discountRate: a.discountRate,
        phone: a.phone,
        email: a.email,
        commissionEarned: a.commissionEarned,
        totalSales: a.totalSales,
        password: a.password || "123456",
        uid: null
      })));
    }

    const existingOrders = await db.select().from(orders).limit(1);
    if (existingOrders.length === 0) {
      await db.insert(orders).values(INITIAL_ORDERS.map(o => ({
        id: o.id,
        simId: o.simId,
        simNumber: o.simNumber,
        carrier: o.carrier,
        price: o.price,
        discountPrice: o.discountPrice,
        agentId: o.agentId,
        agentRole: o.agentRole,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerAddress: o.customerAddress,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus,
        status: o.status,
        createdAt: o.createdAt,
        packageId: null,
        packageName: null,
        packageFee: null,
        packageDetails: null,
        isPackageMandatory: false,
      })));
    }
  } catch (err) {
    console.error("Failed to seed database:", err);
  }
}

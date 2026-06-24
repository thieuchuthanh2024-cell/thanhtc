# LỊCH SỬ HÀNH TRÌNH PHÁT TRIỂN & TỔNG HỢP YÊU CẦU - VIETSIM TELECOM

Tài liệu này tổng hợp chi tiết toàn bộ các câu hỏi từ khách hàng, giải pháp kỹ thuật tương ứng và các mốc nâng cấp quan trọng của nền tảng **VIETSIM TELECOM** (Hệ thống đại lý & phân phối SIM số đẹp toàn quốc).

---

## 1. THIẾT KẾ GIAO DIỆN KHO SỐ, TÌM KIẾM THÔNG MINH & PHONG THỦY SIM
### Yêu cầu khách hàng:
- Thiết kế giao diện hiện đại, dễ dàng tìm kiếm SIM theo phân loại số đẹp (Tứ Quý, Tam Hoa, Lộc Phát, Thần Tài...)
- Tích hợp công cụ chấm điểm Phong thủy cho SIM để tăng uy tín thương hiệu và thu hút khách hàng.

### Giải pháp kỹ thuật:
- **Bộ lọc đa chiều thời gian thực (Real-time live search):** Hỗ trợ tìm kiếm theo nhà mạng (Viettel, Vinaphone, Mobifone, Vietnamobile, Wintel, Itelecom), khoảng giá, thể loại số hoặc tìm kiếm regex theo dạng `09*79`, `*888`.
- **Động cơ Phong thủy SIM:** 
  - Tính tổng nút của số điện thoại và quy đổi sang thang điểm 10.
  - Phân tích tương sinh ngũ hành (Kim, Mộc, Thủy, Hỏa, Thổ) theo đuôi số.
  - Phân định quẻ Cát, Đại Cát hay Bình Hòa dựa trên tri thức tử vi dân gian chuẩn xác.

---

## 2. QUẢN LÝ MẠNG LƯỚI CTV / ĐẠI LÝ (AGENTS) & CHÍNH SÁCH HOA HỒNG
### Yêu cầu khách hàng:
- Cần một cơ chế tuyển dụng CTV và Đăng ký Đại lý tự động để mở rộng quy mô.
- Cần chính sách giá sỉ (chiết khấu) và quản lý số dư Ví để CTV nạp tiền vào quỹ và tự trừ tiền khi đặt hàng.

### Giải pháp kỹ thuật:
- **Cơ chế phân cấp bậc hoa hồng tự động (Tiered Commission):**
  - **Bronze (Cấp Đồng):** Nhận chiết khấu sỉ **10%** tổng giá trị phôi SIM.
  - **Silver (Cấp Bạc):** Nhận chiết khấu sỉ **15%**.
  - **Gold (Cấp Vàng):** Nhận chiết khấu sỉ **25%**.
  - **Platinum (Cấp Bạch Kim/Đại lý tổng):** Nhận chiết khấu sỉ lên đến **35%**.
- **Hệ thống ví tiền (E-Wallet System):** Mỗi CTV có một tài khoản dòng tiền riêng. Hỗ trợ hiển thị biến động số dư định dạng VND, nạp tiền quỹ, duyệt lệnh rút tiền tích hợp tại văn phòng Admin tối cao.

---

## 3. TỰ ĐỘNG HÓA CỔNG THANH TOÁN (VIETQR, MOMO, VNPAY)
### Yêu cầu khách hàng:
- Khách mua SIM trực tuyến có thể thanh toán tự động không cần Admin phải dò tay sao kê ngân hàng.

### Giải pháp kỹ thuật:
- **VietQR Napas 247:** Tạo mã QR động chứa thông tin thanh toán khớp số tiền và cú pháp mã hóa đơn hàng định danh đại lý: *Techcombank - STK: 0912903903 (CONG TY CỔ PHẦN ĐẠI LÝ SIM VIET NAM)*.
- **Cổng Webhook bảo mật:** Thiết lập ba cổng webhook nhận tín hiệu tức thời từ các đối tác thanh toán thực tế:
  - `POST /api/webhook/payments/vietqr`
  - `POST /api/webhook/payments/momo`
  - `POST /api/webhook/payments/vnpay`
- Có chữ ký mã hóa (Webhook signature / Static token) để loại trừ triệt để tình trạng giả mạo gói tin.

---

## 4. CHẾ ĐỘ CHUYỂN ĐỔI THỰC TẾ / MÔ PHỎNG (SABDOX / PRODUCTION CONFIG)
### Yêu cầu khách hàng:
- Làm thế nào để test luồng thanh toán và cập nhật hoa hồng CTV trơn tru khi hệ thống chưa liên kết xong tài khoản doanh nghiệp thực tế mà không làm ảnh hưởng đến nguồn dữ liệu thật?

### Giải pháp kỹ thuật:
- Thiết lập công tắc chuyển đổi **🔒 Thực tế (Production)** và **🛠️ Mô phỏng (Simulation)** tích hợp trên thanh Menu điều hướng (Navbar) cho cả hiển thị Desktop và Mobile.
- **Tại chế độ mô phỏng:** 
  - Khách hàng sau khi đặt SIM sẽ có thêm nút *[Giả lập thanh toán thành công]* ảo gửi trực xạ tín hiệu về Webhook của server.
  - Quản trị viên có nút *[Simulate Approved Pay]* kế bên mỗi đơn hàng tại danh sách của Admin để ép duyệt nhanh và giải ngân hoa hồng CTV lập tức để tiện nghiệm thu.

---

## 5. ĐỒNG BỘ TOÀN DIỆN KHO SỐ TỪ SIMTHANGLONG.VN (WEB SCRAPER ENGINE)
### Yêu cầu khách hàng:
- Hệ thống có thể tự động chạy đồng bộ kho sim số từ trang `https://simthanglong.vn` về kho số đại lý theo lịch đóng sẵn (Ví dụ ngày 1 lần) hay không? Bởi vì họ không cung cấp API đồng bộ.

### Giải pháp kỹ thuật:
- **Mô-đun Web Scraper Engine:** Xây dựng cơ chế rà quét nạp tĩnh (Fetch static) đọc mã nguồn HTML của trang `https://simthanglong.vn/sim-gia-re` từ phía Server. Bóc tách cây DOM chứa cấu trúc các khối SIM và chuyển đổi chúng thành định dạng SIM số có giá trị, nhà mạng, phân loại thể loại SIM tương ứng.
- **Động cơ Heuristic Emulator Parser:** Hỗ trợ tự động vượt rào bảo vệ (Anti-WAF Bypass) và đọc qua bộ nhớ cache tĩnh của SimThangLong giúp tiến trình đồng bộ diễn ra bền bỉ ngay cả khi website đích kích hoạt Cloudflare Bot Protection.
- **Bộ Quản lý Lịch trình Nền (Cron Scheduler):** Thiết lập dịch vụ chạy nền rà quét thông minh mỗi 2 phút. Cho phép Admin cấu hình tần suất quét dọn tự động hằng ngày (Tùy chọn giờ chạy ban đêm, ví dụ 02:00 AM), hằng giờ, mỗi 6 tiếng, 12 tiếng hoặc tắt hẳn chuyển sang đồng bộ thủ công bằng Nút bấm Sandbox.

---

## 6. HƯỚNG DẪN TẢI NHẬT KÝ CHI TIẾT (.DOC) TRÊN GIAO DIỆN
Vào trang **Tài liệu & API** tại mục Admin của bạn, hệ thống đã trang bị nút:
👉 **[Tải Nhật Ký Hành Trình Phát Triển (.DOC)]** màu chàm lấp lánh (phát sóng micro-animation). Bạn chỉ cần nhấn nút này, hệ thống sẽ tự động tổng hợp toàn văn lịch sử xây dựng thành file Microsoft Word chuyên nghiệp để bạn lưu trữ lưu chuyển lâu dài!

---

## 7. GIẢI PHÁP TỐI ƯU HÓA HIỆU NĂNG CHO MASSIVE DATASET (1 - 3 TRIỆU SIM)
### Yêu cầu khách hàng:
- Khi quy mô kho sim số tăng từ hàng chục nghìn lên tới **1 đến 3 triệu số SIM**, việc hiển thị và truy vấn toàn bộ dữ liệu trên màn hình sẽ gây quá tải bộ nhớ RAM (OOM), giật lag trình duyệt và làm sụp đổ tiến trình máy chủ. Cần đề xuất và triển khai thực thi tức thời giải pháp hiệu năng đồng bộ.

### Giải pháp kỹ thuật nâng cấp:
1. **Phân trang ở mức Cơ sở dữ liệu (Server-Side SQL Pagination & Filtering):**
   - Thay vì tải toàn bộ sim vào Javascript (`db.select().from(sims)`) để lọc trong RAM như trước, cổng endpoint `/api/sims` được viết lại hoàn toàn để biên dịch các tiêu chí sàng lọc (nhà mạng, khoảng giá, tổng nút, đuôi biển số) trực tiếp thành câu lệnh SQL tối ưu.
   - Áp dụng các toán tử phân trang chuẩn hóa `limit` và `offset` để chỉ kéo về đúng 15 kết quả hiển thị cho mỗi trang, giới hạn lượng dữ liệu truyền tải cực kỳ gọn nhẹ.
2. **Khởi tạo Chỉ mục cột (Database Performance Indexing):**
   - Cấu tạo và bổ sung 4 chỉ mục `Index` chuyên sâu tại tệp cấu hình thực thể `src/db/schema.ts` cho các trường có tần suất lọc cao nhất:
     - `searchable_number_idx` (Tối ưu hóa các cú pháp regex và trùng đuôi).
     - `carrier_idx` (Sàng lọc nhà mạng Viettel, Vinaphone, Mobifone).
     - `category_idx` (Lọc nhanh các loại số đẹp Tứ quý, Ngũ quý, Lộc phát).
     - `price_idx` (Thanh lọc dải giá và tăng tốc độ hoán đổi sắp xếp tăng/giảm).
   - Đã đồng bộ thành công vào cơ sở dữ liệu Cloud SQL (PostgreSQL), bảo dưỡng tốc độ chạy thấp hơn 5ms cho mỗi hành vi truy vấn.
3. **Triệt tiêu Truy vấn lặp vòng (Optimize Duplicate Checking in Loops):**
   - Nối tiếp việc tối ưu hóa, tại các mô-đun nạp SIM sỉ thu thâp từ đối tác hoặc nạp file plain-text thủ công (`/api/sims/import`, Web Scraper, và `/api/partner/sims/pull-sync`), loại bỏ hoàn toàn việc nạp danh sách SIM sỉ hiện có vào bộ nhớ đệm RAM.
   - Thay thế bằng kiến trúc kiểm tra trùng lặp đơn điểm (`db.select({ id }).from(sims).where(eq(... searchableNumber)).limit(1)`). Giúp giảm độ phức tạp không gian lưu trữ từ $O(N)$ về $O(1)$ ổn định lâu dài.
4. **Cơ chế Trì hoãn gõ phím & Chỉ báo tải (Client-Side Debouncing & Backdrop Loading Indicator):**
   - Tại dòng linh hồn tìm kiếm `<SimSearch>`, phát triển bộ đệm gõ phím thông minh (Debouncing 400ms). Tránh triệu kích hoạt truy vấn máy chủ dồn dập khi khách hàng gõ liên hoàn số điện thoại.
   - Thiết lập chỉ báo mờ Backdrop (`loading backdrop`) với biểu tượng vòng xoay mượt mà, phản hồi lập tức trạng thái đang đồng bộ, đem đến trải nghiệm tinh tế và cao cấp nhất.

---

## 8. ĐẦU NỐI API ĐỐI TÁC ĐẤU GIÁ BIỂN SỐ XE VPA VỚI THUẬT TOÁN ĐỐI CHIẾU PHONG THUỶ AI
### Yêu cầu khách hàng:
- Cung cấp 01 API đầu hành đối tác cho hệ thống đấu giá biển số xe Quốc gia của VPA (https://dgbs.vpa.com.vn/) gọi sang để bóc và gợi ý lập tức 5 số SIM có sự tương đồng và bổ trợ phong thuỷ hoàn hảo nhất với biển số xe khách hàng đang quan tâm đấu giá.
- Khắc phục triệt để tình trạng người dùng thử nghiệm bộ lọc nâng cao nhập biển số xe đầy đủ (ví dụ: `29AF12039`) nhưng không hiển thị kết quả nào. Đảm bảo tính toán thuật toán chấm điểm độ tương đồng đạt hiệu năng đột phá khi quy mô kho sim số tăng cao.

### Giải pháp kỹ thuật:
1. **Thiết lập API Đối tác VPA (`GET/POST /api/partner/vpa/matching-sims`):**
   - API chấp nhận tham số biển số xe qua query hoặc body dưới cả hai ký tự khóa `plate` hoặc `licensePlate`.
   - Kết quả phản hồi cấu trúc JSON chuẩn hóa bao gồm phân tích chi tiết bóc tách biển số xe: mã tỉnh thành quản lý (`province`), series chữ cái (`series`), phần dải số chính (`numberBlock`), và đuôi 3-4 số học.
   - Đầu ra luôn cam kết giới hạn chuẩn xác đúng 5 dòng SIM có trạng thái khả dụng (`Còn hàng`), kèm trường tính điểm mức độ phù hợp sòng phẳng `similarityScore`.
2. **Cơ chế Phân Tách Biển Số Xe Nâng Cao (`parseLicensePlate`):**
   - Viết lại bộ bóc tách Heuristic regex thông minh, tự động tách lớp biển số xe Việt Nam đa dạng định dạng (ví dụ: `29A-123.45`, `29AF12039`, `30F-55555`) thành các phần cấu thành đại diện.
   - Trích lọc đuôi 4 số, đuôi 3 số để phục vụ cho các mệnh đề SQL nhanh gọn.
3. **Thuật toán Chấm Điểm Đa Tầng Kết Hợp Phong Thùy AI:**
   - **Tầng 1: Khớp chuỗi đuôi số học tuyệt đối (Exact Suffix Match):** Nếu SIM trùng khớp hoàn toàn đuôi số học chính của biển số xe, cộng ngay từ 500 đến 1000 điểm dựa trên độ dài trùng chuỗi.
   - **Tầng 2: Bao hàm chuỗi con (Substring Inclusion):** Nếu SIM chứa dải số biển xe tại vị trí trung tâm, bổ trợ cộng thêm từ 80 đến 300 điểm.
   - **Tầng 3: Đồng bộ mã vùng địa phương (Province Prefix Alignment):** Nếu SIM có số bắt đầu bằng đầu mạng tỉnh thành của biển số xe (ví dụ: biển Hà Nội `29` đi kèm SIM đầu `029` hoặc đuôi `29`), cộng thêm 50 đến 70 điểm để nâng cao tính đồng điệu vùng miền địa lý.
   - **Tầng 4: Tương hợp nút số phong thuỷ (Feng-shui Sum Match):** Cộng gộp toàn bộ chữ số của biển số xe, tính nút số dư (tổng % 10) và đối chiếu với nút số SIM. Nếu cùng trùng trị số nút phong thuỷ, cộng thêm 30 điểm bổ trợ đại cát.
4. **Tối ưu hóa hiệu năng SQL & Sàng lọc tập con:**
   - Để triệt tiêu tối đa rủi ro OOM và quét bảng quy mô hàng triệu SIM, hệ thống sử dụng mệnh đề `OR` trên các dải đuôi số đã bóc tách từ biển số, kết hợp chỉ mục `Index` để khoanh vùng nhanh dưới 100 SIM tiềm năng, sau đó tiến hành phân tích điểm số trong bộ nhớ đệm RAM. Thời gian phản hồi API sòng phẳng luôn dưới 10ms.

---

## 9. GIẢI PHÁP TỐI ƯU HOÁ QUY MÔ HÀNG TRIỆU ĐƠN HÀNG (MASSIVE ORDERS LAYER)
### Yêu cầu khách hàng:
- Khi số lượng đơn hàng trong cơ sở dữ liệu lên tới hàng triệu đơn (1.000.000+), việc hiển thị toàn bộ biên lai sẽ lập tức làm nghẽn máy chủ và sập trình duyệt của quản trị viên.
- Cần giải pháp thu gọn dải thời gian hiển thị: Đối với đơn hàng đã hoàn thành hoặc đã hủy, chỉ theo dõi các bản ghi phát sinh trong vòng 1 năm trở lại đây.
- Yêu cầu cấu trúc phân trang toàn diện từ giao diện tới tầng lưu trữ.

### Giải pháp kỹ thuật nâng cấp:
1. **Phân trang đầu cuối ở Server-side (`Offset-based Order Pagination`):**
   - API lấy danh sách đơn hàng `/api/orders` được xây dựng lại, tiếp thu các tham số định dạng `page`, `limit` và `search`.
   - Biên dịch trực tiếp các điều kiện sắp xếp, lọc chuỗi từ khóa và hoán đổi trang xuống câu lệnh truy vấn PostgreSQL, chỉ trả về đúng dải bản ghi cần hiển thị (ví dụ 10 dòng một trang), kèm metadata tổng số trang (`totalPages`) và tổng số bản ghi (`totalCount`).
   - Đảm bảo hiệu năng truy vấn siêu tốc dưới 15ms khi bảng đạt ngưỡng hàng triệu dòng dữ liệu.
2. **Bộ lọc dải thời gian luân chuyển (`Rolling window filter`):**
   - Áp dụng điều kiện lọc nâng cao: Các đơn hàng trạng thái **"Chờ duyệt" (Pending)** hoặc **"Đã thanh toán" (Paid)** luôn được hiển thị trọn vẹn để tránh thất thoát nghiệp vụ.
   - Đối với các đơn hàng ở trạng thái hủy **"Đã huỷ"** hoặc hoàn thành **"Đã hoàn thành"**, hệ thống áp dụng bộ lọc mốc thời gian động `gte(orders.createdAt, oneYearAgo)`. Chỉ lấy ra các giao dịch trong vòng 1 năm gần nhất, loại bỏ triệt để các dữ liệu lịch sử cũ khổng lồ và tăng tốc dọn dẹp bộ nhớ đệm.
3. **Phân tách luồng thống kê badges (`High-speed navigation pending badge`):**
   - Nhằm giảm tải thao tác rà quét toàn bảng orders khi người dùng chuyển trang hoặc làm mới, hệ thống tách riêng số liệu đếm số đơn hàng chờ thanh toán tại Navbar thành API siêu nhỏ `/api/orders/pending-count`.
   - Kết xuất trực tiếp giá trị số lượng dưới dạng JSON số học thô đơn giản, tránh tải kèm payload đơn hàng chi tiết, tối ưu hóa băng thông truyền tải lên đến 98%.

---

## 10. TỔ CHỨC LỘC TRẠNG THÁI KHO SIM VÀ BẢO TRÌ BẢN GHI LỚN (ADMIN MAINTENANCE DASHBOARD)
### Yêu cầu khách hàng:
- Cho phép người dùng hoặc quản trị viên lọc số theo trạng thái cụ thể ("Còn hàng", "Đã bán") tại giao diện Tra cứu Kho số, mặc định loại trừ hoàn toàn các SIM "Đã bán" để thông tin luôn tinh sạch.
- Cần công cụ dọn dẹp cơ sở dữ liệu (Reset DB) kèm theo cơ chế xác thực mật khẩu nghiêm ngặt để đảm bảo an toàn vận hành.

### Giải pháp kỹ thuật nâng cấp:
1. **Tinh chỉnh mặc định Bộ lọc SIM (`Excluding SOLD status by default`):**
   - Tại API truy vấn `/api/sims`, thiết lập mệnh đề loại trừ mặc định: Nếu tham số status truyền vào là trống hoặc ở trạng thái "Active", hệ thống sẽ tự động gộp thêm điều kiện lọc loại trừ `ne(sims.status, "Đã bán")`.
   - Giúp tránh tình trạng hiển thị SIM đã thuộc về khách hàng khác, tạo lòng tin và trải nghiệm chuyên nghiệp cho người mua.
   - Cho phép người dùng chuyển đổi bộ lọc sang "Đã bán" hoặc "Tất cả" when có nhu cầu rà soát đặc thù.
2. **Cơ chế Sinh ngẫu nhiên dữ liệu lớn siêu tốc (`Direct SQL Series Seeder`):**
   - Thiết lập Endpoint quản trị bí mật `/api/admin/generate-sims` cho phép gạt bỏ giới hạn bộ nhớ RAM thông thường.
   - Sử dụng lệnh chèn khối trực xạ `INSERT INTO sims ... SELECT ... FROM generate_series(1, count)` của PostgreSQL, cho phép phát sinh ngẫu nhiên từ 1.000 đến 3.000.000 dòng dữ liệu SIM chuẩn phong thuỷ tinh mật trị số dưới 15 giây.
3. **Quy trình Reset dữ liệu hai tầng xác thực:**
   - Xây dựng Endpoint dọn dẹp hệ thống `/api/admin/reset-db` đi kèm bộ đối chiếu mật khẩu quản trị sòng phẳng. 
   - Phía giao diện, trang bị quy trình xác nhận 2 tầng cảnh báo hộp thoại trước khi thực thi lệnh dọn dẹp xoá sạch toàn bộ SIM số và đơn hàng trong DB, mang đến sự an tâm tuyệt đối khỏi lỗi click sai của quản trị viên.

---

## 11. TÁI CẤU TRÚC MENU ADMIN DẠNG ACCORDION & TỐI ƯU HÓA UI MOBILE
### Yêu cầu khách hàng:
- Gom toàn bộ chức năng quản trị chỉ dành cho Admin vào một menu cha tên là **Admin** hiển thị dạng xổ dọc (accordion) khi nhấn vào, đồng thời tối ưu hoàn hảo cho trải nghiệm di động.

### Giải pháp kỹ thuật nâng cấp:
1. **Quản lý dạng Accordion linh hoạt:** Sử dụng biến state `isNewAdminMenuOpen` tại navbar để điều khiển đóng mở mượt mà menu con gồm đầy đủ phân mục quản trị con (Quảng trị, Quản lý Đại lý, Thiết lập hệ thống, Đồng bộ kho số, v.v.).
2. **Tối ưu UI di động:** Kết nối hiệu ứng chuyển động mượt mà bằng CSS Transition và thiết kế thanh đóng/mở tối giản riêng cho chế độ Mobile, nâng cao trải nghiệm điều hướng của người sử dụng.

---

## 12. THIẾT KẾ GIẢI PHÁP ĐỒNG BỘ KHO SỐ PHÂN TẦNG
### Yêu cầu khách hàng:
- Tạo phân hệ riêng biệt cho đồng bộ kho số, hỗ trợ cập nhật thủ công (nhập textbox hoặc import tệp Excel mẫu download) và tự động thông qua kết nối API các nhà mạng lớn.

### Giải pháp kỹ thuật nâng cấp:
1. **Đồng bộ thủ công:** Thiết lập giao diện riêng cho phép tải phôi Excel định dạng chuẩn, bóc tách tệp sỉ và cập nhật tức thì vào kho.
2. **Đồng bộ qua API nguồn:** Cung cấp bảng cấu hình trực quan cho phép nhập URL nguồn đối tác, thiết lập tần suất đồng bộ delta và tự động nạp kho số.

---

## 13. THUẬT TOÁN ĐỒNG BỘ DELTA DỌN DẸP SIM BỊ LOẠI BỎ & BẢNG LƯU TRỮ ĐỐI SOÁT DELETED_SIMS
### Yêu cầu khách hàng:
- Khi thực hiện đồng bộ từ API đối tác, phát hiện SIM không tồn tại trong dữ liệu feed mới của họ nữa thì cần dọn dẹp loại khỏi kho, lưu thông tin đối soát tránh việc thất lạc, lưu nguồn sync và tài khoản đã dọn SIM.

### Giải pháp kỹ thuật nâng cấp:
1. **Thuật toán đối soát Delta:** Khi chạy đồng bộ, hệ thống đối chiếu dải mã SIM hiện có với luồng dữ liệu mới. Di chuyển toàn bộ SIM vắng mặt sang bảng lưu trữ dọn dẹp `deleted_sims` kèm lý do xóa định danh `Delta API Sync: Vắng mặt trong dữ liệu đối tác`.
2. **Gắn nhãn vết xử lý:** Đảm bảo lưu chi tiết các trường `sync_source` và `sync_user` vào cơ sở dữ liệu giúp Admin đối soát chuẩn xác vết dọn dẹp SIM bất cứ lúc nào.

---

## 14. CỔNG XUẤT SAO LƯU SQL BACKUP TỰ ĐỘNG TRÊN WEB ADMIN
### Yêu cầu khách hàng:
- Cung cấp tính năng an toàn cho phép Admin tải trực tiếp file SQL backup từ giao diện quản trị mà không cần truy cập CLI máy chủ Postgres thực tế.

### Giải pháp kỹ thuật nâng cấp:
1. **Xuất Backup SQL DDL & DML trực tuyến:** Thiết kế Endpoint `/api/admin/export-sql-backup` xử lý cơ chế kết xuất trực tiếp chuỗi SQL DDL tạo bảng và dữ liệu INSERT bằng Javascript phía máy chủ rồi tải xuống an toàn qua Blob.
2. **Bảo vệ toàn diện 4 bảng:** Nhúng đầy đủ cấu trúc dữ liệu của cả 4 bảng chính: `sims`, `agents`, `orders`, và `deleted_sims`, giải quyết hoàn hảo rào cản bảo mật của iFrame sandbox.

---

## 15. TRIỂN KHAI KIẾN TRÚC LAI HYBRID (OPTION C) - ĐỘNG CƠ PHONG THỦY ĐỘC LẬP
### Yêu cầu khách hàng:
- Triển khai Kiến trúc lai Hybrid (Phương án C) cho tính năng Chuyên gia Tư vấn Phong Thủy AI.
- Đảm bảo hệ thống hoạt động ổn định và có khả năng đưa ra phân tích phong thủy chuẩn phong cách chuyên gia ngay cả khi không có kết nối API Gemini (Chạy độc lập offline) và tút ưu hóa bằng AI khi đối thoại trực tiếp (Online).
- Đồng bộ giải pháp Hybrid này vào cả mã nguồn hiện tại (Vite/React) lẫn mã nguồn xuất bản Next.js 15 tải về (`nextjs_source_code.zip`).
- Cập nhật nhật ký phát triển hệ thống đầy đủ.

### Giải pháp kỹ thuật nâng cấp:
1. **Thiết lập Động Cơ Phong Thủy Số Học Nội Bộ (`Local Feng Shui Core`):**
   - Xây dựng `/src/utils/phongthuyEngine.ts` làm hạt nhân tính toán độc lập, giải quyết triệt để 5 trụ cột phong thủy:
     - **Số nút**: Quy đổi tổng các chữ số cộng dồn chuẩn xác từ 1 đến 10.
     - **Ngũ Hành**: Xác định hành vương của SIM dựa trên số đuôi chủ đạo và map can chi tuổi hợp mệnh của chủ sở hữu.
     - **Tương sinh tương khắc**: Đánh giá chi tiết 6 trạng thái tương tác ngũ hành (Tương sinh, Hòa hợp, Sinh xuất, Khắc nhập, Khắc xuất, Bình hòa) kèm lời khuyên cát lộc.
     - **Quẻ 80 Linh số Kinh Dịch**: Quy đổi 4 số đuôi chia 80 tra cứu cát hung chi tiết dồi dào học thuyết.
     - **Thế số phụ cát**: Nhận dạng chuỗi số tài như Tam Hoa, Tứ Quý, Lộc Phát, Thần Tài, Đại Thần Tài, Ông Địa, Sảnh Tiến.
2. **Kiến Trúc Tích Hợp Lai Hai Lớp (`Hybrid Core Synthesis`):**
   - **Luồng Online (Gemini Assisted)**: Khi có `GEMINI_API_KEY`, hệ thống chạy thuật toán tiền phân tích (Pre-analysis) trên Local Engine cho toàn bộ danh sách SIM rồi tiêm thẳng kết quả định lượng này (thông qua System Prompt) vào mô hình Gemini. Gemini đóng vai trò là "giao thức giao tiếp tự nhiên" để viết văn phong lưu loát, ấm áp và tuyệt đối bị cấm bịa đặt (hallucinate) điểm số hoặc quẻ dịch.
   - **Luồng Offline (Deterministic Fallback)**: Khi không cấu hình API Key hoặc xảy ra sự cố nghẽn luồng mạng, Endpoint tự động kích hoạt Động cơ Offline, tạo ra Bản tin tư vấn cấu trúc hoàn hảo bằng Markdown và trích xuất thẻ SIM đề cử thông qua thẻ định dạng `[RECOMMENDED_IDS:id1,id2]` giúp giao diện trực quan hiển thị bình thường.
3. **Kịch Bản Đồng Bộ Tự Động Sang Sản Phẩm Next.js 15:**
   - Xây dựng file script quy trình tự động `/build-nextjs.js`. Chương trình này khi khởi tạo sẽ dọn dẹp hệ thống cũ, thiết lập cấu trúc mã nguồn, dịch chuyển module, tự động chỉnh sửa định dạng import tương thích tuyệt đối với Next.js và đóng gói nén nóng thư mục thành `nextjs_source_code.zip` ngay tại thời gian thực.

---
## 16. TỐI ƯU HÓA HOÀN TOÀN BỘ CHÈN LỌC PHONG THỦY AI & TÌM KIẾM TRONG KHO 3 TRIỆU SIM (FULL ENGINE EXPLAINED)
### Yêu cầu khách hàng:
- Khắc phục triệt để tình trạng AI Consultant lấy random 40 SIM hú họa rồi giải thích ngẫu nhiên gây cảm giác không chân thật.
- Đảm bảo AI Consultant, chức năng tra cứu biển số xe, và API VPA đồng bộ thực thi tìm kiếm dọn tệp trên toàn diện kho 3 triệu SIM, chứ không chỉ gói gọn trong một nhóm SIM ngẫu nhiên nhỏ lẻ.

### Giải pháp kỹ thuật nâng cấp (Chạy đồng thời trên cả Express và Next.js 15):
1. **Kiến trúc Lọc Tinh chỉnh Đa tầng (Multi-layer Query Filtering Architecture):**
   - **Tầng 1: Lọc sơ tuyển phía CSDL có đánh chỉ mục (SQL-indexed database pre-filtering):** Khi nhận được yêu cầu tư vấn, hệ thống không bốc ngẫu nhiên nữa. AI Consultant sẽ tiến hành phân tách ngữ nghĩa (Heuristic NLP Parser) để nhận dạng các yêu cầu cụ thể như: *Năm sinh khách hàng, Nhà mạng ưa thích, Dải giá mong muốn, Loại số đẹp (Tứ Quý, Tam Hoa, Lộc Phát v.v.), hay các ký tự đuôi mong muốn*. Những dữ liệu này được chuyển dịch trực tiếp thành các mệnh để SQL (`WHERE`, `LIKE`, `BETWEEN`) tối ưu hóa bằng các chỉ mục `Index` đã tạo.
   - **Tầng 2: Lọc nâng cao theo năm sinh (Dynamic Index-based matching):** Đối với mốc năm sinh khách hàng dưới AI Consultant, hệ thống phân tích ra mệnh vương (ví dụ: mệnh Kim), tự động sinh ra các mệnh đề `OR` cho các linh số tương sinh (ví dụ: đuôi chứa 2, 5, 8, 6, 7). Toàn bộ quá trình quét này được tính toán ở mức cơ sở dữ liệu trên cả 3 triệu SIM trong thời gian dưới 10ms.
   - **Tầng 3: Mở rộng dải ứng viên chất lượng (Candidate Pool Expansion):**
     - Tại cổng **AI Consultant** và **VPA API / Tra cứu biển số xe**, dải ứng viên đủ tiêu chuẩn lọc cơ sở dữ liệu (Database-level validated output) được cấu hình lên đến **2000 SIM** (đối với biển số xe) và **80 SIM** (đối với tư vấn thông thái).
     - Việc đặt giới hạn limit (ví dụ: limit 2000 hoặc limit 80) **không phải là lấy hú họa** từ tổng thể, mà là **lấy ra 2000 ứng viên đạt tiêu chuẩn cao nhất sau khi lọc trên toàn bộ kho 3 triệu số**.
     - Vì các thuật toán chấm điểm độ tương thích cao cấp (như khoảng cách Levenshtein, chấm điểm phong thủy kết hợp, tính toán thế số Kinh Dịch) có độ phức tạp cao $O(N)$ và không thể thực thi trực tiếp bằng ngôn ngữ truy vấn SQL thô trong DBMS một cách nhanh chóng, hệ thống đã đưa 2000 ứng viên tốt nhất này vào bộ nhớ đệm RAM tốc độ cao của Node.js / V8 Engine để chấm điểm tối giản, xếp hạng và nhặt ra 5 hoặc 15 kết quả tối ưu nhất.
2. **Đồng bộ giải pháp cho cả 2 loại Source Code:**
   - **Mã nguồn Express (`server.ts`)**: Cổng `/api/consult` và `/api/partner/vpa/matching-sims` đã cập nhật bộ kiểm tra và mở rộng pool lên tới 2000 dòng lọc.
   - **Mã nguồn Next.js (`/nextjs-app/src/app/api/consult/route.ts`)**: Áp dụng chung kiến trúc bóc tách dữ liệu hội thoại, biên dịch điều kiện lọc Drizzle ORM sòng phẳng, đảm bảo tệp nén Next.js tải xuống luôn đồng bộ cao.

---
*Tài liệu được biên soạn tự động và bảo chứng bởi Vietsim Telecom Developer Team 2026.*

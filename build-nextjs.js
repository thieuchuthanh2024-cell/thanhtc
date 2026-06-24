import fs from "fs";
import path from "path";
import * as archiverModule from "archiver";

console.log("=== BẮT ĐẦU QUY TRÌNH BIÊN DỊCH & SYNC SANG NEXT.JS ===");

const workspaceRoot = process.cwd();
const nextjsRoot = path.join(workspaceRoot, "nextjs-app");
const srcComponentsDir = path.join(workspaceRoot, "src", "components");
const targetComponentsDir = path.join(nextjsRoot, "src", "components");

// 1. Khởi tạo cấu trúc các thư mục quan trọng
const dirsToEnsure = [
  path.join(nextjsRoot, "src"),
  path.join(nextjsRoot, "src", "components"),
  path.join(nextjsRoot, "src", "app"),
  path.join(nextjsRoot, "src", "app", "api"),
  path.join(nextjsRoot, "src", "utils")
];

dirsToEnsure.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`+ Khởi tạo thư mục: ${dir}`);
  }
});

// Helper to transform relative imports to absolute Next.js alias paths
function transformImports(content) {
  let result = content;
  
  // Thêm "use client" vào đầu nếu chưa có
  if (!result.trim().startsWith('"use client"') && !result.trim().startsWith("'use client'")) {
    result = `"use client";\n\n` + result;
  }

  // Thay thế đường dẫn import
  result = result.replace(/import\s+(.*?)\s+from\s+["']\.\.\/types["']/g, 'import $1 from "@/types"');
  result = result.replace(/import\s+(.*?)\s+from\s+["']\.\/components\/(.*?)["']/g, 'import $1 from "@/components/$2"');
  result = result.replace(/import\s+(.*?)\s+from\s+["']\.\/([A-Z].*?)["']/g, 'import $1 from "@/components/$2"');
  result = result.replace(/import\s+(.*?)\s+from\s+["']\.\/types["']/g, 'import $1 from "@/types"');
  result = result.replace(/import\s+(.*?)\s+from\s+["']\.\.\/utils\/phongthuyEngine["']/g, 'import $1 from "@/utils/phongthuyEngine"');

  // Thêm bọc check ssr cho window/localStorage nếu cần
  return result;
}

// 2. Chép toàn bộ các Components sang Next.js và chèn "use client"
if (fs.existsSync(srcComponentsDir)) {
  const compFiles = fs.readdirSync(srcComponentsDir);
  compFiles.forEach(file => {
    if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      const srcPath = path.join(srcComponentsDir, file);
      const destPath = path.join(targetComponentsDir, file);
      
      let content = fs.readFileSync(srcPath, "utf-8");
      content = transformImports(content);
      
      fs.writeFileSync(destPath, content, "utf-8");
      console.log(`  -> Sao chép component: ${file}`);
    }
  });
}

// 3. Sao chép và biên dịch src/App.tsx thành AppPageClient.tsx trong Next.js
const appFile = path.join(workspaceRoot, "src", "App.tsx");
if (fs.existsSync(appFile)) {
  let content = fs.readFileSync(appFile, "utf-8");
  content = transformImports(content);
  
  // Chuyển hướng các API endpoint về local app server nếu cần (đã giữ tương thích nguyên bản)
  const destAppPageClient = path.join(nextjsRoot, "src", "app", "AppPageClient.tsx");
  fs.writeFileSync(destAppPageClient, content, "utf-8");
  console.log("  -> Tạo AppPageClient.tsx từ nguồn App.tsx thành công!");
}

// 4. Tạo file index page.tsx chính cho Next.js
const destPageMain = path.join(nextjsRoot, "src", "app", "page.tsx");
const pageMainContent = `"use client";

import AppPageClient from "./AppPageClient";

export default function NextJSAppEntryPage() {
  return <AppPageClient />;
}
`;
fs.writeFileSync(destPageMain, pageMainContent, "utf-8");
console.log("  -> Tạo root page.tsx thành công!");

// 5. Đóng gói ZIP file nextjs_source_code.zip bằng Archiver
function zipNextJSFolder() {
  return new Promise((resolve, reject) => {
    console.log("\n📦 Đang nén thư mục nextjs-app thành file nextjs_source_code.zip...");
    
    const zipPath = path.join(workspaceRoot, "nextjs_source_code.zip");
    const output = fs.createWriteStream(zipPath);
    const archive = new archiverModule.ZipArchive({ zlib: { level: 9 } });

    output.on("close", () => {
      console.log(`✅ Thành công! Đã ghi file sản phẩm: nextjs_source_code.zip (${archive.pointer()} bytes)`);
      resolve(true);
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Chèn toàn bộ thư mục nextjs-app vào trong zip (không bao bọc thư mục cha nextjs-app nếu người dùng thích giải nén trực diện)
    // Để nguyên cấu trúc Next.js chuẩn tiện dụng
    archive.directory(nextjsRoot, false);

    archive.finalize();
  });
}

zipNextJSFolder()
  .then(() => {
    console.log("=== KHỞI TẠO VÀ ĐÓNG GÓI HYBRID ARCHITECTURE NEXT.JS THÀNH CÔNG RỰC RỠ ===");
  })
  .catch(err => {
    console.error("❌ Lỗi trong quá trình nén và đóng gói ZIP:", err);
  });

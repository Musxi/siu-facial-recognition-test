# 68344042-4 Face Guard System Documentation / 人脸防护系统文档

## 1. Project Overview / 项目概述

**Face Guard** is a professional, browser-based real-time face recognition and analysis system. Unlike traditional solutions that rely on heavy server-side processing, this project runs entirely on the client side using **TensorFlow.js**.

**Face Guard** 是一个专业的、基于浏览器的实时人脸识别与分析系统。与依赖繁重服务器端处理的传统方案不同，本项目使用 **TensorFlow.js** 完全在客户端运行。

### Key Features / 核心特性

*   **🛡️ Privacy & Persistence / 隐私与持久化**
    *   **Local Storage**: All registered faces are saved in your browser's LocalStorage. Data **persists** even after you close or reload the page.
    *   **No Cloud Upload**: Biometric data remains 100% on your device.
    *   **本地存储**: 所有注册的人脸信息均保存在浏览器的 LocalStorage 中。即使关闭或刷新页面，数据**依然可用**。
    *   **无云端上传**: 生物特征数据 100% 保留在您的设备上。

*   **🧠 Active Learning & Tuning / 主动学习与调优**
    *   Supports dynamic registration of multiple face angles. Includes a real-time threshold slider to balance between False Positives and False Negatives.
    *   支持为同一身份动态注册多个角度的人脸。包含实时阈值滑块，用于在误报和漏报之间取得平衡。

*   **👤 Biometric Analysis / 生物特征分析**
    *   Beyond recognition, the system estimates **Age**, **Gender**, and **Facial Expressions** in real-time.
    *   除识别外，系统还能实时估算**年龄**、**性别**和**面部表情**。

*   **📊 Visualization & Localization / 可视化与本地化**
    *   Bilingual interface (English/Chinese) with responsive charts for detection frequency and confidence trends.
    *   支持双语界面（中/英），并提供识别频率和置信度趋势的响应式图表。

---

## 2. Technical Principles / 技术原理

The system operates on a pipeline of neural networks powered by `face-api.js`:
本系统基于 `face-api.js` 运行由多个神经网络组成的流水线：

### 2.1 The AI Pipeline / AI 流水线

1.  **Face Detection (SSD MobileNet V1)**
    *   **Function**: Locates face bounding boxes.
    *   **功能**: 定位人脸边界框。

2.  **Face Landmark 68 Net**
    *   **Function**: Aligns facial geometry (eyes, nose, mouth).
    *   **功能**: 对人脸进行几何对齐（眼睛、鼻子、嘴巴）。

3.  **Face Recognition (ResNet-34)**
    *   **Function**: Extracts a 128-d feature vector ("Face Fingerprint") for matching.
    *   **功能**: 提取128维特征向量（“人脸指纹”）用于匹配。

4.  **Demographics & Expressions (Tiny Xception)**
    *   **Function**: Classification layers for Age, Gender, and 7 basic emotions (Happy, Sad, Angry, etc.).
    *   **功能**: 用于年龄、性别和7种基本情绪（开心、悲伤、愤怒等）的分类层。

### 2.2 Matching Logic / 匹配逻辑

The system identifies users by calculating the **Euclidean Distance** between the real-time vector and stored vectors.
系统通过计算实时向量与存储向量之间的 **欧氏距离** 来识别用户。

*   **Threshold**: Adjustable (Default 0.55). Lower = Stricter.
*   **Threshold (阈值)**: 可调节（默认 0.55）。数值越低，匹配越严格。
*   **Optimization**: The system caches the AI Matcher and only rebuilds it when necessary, ensuring smooth 30FPS performance.
*   **优化**: 系统会缓存 AI 匹配器，仅在必要时重建，确保流畅的 30FPS 性能。

---

## 3. Deployment Guide (Cloudflare via GitHub) / 部署指南

**CRITICAL: Use "Pages", not "Workers".**
**关键：请使用 "Pages"，而非 "Workers"。**

If you see "Hello World" or cannot find "Build output directory", you created a **Worker** instead of a **Page**.
如果您看到 "Hello World" 或者找不到“构建输出目录”选项，说明您错误地创建了 **Worker** 而不是 **Page**。

### Correct Steps / 正确步骤

1.  **Push Code**: Ensure `index.html` and `package.json` are on GitHub.
    **提交代码**: 确保 `index.html` 和 `package.json` 已提交至 GitHub。

2.  **Cloudflare Dashboard**:
    *   Log in and go to **Workers & Pages**.
    *   Click **Create application** (创建应用).
    *   **CLICK THE "PAGES" TAB** (点击 "PAGES" 标签页) - *Do not stay on the Workers tab*.
    *   Click **Connect to Git** (连接到 Git).

3.  **Build Settings / 构建设置**:
    *   **Framework Preset**: `Vite` or `React`
    *   **Build command**: `npm run build`
    *   **Build output directory**: `dist`

### Troubleshooting / 故障排除

**Error**: `CLOUDFLARE_API_TOKEN` missing...
**Solution**: Ensure Build Command is `npm run build`, NOT `npm run deploy`.
**解决方案**: 确保构建命令是 `npm run build`，而不是 `npm run deploy`。

---

## 4. Usage Guide / 使用指南

### Step 1: Initialization / 初始化
1.  Allow camera access.
2.  Wait for "Initializing Neural Networks" (includes downloading ~10MB of weights).
1.  允许摄像头访问。
2.  等待“正在初始化神经网络”（需下载约 10MB 权重文件）。

### Step 2: Configuration / 配置
1.  Go to **CONFIG** (配置) tab.
2.  Register a new ID or manage existing samples.
3.  Use the **Threshold Slider** to adjust sensitivity.
1.  进入 **配置** 标签页。
2.  注册新身份或管理现有样本。
3.  使用 **阈值滑块** 调节灵敏度。

### Step 3: Monitoring / 监控
1.  Go to **MONITOR** (实时监控) tab.
2.  View real-time recognition, age/gender estimates, and logs.
1.  进入 **实时监控** 标签页。
2.  查看实时识别、年龄/性别估算以及日志。
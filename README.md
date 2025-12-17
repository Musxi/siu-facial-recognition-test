# 68344042-4 Face Guard System Documentation / 人脸防护系统文档

## 1. Project Overview / 项目概述

**Face Guard** is a professional, browser-based real-time face recognition system. Unlike traditional solutions that rely on heavy Python backends, this project runs entirely on the client side using **TensorFlow.js**.

**Face Guard** 是一个专业的、基于浏览器的实时人脸识别系统。与依赖繁重 Python 后端的传统方案不同，本项目使用 **TensorFlow.js** 完全在客户端运行。

### Key Features / 核心特性

*   **🛡️ Privacy First / 隐私优先**
    *   All biometric data (images and feature vectors) is processed and stored locally in the browser's memory. No data is sent to any server.
    *   所有生物特征数据（图像和特征向量）均在浏览器内存中本地处理和存储。没有任何数据会被发送到服务器。

*   **🧠 Active Learning / 主动学习**
    *   Supports dynamic registration of multiple face angles for a single identity. The system learns and improves accuracy over time as you add more samples.
    *   支持为同一身份动态注册多个角度的人脸。随着样本的增加，系统会不断学习并提高识别准确率。

*   **📊 Real-time Visualization / 实时可视化**
    *   Features a responsive dashboard with live confidence streams, detection frequency charts, and recognition confidence trends.
    *   具备响应式仪表盘，提供实时置信度数据流、识别频率图表以及识别置信度趋势图。

---

## 2. Technical Principles / 技术原理

The system operates on a pipeline of neural networks powered by `face-api.js`:
本系统基于 `face-api.js` 运行由多个神经网络组成的流水线：

### 2.1 The AI Pipeline / AI 流水线

1.  **Face Detection (SSD MobileNet V1)**
    *   **Function**: Locates the bounding box of faces in the video frame.
    *   **功能**: 定位视频帧中人脸的边界框。

2.  **Face Landmark 68 Net**
    *   **Function**: Aligns the face geometrically (eyes, nose, mouth).
    *   **功能**: 对人脸进行几何对齐（眼睛、鼻子、嘴巴）。

3.  **Face Recognition (ResNet-34)**
    *   **Function**: Extracts the unique "Fingerprint" (128-d vector) for matching.
    *   **功能**: 提取人脸的唯一“指纹”（128维向量）用于匹配。

### 2.2 Matching Logic & Optimization / 匹配逻辑与优化

The system identifies users by calculating the **Euclidean Distance** between the real-time vector and stored vectors.
系统通过计算实时向量与存储向量之间的 **欧氏距离** 来识别用户。

*   **Threshold**: 0.55 (Adjustable in code). Distance < 0.55 matches the user.
*   **Optimization**: The system caches the AI Matcher and only rebuilds it when you add/delete users or samples, ensuring smooth 30FPS performance.
*   **优化**: 系统会缓存 AI 匹配器，仅在您添加/删除用户或样本时才重建，确保流畅的 30FPS 性能。

---

## 3. Deployment Guide (Cloudflare via GitHub) / 部署指南 (通过 GitHub)

**CRITICAL: READ THIS TO AVOID DEPLOYMENT ERRORS**
**关键：请阅读此部分以避免部署错误**

If you see "Hello World" or cannot find "Build output directory", you created a **Worker** instead of a **Page**.
如果您看到 "Hello World" 或者找不到“构建输出目录”选项，说明您错误地创建了 **Worker** 而不是 **Page**。

### Correct Steps / 正确步骤

1.  **Update Code**: Ensure `index.html` (cleaned version) is pushed to GitHub.
    **更新代码**: 确保已将修复后的 `index.html` 推送到 GitHub。

2.  **Cloudflare Dashboard**:
    *   Log in and go to **Workers & Pages**.
    *   Click **Create application** (创建应用).
    *   **CLICK THE "PAGES" TAB** (点击 "PAGES" 标签页) - *Do not stay on the default Workers tab*.
    *   Click **Connect to Git** (连接到 Git).

3.  **Setup Build / 设置构建**:
    *   Select your repository.
    *   **Project Name**: `face-guard` (or your choice).
    *   **Framework Preset**: Select **Vite** or **React**.
    *   **Build command**: `npm run build`
    *   **Build output directory**: `dist`
        *   *(You MUST see this option. If not, go back and select "Pages")*
        *   *(您必须看到此选项。如果没有，请返回并选择 "Pages")*

4.  **Save and Deploy**:
    *   Click Deploy. Cloudflare will install dependencies and build your site.

### Troubleshooting: "CLOUDFLARE_API_TOKEN" Error
### 故障排除：API Token 错误

**Error**: `[ERROR] In a non-interactive environment, it's necessary to set a CLOUDFLARE_API_TOKEN...`

**Cause**: You set the Build Command to `npm run deploy` (which tries to use Wrangler).
**原因**: 您将构建命令设置为了 `npm run deploy`（该命令试图在构建器内部再次调用 Wrangler 进行部署）。

**Solution**:
1. Go to Cloudflare Dashboard -> Settings -> Build & deployments.
2. Change **Build command** to: `npm run build`
3. Retry deployment.
**解决方案**:
1. 进入 Cloudflare 控制台 -> 设置 -> 构建与部署。
2. 将 **构建命令 (Build command)** 修改为: `npm run build`
3. 重试部署。

---

## 4. Usage Guide / 使用指南

### Step 1: Initialization / 初始化
1.  Open the application URL.
2.  **Wait**: The screen will show "Initializing Neural Networks".
3.  **Permission**: Click "Allow" for camera access.

### Step 2: Registration / 注册身份
1.  Switch to the **CONFIG** tab.
2.  Enter a name and click **Register ID**.

### Step 3: Improving Accuracy (Active Learning) / 提高准确率（主动学习）
*To make the system smarter:*
1.  In the **CONFIG** tab, find your card.
2.  Click **+ Add Training Sample**.
3.  Turn your head slightly (Left, Right, Up) and add more samples.
4.  *The system will now recognize you from those angles too.*

### Step 4: Monitoring / 监控
1.  Switch back to the **MONITOR** tab.
2.  Walk around. The system should track your face.
